// src/config/database.js
const mysql = require('mysql2/promise');
const config = require('./config');
const logger = require('../utils/logger');

let pool;

const createPool = () => {
    if (!pool) {
        pool = mysql.createPool(config.database);
        
        pool.on('connection', (connection) => {
            logger.info(`New database connection established as id ${connection.threadId}`);
        });
        
        pool.on('error', (err) => {
            logger.error('Database pool error:', err);
            if (err.code === 'PROTOCOL_CONNECTION_LOST') {
                createPool();
            } else {
                throw err;
            }
        });
    }
    return pool;
};

const initializeDatabase = async () => {
    try {
        const pool = createPool();
        const connection = await pool.getConnection();
        
        // Create database if it doesn't exist
        await connection.query(`CREATE DATABASE IF NOT EXISTS ${config.database.database}`);
        await connection.query(`USE ${config.database.database}`);
        
        // Create tables
        await createTables(connection);
        
        // Insert sample data if in development
        if (config.nodeEnv === 'development') {
            await insertSampleData(connection);
        }
        
        connection.release();
        logger.info('Database initialized successfully');
    } catch (error) {
        logger.error('Database initialization error:', error);
        throw error;
    }
};

const createTables = async (connection) => {
    const tables = [
        // Customers table
        `CREATE TABLE IF NOT EXISTS customers (
            id INT AUTO_INCREMENT PRIMARY KEY,
            first_name VARCHAR(100) NOT NULL,
            last_name VARCHAR(100) NOT NULL,
            phone VARCHAR(20) UNIQUE NOT NULL,
            email VARCHAR(255) UNIQUE,
            company VARCHAR(200),
            tags TEXT,
            website VARCHAR(255),
            social_media VARCHAR(255),
            documents VARCHAR(255),
            notes TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_phone (phone),
            INDEX idx_email (email),
            INDEX idx_name (first_name, last_name)
        )`,
        
        // Tables table
        `CREATE TABLE IF NOT EXISTS tables (
            id INT AUTO_INCREMENT PRIMARY KEY,
            table_number VARCHAR(10) UNIQUE NOT NULL,
            section ENUM('bistro', 'central', 'main-lounge', 'terrace') NOT NULL,
            capacity INT NOT NULL,
            status ENUM('available', 'occupied', 'maintenance') DEFAULT 'available',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_section (section),
            INDEX idx_capacity (capacity)
        )`,
        
        // Staff table
        `CREATE TABLE IF NOT EXISTS staff (
            id INT AUTO_INCREMENT PRIMARY KEY,
            first_name VARCHAR(100) NOT NULL,
            last_name VARCHAR(100) NOT NULL,
            email VARCHAR(255) UNIQUE NOT NULL,
            password VARCHAR(255) NOT NULL,
            role ENUM('host', 'server', 'manager', 'admin') DEFAULT 'server',
            section VARCHAR(50),
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_email (email),
            INDEX idx_role (role)
        )`,
        
        // Bookings table
        `CREATE TABLE IF NOT EXISTS bookings (
            id INT AUTO_INCREMENT PRIMARY KEY,
            customer_id INT NOT NULL,
            table_id INT,
            staff_id INT,
            date DATE NOT NULL,
            time TIME NOT NULL,
            party_size INT NOT NULL,
            duration INT NOT NULL DEFAULT 120,
            service ENUM('breakfast', 'lunch', 'brunch', 'dinner', 'late-night') NOT NULL,
            section ENUM('any', 'bistro', 'central', 'main-lounge', 'terrace') DEFAULT 'any',
            status ENUM('pending', 'confirmed', 'arrived', 'seated', 'completed', 'cancelled', 'no-show') DEFAULT 'pending',
            customer_name VARCHAR(200) NOT NULL,
            customer_phone VARCHAR(20) NOT NULL,
            customer_email VARCHAR(255),
            customer_company VARCHAR(200),
            tags TEXT,
            internal_notes TEXT,
            customer_notes TEXT,
            special_requirements TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
            FOREIGN KEY (table_id) REFERENCES tables(id) ON DELETE SET NULL,
            FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE SET NULL,
            INDEX idx_date_time (date, time),
            INDEX idx_customer (customer_id),
            INDEX idx_status (status),
            INDEX idx_service (service)
        )`,
        
        // Booking history table
        `CREATE TABLE IF NOT EXISTS booking_history (
            id INT AUTO_INCREMENT PRIMARY KEY,
            booking_id INT NOT NULL,
            action ENUM('created', 'updated', 'confirmed', 'cancelled', 'completed') NOT NULL,
            changed_by INT,
            old_values JSON,
            new_values JSON,
            notes TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
            FOREIGN KEY (changed_by) REFERENCES staff(id) ON DELETE SET NULL,
            INDEX idx_booking (booking_id),
            INDEX idx_action (action)
        )`
    ];
    
    for (const table of tables) {
        await connection.execute(table);
    }
    
    logger.info('Database tables created successfully');
};

const insertSampleData = async (connection) => {
    try {
        const bcrypt = require('bcryptjs');
        
        // Insert sample tables
        const tables = [
            ['T1', 'bistro', 2], ['T2', 'bistro', 4], ['T3', 'bistro', 6], ['T4', 'bistro', 8],
            ['T10', 'central', 2], ['T11', 'central', 4], ['T12', 'central', 6], ['T13', 'central', 8],
            ['T20', 'main-lounge', 4], ['T21', 'main-lounge', 6], ['T22', 'main-lounge', 8], ['T23', 'main-lounge', 10],
            ['T30', 'terrace', 2], ['T31', 'terrace', 4], ['T32', 'terrace', 6]
        ];

        for (const [number, section, capacity] of tables) {
            await connection.execute(
                'INSERT IGNORE INTO tables (table_number, section, capacity) VALUES (?, ?, ?)',
                [number, section, capacity]
            );
        }

        // Insert sample staff
        const staffMembers = [
            ['John', 'Doe', 'john.doe@restaurant.com', 'host', 'all'],
            ['Jane', 'Smith', 'jane.smith@restaurant.com', 'server', 'bistro'],
            ['Mike', 'Johnson', 'mike.johnson@restaurant.com', 'server', 'central'],
            ['Sarah', 'Wilson', 'sarah.wilson@restaurant.com', 'manager', 'all']
        ];

        const hashedPassword = await bcrypt.hash('password123', 10);
        
        for (const [firstName, lastName, email, role, section] of staffMembers) {
            await connection.execute(
                'INSERT IGNORE INTO staff (first_name, last_name, email, password, role, section) VALUES (?, ?, ?, ?, ?, ?)',
                [firstName, lastName, email, hashedPassword, role, section]
            );
        }

        // Insert sample customers
        const customers = [
            ['Margaret', 'Briggs', '+61412345678', 'margaret.briggs@email.com', 'ABC Corp', 'VIP,Regular'],
            ['Kim', 'Etcell', '+61423456789', 'kim.etcell@email.com', 'XYZ Ltd', 'Business'],
            ['Cathy', 'MacIntyre', '+61434567890', 'cathy.macintyre@email.com', null, 'Anniversary'],
            ['Karen', 'Lord', '+61445678901', 'karen.lord@email.com', 'Tech Solutions', 'Large Group'],
            ['Jennifer', 'Nunn', '+61456789012', 'jennifer.nunn@email.com', null, 'Birthday'],
            ['Vanessa', 'Gill', '+61467890123', 'vanessa.gill@email.com', 'Marketing Co', 'VIP']
        ];

        for (const [firstName, lastName, phone, email, company, tags] of customers) {
            await connection.execute(
                'INSERT IGNORE INTO customers (first_name, last_name, phone, email, company, tags) VALUES (?, ?, ?, ?, ?, ?)',
                [firstName, lastName, phone, email, company, tags]
            );
        }

        logger.info('Sample data inserted successfully');
    } catch (error) {
        logger.error('Error inserting sample data:', error);
    }
};

module.exports = {
    pool: createPool(),
    initializeDatabase,
    createTables,
    insertSampleData
};