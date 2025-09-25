// src/routes/analytics.js
const express = require('express');
const { query } = require('express-validator');
const router = express.Router();

const { pool } = require('../config/database');
const logger = require('../utils/logger');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { handleValidationErrors } = require('../middleware/validation');
const { getDateRange } = require('../utils/helpers');

// Dashboard analytics
router.get('/dashboard', authenticateToken, [
    query('date').optional().isDate().withMessage('Valid date is required'),
    query('period').optional().isIn(['day', 'week', 'month']).withMessage('Invalid period'),
    handleValidationErrors
], async (req, res, next) => {
    try {
        const date = req.query.date || new Date().toISOString().split('T')[0];
        const period = req.query.period || 'day';
        
        let dateCondition;
        let params;
        
        if (period === 'day') {
            dateCondition = 'date = ?';
            params = [date];
        } else {
            const { startDate, endDate } = getDateRange(period, date);
            dateCondition = 'date BETWEEN ? AND ?';
            params = [startDate, endDate];
        }
        
        // Basic statistics
        const [stats] = await pool.execute(`
            SELECT 
                COUNT(*) as total_bookings,
                SUM(CASE WHEN status = 'confirmed' THEN 1 ELSE 0 END) as confirmed_bookings,
                SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_bookings,
                SUM(CASE WHEN status = 'no-show' THEN 1 ELSE 0 END) as no_shows,
                AVG(party_size) as avg_party_size,
                SUM(party_size) as total_covers
            FROM bookings 
            WHERE ${dateCondition}
        `, params);
        
        // Service breakdown
        const [serviceBreakdown] = await pool.execute(`
            SELECT 
                service,
                COUNT(*) as count,
                SUM(party_size) as covers,
                ROUND(AVG(party_size), 2) as avg_party_size
            FROM bookings 
            WHERE ${dateCondition}
            GROUP BY service
            ORDER BY count DESC
        `, params);
        
        // Section breakdown
        const [sectionBreakdown] = await pool.execute(`
            SELECT 
                section,
                COUNT(*) as count,
                SUM(party_size) as covers
            FROM bookings 
            WHERE ${dateCondition}
            GROUP BY section
            ORDER BY count DESC
        `, params);
        
        // Hourly breakdown (for day view)
        let hourlyBreakdown = [];
        if (period === 'day') {
            const [hourlyResult] = await pool.execute(`
                SELECT 
                    HOUR(time) as hour,
                    COUNT(*) as count,
                    SUM(party_size) as covers
                FROM bookings 
                WHERE ${dateCondition}
                GROUP BY HOUR(time)
                ORDER BY hour
            `, params);
            hourlyBreakdown = hourlyResult;
        }
        
        // Status breakdown
        const [statusBreakdown] = await pool.execute(`
            SELECT 
                status,
                COUNT(*) as count
            FROM bookings 
            WHERE ${dateCondition}
            GROUP BY status
        `, params);
        
        res.json({
            summary: stats[0],
            service_breakdown: serviceBreakdown,
            section_breakdown: sectionBreakdown,
            hourly_breakdown: hourlyBreakdown,
            status_breakdown: statusBreakdown,
            period,
            date_range: period === 'day' ? { date } : getDateRange(period, date)
        });
        
    } catch (error) {
        logger.error('Analytics error:', error);
        next(error);
    }
});

// Revenue analytics (if you have pricing data)
router.get('/revenue', authenticateToken, requireRole(['manager', 'admin']), [
    query('start_date').isDate().withMessage('Valid start date is required'),
    query('end_date').isDate().withMessage('Valid end date is required'),
    handleValidationErrors
], async (req, res, next) => {
    try {
        const { start_date, end_date } = req.query;
        
        // This would require pricing data in your database
        // For now, returning placeholder structure
        res.json({
            message: 'Revenue analytics not yet implemented',
            period: { start_date, end_date }
        });
        
    } catch (error) {
        logger.error('Revenue analytics error:', error);
        next(error);
    }
});

module.exports = router;