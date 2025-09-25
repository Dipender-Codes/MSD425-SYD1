// src/routes/bookings.js
const express = require('express');
const { body, param, query } = require('express-validator');
const router = express.Router();

const bookingController = require('../controllers/bookingController');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { handleValidationErrors } = require('../middleware/validation');
const { VALIDATION_RULES } = require('../utils/constants');

// Validation rules
const bookingValidation = [
    body('date').isDate().withMessage('Valid date is required'),
    body('time').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Valid time is required (HH:MM)'),
    body('party_size').isInt({ min: VALIDATION_RULES.PARTY_SIZE_MIN, max: VALIDATION_RULES.PARTY_SIZE_MAX })
        .withMessage(`Party size must be between ${VALIDATION_RULES.PARTY_SIZE_MIN} and ${VALIDATION_RULES.PARTY_SIZE_MAX}`),
    body('duration').isInt({ min: VALIDATION_RULES.DURATION_MIN, max: VALIDATION_RULES.DURATION_MAX })
        .withMessage(`Duration must be between ${VALIDATION_RULES.DURATION_MIN} and ${VALIDATION_RULES.DURATION_MAX} minutes`),
    body('service').isIn(['breakfast', 'lunch', 'brunch', 'dinner', 'late-night']).withMessage('Invalid service type'),
    body('customer_name').isLength({ min: VALIDATION_RULES.NAME_MIN_LENGTH }).withMessage('Customer name is required'),
    body('customer_phone').isMobilePhone().withMessage('Valid customer phone is required')
];

const updateBookingValidation = [
    param('id').isInt().withMessage('Valid booking ID is required'),
    body('date').optional().isDate().withMessage('Valid date is required'),
    body('time').optional().matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Valid time is required'),
    body('party_size').optional().isInt({ min: VALIDATION_RULES.PARTY_SIZE_MIN, max: VALIDATION_RULES.PARTY_SIZE_MAX })
        .withMessage(`Party size must be between ${VALIDATION_RULES.PARTY_SIZE_MIN} and ${VALIDATION_RULES.PARTY_SIZE_MAX}`),
    body('status').optional().isIn(['pending', 'confirmed', 'arrived', 'seated', 'completed', 'cancelled', 'no-show'])
        .withMessage('Invalid status')
];

const batchValidation = [
    body('action').isIn(['confirm', 'cancel', 'update_status']).withMessage('Invalid batch action'),
    body('booking_ids').isArray({ min: 1 }).withMessage('At least one booking ID is required'),
    body('booking_ids.*').isInt().withMessage('All booking IDs must be integers')
];

const exportValidation = [
    query('start_date').isDate().withMessage('Valid start date is required'),
    query('end_date').isDate().withMessage('Valid end date is required'),
    query('format').optional().isIn(['csv', 'json']).withMessage('Invalid export format')
];

// Routes
router.get('/', [
    query('date').optional().isDate().withMessage('Valid date is required'),
    query('service').optional().isIn(['breakfast', 'lunch', 'brunch', 'dinner', 'late-night']).withMessage('Invalid service type'),
    query('section').optional().isIn(['bistro', 'central', 'main-lounge', 'terrace']).withMessage('Invalid section'),
    handleValidationErrors
], bookingController.getAllBookings);

router.get('/export', authenticateToken, exportValidation, handleValidationErrors, bookingController.exportBookings);

router.get('/:id', [
    param('id').isInt().withMessage('Valid booking ID is required'),
    handleValidationErrors
], bookingController.getBookingById);

router.post('/', bookingValidation, handleValidationErrors, bookingController.createBooking);

router.put('/:id', updateBookingValidation, handleValidationErrors, bookingController.updateBooking);

router.delete('/:id', [
    param('id').isInt().withMessage('Valid booking ID is required'),
    handleValidationErrors
], bookingController.cancelBooking);

router.post('/batch', authenticateToken, requireRole(['manager', 'admin']), batchValidation, handleValidationErrors, bookingController.batchUpdate);

module.exports = router;