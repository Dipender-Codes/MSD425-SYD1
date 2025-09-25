// src/routes/staff.js
const express = require('express');
const router = express.Router();

const { pool } = require('../config/database');
const logger = require('../utils/logger');
const { authenticateToken, requireRole } = require('../middleware/auth');

// Get all staff members
router.get('/', async (req, res, next) => {
    try {
        const [rows] = await pool.execute(`
            SELECT id, first_name, last_name, email, role, section, is_active, created_at
            FROM staff 
            WHERE is_active = true
            ORDER BY role, first_name
        `);
        res.json(rows);
    } catch (error) {
        logger.error('Staff retrieval error:', error);
        next(error);
    }
});

// Get staff member by ID
router.get('/:id', authenticateToken, async (req, res, next) => {
    try {
        const [rows] = await pool.execute(`
            SELECT id, first_name, last_name, email, role, section, is_active, created_at
            FROM staff 
            WHERE id = ?
        `, [req.params.id]);
        
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Staff member not found' });
        }
        
        res.json(rows[0]);
    } catch (error) {
        logger.error('Error fetching staff member:', error);
        next(error);
    }
});

module.exports = router;