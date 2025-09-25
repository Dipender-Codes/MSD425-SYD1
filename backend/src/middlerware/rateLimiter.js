// src/middleware/rateLimiter.js
const rateLimit = require('express-rate-limit');
const config = require('../config/config');
const logger = require('../utils/logger');

const rateLimiter = rateLimit({
    windowMs: config.rateLimiting.windowMs,
    max: config.rateLimiting.max,
    message: config.rateLimiting.message,
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    handler: (req, res) => {
        logger.warn('Rate limit exceeded:', {
            ip: req.ip,
            path: req.path,
            userAgent: req.get('User-Agent')
        });
        res.status(429).json({
            error: 'Too many requests',
            message: config.rateLimiting.message,
            retryAfter: Math.round(config.rateLimiting.windowMs / 1000)
        });
    }
});

module.exports = rateLimiter;