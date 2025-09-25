// src/routes/tables.js
const express = require('express');
const { query, param } = require('express-validator');
const router = express.Router();

const { pool } = require('../config/database');
const logger = require('../utils/logger');
const { handleValidationErrors } = require('../middleware/validation');

// Get all tables
router.get('/', async (req, res, next) => {
    try {
        const [rows] = await pool.execute(`
            SELECT t.*, 
                   CASE WHEN b.id IS NOT NULL THEN 'occupied' ELSE t.status END as current_status
            FROM tables t
            LEFT JOIN bookings b ON t.id = b.table_id 
                AND b.date = CURDATE() 
                AND b.time <= CURTIME() 
                AND ADDTIME(b.time, SEC_TO_TIME(b.duration * 60)) > CURTIME()
                AND b.status IN ('confirmed', 'arrived', 'seated')
            ORDER BY t.section, t.table_number
        `);
        res.json(rows);
    } catch (error) {
        logger.error('Table retrieval error:', error);
        next(error);
    }
});

// Check table availability
router.get('/availability', [
    query('date').isDate().withMessage('Valid date is required'),
    query('time').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Valid time is required'),
    query('duration').isInt({ min: 30 }).withMessage('Valid duration is required'),
    query('party_size').isInt({ min: 1 }).withMessage('Valid party size is required'),
    query('section').optional().isIn(['bistro', 'central', 'main-lounge', 'terrace']).withMessage('Invalid section'),
    handleValidationErrors
], async (req, res, next) => {
    try {
        const { date, time, duration, party_size, section } = req.query;
        
        let sectionFilter = '';
        let params = [party_size, date, time, time, time, duration, time];
        
        if (section && section !== 'any') {
            sectionFilter = 'AND t.section = ?';
            params.push(section);
        }
        
        const [availableTables] = await pool.execute(`
            SELECT t.* FROM tables t
            WHERE t.capacity >= ? AND t.status = 'available'
            AND t.id NOT IN (
                SELECT DISTINCT table_id FROM bookings 
                WHERE table_id IS NOT NULL 
                AND date = ? 
                AND status NOT IN ('cancelled', 'completed')
                AND ((time <= ? AND ADDTIME(time, SEC_TO_TIME(duration * 60)) > ?) OR
                     (time < ADDTIME(?, SEC_TO_TIME(? * 60)) AND time >= ?))
            )
            ${sectionFilter}
            ORDER BY t.section, t.capacity, t.table_number
        `, params);
        
        res.json(availableTables);
    } catch (error) {
        logger.error('Table availability error:', error);
        next(error);
    }
});

// Get table by ID with current bookings
router.get('/:id', [
    param('id').isInt().withMessage('Valid table ID is required'),
    handleValidationErrors
], async (req, res, next) => {
    try {
        const [tables] = await pool.execute(`
            SELECT * FROM tables WHERE id = ?
        `, [req.params.id]);
        
        if (tables.length === 0) {
            return res.status(404).json({ error: 'Table not found' });
        }
        
        // Get current and upcoming bookings for this table
        const [bookings] = await pool.execute(`
            SELECT id, date, time, duration, party_size, customer_name, status
            FROM bookings 
            WHERE table_id = ? 
            AND date >= CURDATE()
            AND status NOT IN ('cancelled', 'completed')
            ORDER BY date, time
        `, [req.params.id]);
        
        res.json({
            ...tables[0],
            bookings
        });
    } catch (error) {
        logger.error('Error fetching table:', error);
        next(error);
    }
});

module.exports = router;
