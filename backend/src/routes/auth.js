// src/routes/auth.js
const express = require('express');
const { body } = require('express-validator');
const router = express.Router();

const authController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');
const { handleValidationErrors } = require('../middleware/validation');
const { VALIDATION_RULES } = require('../utils/constants');

// Validation rules
const loginValidation = [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: VALIDATION_RULES.PASSWORD_MIN_LENGTH }).withMessage(`Password must be at least ${VALIDATION_RULES.PASSWORD_MIN_LENGTH} characters`)
];

const registerValidation = [
    body('first_name').isLength({ min: VALIDATION_RULES.NAME_MIN_LENGTH, max: VALIDATION_RULES.NAME_MAX_LENGTH })
        .withMessage(`First name must be between ${VALIDATION_RULES.NAME_MIN_LENGTH} and ${VALIDATION_RULES.NAME_MAX_LENGTH} characters`),
    body('last_name').isLength({ min: VALIDATION_RULES.NAME_MIN_LENGTH, max: VALIDATION_RULES.NAME_MAX_LENGTH })
        .withMessage(`Last name must be between ${VALIDATION_RULES.NAME_MIN_LENGTH} and ${VALIDATION_RULES.NAME_MAX_LENGTH} characters`),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: VALIDATION_RULES.PASSWORD_MIN_LENGTH }).withMessage(`Password must be at least ${VALIDATION_RULES.PASSWORD_MIN_LENGTH} characters`),
    body('role').isIn(['host', 'server', 'manager', 'admin']).withMessage('Invalid role')
];

const changePasswordValidation = [
    body('current_password').notEmpty().withMessage('Current password is required'),
    body('new_password').isLength({ min: VALIDATION_RULES.PASSWORD_MIN_LENGTH }).withMessage(`New password must be at least ${VALIDATION_RULES.PASSWORD_MIN_LENGTH} characters`)
];

// Routes
router.post('/login', loginValidation, handleValidationErrors, authController.login);
router.post('/register', registerValidation, handleValidationErrors, authController.register);
router.get('/verify', authenticateToken, authController.verifyToken);
router.post('/change-password', authenticateToken, changePasswordValidation, handleValidationErrors, authController.changePassword);

module.exports = router;