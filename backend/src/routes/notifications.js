// src/routes/notifications.js
const express = require('express');
const router = express.Router();

const { pool } = require('../config/database');
const logger = require('../utils/logger');
const { authenticateToken } = require('../middleware/auth');

// Get notifications
router.get('/', authenticateToken, async (req, res, next) => {
    try {
        // Get upcoming bookings that need attention
        const [upcomingBookings] = await pool.execute(`
            SELECT COUNT(*) as count FROM bookings 
            WHERE date = CURDATE() 
            AND time BETWEEN CURTIME() AND ADDTIME(CURTIME(), '02:00:00')
            AND status = 'confirmed'
        `);
        
        // Get unconfirmed bookings
        const [unconfirmedBookings] = await pool.execute(`
            SELECT COUNT(*) as count FROM bookings 
            WHERE date >= CURDATE() 
            AND status = 'pending'
        `);
        
        // Get overdue confirmations (bookings within 24 hours that are still pending)
        const [overdueConfirmations] = await pool.execute(`
            SELECT COUNT(*) as count FROM bookings 
            WHERE date = DATE_ADD(CURDATE(), INTERVAL 1 DAY)
            AND status = 'pending'
        `);
        
        // Get no-shows from yesterday
        const [recentNoShows] = await pool.execute(`
            SELECT COUNT(*) as count FROM bookings 
            WHERE date = DATE_SUB(CURDATE(), INTERVAL 1 DAY)
            AND status = 'no-show'
        `);
        
        const notifications = [];
        
        if (upcomingBookings[0].count > 0) {
            notifications.push({
                type: 'info',
                title: 'Upcoming Arrivals',
                message: `${upcomingBookings[0].count} bookings arriving in the next 2 hours`,
                count: upcomingBookings[0].count,
                priority: 'medium'
            });
        }
        
        if (unconfirmedBookings[0].count > 0) {
            notifications.push({
                type: 'warning',
                title: 'Unconfirmed Bookings',
                message: `${unconfirmedBookings[0].count} bookings need confirmation`,
                count: unconfirmedBookings[0].count,
                priority: 'high'
            });
        }
        
        if (overdueConfirmations[0].count > 0) {
            notifications.push({
                type: 'error',
                title: 'Urgent Confirmations',
                message: `${overdueConfirmations[0].count} bookings need urgent confirmation`,
                count: overdueConfirmations[0].count,
                priority: 'critical'
            });
        }
        
        if (recentNoShows[0].count > 0) {
            notifications.push({
                type: 'warning',
                title: 'Recent No-Shows',
                message: `${recentNoShows[0].count} no-shows yesterday`,
                count: recentNoShows[0].count,
                priority: 'low'
            });
        }
        
        res.json({
            notifications,
            total_count: notifications.reduce((sum, n) => sum + n.count, 0),
            last_updated: new Date().toISOString()
        });
        
    } catch (error) {
        logger.error('Notifications error:', error);
        next(error);
    }
});

module.exports = router;
