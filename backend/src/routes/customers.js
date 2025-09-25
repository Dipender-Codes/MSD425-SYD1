// src/routes/customers.js
const express = require('express');
const { body, param, query } = require('express-validator');
const router = express.Router();

const customerController = require('../controllers/customerController');
const { authenticateToken } = require('../middleware/auth');
const { handleValidationErrors } = require('../middleware/validation');
const { VALIDATION_RULES } = require('../utils/constants');

// Validation rules
const customerValidation = [
    body('first_name').isLength({ min: VALIDATION_RULES.NAME_MIN_LENGTH, max: VALIDATION_RULES.NAME_MAX_LENGTH })
        .withMessage(`First name must be between ${VALIDATION_RULES.NAME_MIN_LENGTH} and ${VALIDATION_RULES.NAME_MAX_LENGTH} characters`),
    body('last_name').isLength({ min: VALIDATION_RULES.NAME_MIN_LENGTH, max: VALIDATION_RULES.NAME_MAX_LENGTH })
        .withMessage(`Last name must be between ${VALIDATION_RULES.NAME_MIN_LENGTH} and ${VALIDATION_RULES.NAME_MAX_LENGTH} characters`),
    body('phone').isMobilePhone().withMessage('Valid phone number is required'),
    body('email').optional().isEmail().withMessage('Valid email address is required')
];

// Routes
router.get('/search', [
    query('q').isLength({ min: 2 }).withMessage('Search query must be at least 2 characters'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    handleValidationErrors
], customerController.searchCustomers);

router.get('/', authenticateToken, [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    handleValidationErrors
], customerController.getAllCustomers);

router.get('/:id', [
    param('id').isInt().withMessage('Valid customer ID is required'),
    handleValidationErrors
], customerController.getCustomerById);

router.post('/', customerValidation, handleValidationErrors, customerController.createCustomer);

router.put('/:id', [
    param('id').isInt().withMessage('Valid customer ID is required'),
    body('first_name').optional().isLength({ min: VALIDATION_RULES.NAME_MIN_LENGTH, max: VALIDATION_RULES.NAME_MAX_LENGTH }),
    body('last_name').optional().isLength({ min: VALIDATION_RULES.NAME_MIN_LENGTH, max: VALIDATION_RULES.NAME_MAX_LENGTH }),
    body('phone').optional().isMobilePhone().withMessage('Valid phone number is required'),
    body('email').optional().isEmail().withMessage('Valid email address is required'),
    handleValidationErrors
], customerController.updateCustomer);

module.exports = router;