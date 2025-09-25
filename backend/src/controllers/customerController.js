// src/controllers/customerController.js
const { pool } = require('../config/database');
const logger = require('../utils/logger');
const { SUCCESS_MESSAGES, ERROR_MESSAGES, DEFAULT_VALUES } = require('../utils/constants');
const { sanitizePhone, isValidEmail } = require('../utils/helpers');

class CustomerController {
    // Search customers
    async searchCustomers(req, res, next) {
        try {
            const searchQuery = `%${req.query.q}%`;
            const limit = req.query.limit || DEFAULT_VALUES.MAX_SEARCH_RESULTS;
            
            const [rows] = await pool.execute(`
                SELECT id, first_name, last_name, phone, email, company, tags, created_at
                FROM customers 
                WHERE first_name LIKE ? OR last_name LIKE ? OR phone LIKE ? OR email LIKE ? OR company LIKE ?
                ORDER BY 
                    CASE 
                        WHEN CONCAT(first_name, ' ', last_name) LIKE ? THEN 1
                        WHEN phone LIKE ? THEN 2
                        WHEN email LIKE ? THEN 3
                        ELSE 4 
                    END,
                    first_name, last_name
                LIMIT ?
            `, [
                searchQuery, searchQuery, searchQuery, searchQuery, searchQuery,
                searchQuery, searchQuery, searchQuery, parseInt(limit)
            ]);
            
            res.json(rows);
        } catch (error) {
            logger.error('Customer search error:', error);
            next(error);
        }
    }

    // Get customer by ID
    async getCustomerById(req, res, next) {
        try {
            const [rows] = await pool.execute(`
                SELECT * FROM customers WHERE id = ?
            `, [req.params.id]);
            
            if (rows.length === 0) {
                return res.status(404).json({ error: ERROR_MESSAGES.NOT_FOUND });
            }
            
            // Get customer's booking history
            const [bookings] = await pool.execute(`
                SELECT id, date, time, party_size, service, status, created_at
                FROM bookings 
                WHERE customer_id = ?
                ORDER BY date DESC, time DESC
                LIMIT 10
            `, [req.params.id]);
            
            const customer = { ...rows[0], recent_bookings: bookings };
            res.json(customer);
        } catch (error) {
            logger.error('Error fetching customer:', error);
            next(error);
        }
    }

    // Create customer
    async createCustomer(req, res, next) {
        try {
            const {
                first_name, last_name, phone, email, company, tags, website, social_media, documents, notes
            } = req.body;
            
            // Sanitize phone number
            const sanitizedPhone = sanitizePhone(phone);
            
            // Validate email if provided
            if (email && !isValidEmail(email)) {
                return res.status(400).json({ error: 'Invalid email format' });
            }
            
            const [result] = await pool.execute(`
                INSERT INTO customers (first_name, last_name, phone, email, company, tags, website, social_media, documents, notes)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [first_name, last_name, sanitizedPhone, email, company, tags, website, social_media, documents, notes]);
            
            logger.info('Customer created:', { 
                customerId: result.insertId, 
                name: `${first_name} ${last_name}`,
                phone: sanitizedPhone 
            });
            
            res.status(201).json({ 
                id: result.insertId, 
                message: SUCCESS_MESSAGES.CUSTOMER_CREATED 
            });
        } catch (error) {
            if (error.code === 'ER_DUP_ENTRY') {
                res.status(409).json({ error: 'Customer with this phone number or email already exists' });
            } else {
                logger.error('Customer creation error:', error);
                next(error);
            }
        }
    }

    // Update customer
    async updateCustomer(req, res, next) {
        try {
            const updateFields = [];
            const updateValues = [];
            
            // Build dynamic update query
            Object.keys(req.body).forEach(key => {
                if (req.body[key] !== undefined && key !== 'id') {
                    updateFields.push(`${key} = ?`);
                    if (key === 'phone') {
                        updateValues.push(sanitizePhone(req.body[key]));
                    } else {
                        updateValues.push(req.body[key]);
                    }
                }
            });
            
            if (updateFields.length === 0) {
                return res.status(400).json({ error: 'No fields to update' });
            }
            
            updateValues.push(req.params.id);
            
            const [result] = await pool.execute(`
                UPDATE customers SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `, updateValues);
            
            if (result.affectedRows === 0) {
                return res.status(404).json({ error: ERROR_MESSAGES.NOT_FOUND });
            }
            
            logger.info('Customer updated:', { customerId: req.params.id });
            
            res.json({ message: SUCCESS_MESSAGES.CUSTOMER_UPDATED });
            
        } catch (error) {
            if (error.code === 'ER_DUP_ENTRY') {
                res.status(409).json({ error: 'Customer with this phone number or email already exists' });
            } else {
                logger.error('Customer update error:', error);
                next(error);
            }
        }
    }

    // Get all customers with pagination
    async getAllCustomers(req, res, next) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || DEFAULT_VALUES.PAGE_SIZE;
            const offset = (page - 1) * limit;
            
            // Get total count
            const [countResult] = await pool.execute('SELECT COUNT(*) as total FROM customers');
            const total = countResult[0].total;
            
            // Get customers
            const [customers] = await pool.execute(`
                SELECT id, first_name, last_name, phone, email, company, tags, created_at
                FROM customers 
                ORDER BY created_at DESC
                LIMIT ? OFFSET ?
            `, [limit, offset]);
            
            res.json({
                customers,
                pagination: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit)
                }
            });
        } catch (error) {
            logger.error('Error fetching customers:', error);
            next(error);
        }
    }
}

module.exports = new CustomerController();