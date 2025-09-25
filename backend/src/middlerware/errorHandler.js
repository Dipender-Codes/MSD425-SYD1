// src/middleware/errorHandler.js
const logger = require('../utils/logger');
const config = require('../config/config');

const errorHandler = (err, req, res, next) => {
    // Log the error
    logger.error('Error occurred:', {
        error: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method,
        ip: req.ip,
        userAgent: req.get('User-Agent')
    });

    // Database connection errors
    if (err.code === 'PROTOCOL_CONNECTION_LOST') {
        return res.status(503).json({
            error: 'Database connection lost',
            message: 'Please try again in a moment'
        });
    }

    // Duplicate entry errors
    if (err.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({
            error: 'Duplicate entry',
            message: 'A record with this information already exists'
        });
    }

    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({
            error: 'Invalid token',
            message: 'Please log in again'
        });
    }

    if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
            error: 'Token expired',
            message: 'Please log in again'
        });
    }

    // Validation errors
    if (err.name === 'ValidationError') {
        return res.status(400).json({
            error: 'Validation failed',
            details: err.errors
        });
    }

    // Default error response
    const statusCode = err.statusCode || 500;
    const message = config.nodeEnv === 'development' 
        ? err.message 
        : 'Internal server error';

    res.status(statusCode).json({
        error: message,
        ...(config.nodeEnv === 'development' && { 
            stack: err.stack,
            details: err 
        })
    });
};

module.exports = errorHandler;