// src/middleware/validation.js
const { validationResult } = require('express-validator');
const logger = require('../utils/logger');

const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        logger.warn('Validation failed:', { 
            path: req.path, 
            errors: errors.array() 
        });
        return res.status(400).json({
            error: 'Validation failed',
            details: errors.array()
        });
    }
    next();
};

module.exports = {
    handleValidationErrors
};
