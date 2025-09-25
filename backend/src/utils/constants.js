// src/utils/constants.js
const BOOKING_STATUS = {
    PENDING: 'pending',
    CONFIRMED: 'confirmed',
    ARRIVED: 'arrived',
    SEATED: 'seated',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled',
    NO_SHOW: 'no-show'
};

const SERVICE_TYPES = {
    BREAKFAST: 'breakfast',
    LUNCH: 'lunch',
    BRUNCH: 'brunch',
    DINNER: 'dinner',
    LATE_NIGHT: 'late-night'
};

const SECTIONS = {
    ANY: 'any',
    BISTRO: 'bistro',
    CENTRAL: 'central',
    MAIN_LOUNGE: 'main-lounge',
    TERRACE: 'terrace'
};

const STAFF_ROLES = {
    HOST: 'host',
    SERVER: 'server',
    MANAGER: 'manager',
    ADMIN: 'admin'
};

const TABLE_STATUS = {
    AVAILABLE: 'available',
    OCCUPIED: 'occupied',
    MAINTENANCE: 'maintenance'
};

const BOOKING_HISTORY_ACTIONS = {
    CREATED: 'created',
    UPDATED: 'updated',
    CONFIRMED: 'confirmed',
    CANCELLED: 'cancelled',
    COMPLETED: 'completed'
};

const ERROR_MESSAGES = {
    VALIDATION_FAILED: 'Validation failed',
    UNAUTHORIZED: 'Authentication required',
    FORBIDDEN: 'Insufficient permissions',
    NOT_FOUND: 'Resource not found',
    CONFLICT: 'Resource conflict',
    INTERNAL_ERROR: 'Internal server error',
    DATABASE_ERROR: 'Database error',
    BOOKING_CONFLICT: 'Booking time conflict',
    TABLE_UNAVAILABLE: 'Table is not available',
    INVALID_CREDENTIALS: 'Invalid credentials',
    TOKEN_EXPIRED: 'Token expired'
};

const SUCCESS_MESSAGES = {
    BOOKING_CREATED: 'Booking created successfully',
    BOOKING_UPDATED: 'Booking updated successfully',
    BOOKING_CANCELLED: 'Booking cancelled successfully',
    CUSTOMER_CREATED: 'Customer created successfully',
    CUSTOMER_UPDATED: 'Customer updated successfully',
    LOGIN_SUCCESS: 'Login successful',
    LOGOUT_SUCCESS: 'Logout successful'
};

const VALIDATION_RULES = {
    NAME_MIN_LENGTH: 2,
    NAME_MAX_LENGTH: 100,
    PHONE_MIN_LENGTH: 10,
    PHONE_MAX_LENGTH: 20,
    EMAIL_MAX_LENGTH: 255,
    PASSWORD_MIN_LENGTH: 6,
    PARTY_SIZE_MIN: 1,
    PARTY_SIZE_MAX: 20,
    DURATION_MIN: 30,
    DURATION_MAX: 300,
    NOTES_MAX_LENGTH: 1000
};

const DEFAULT_VALUES = {
    BOOKING_DURATION: 120, // 2 hours
    PAGE_SIZE: 20,
    MAX_SEARCH_RESULTS: 50
};

module.exports = {
    BOOKING_STATUS,
    SERVICE_TYPES,
    SECTIONS,
    STAFF_ROLES,
    TABLE_STATUS,
    BOOKING_HISTORY_ACTIONS,
    ERROR_MESSAGES,
    SUCCESS_MESSAGES,
    VALIDATION_RULES,
    DEFAULT_VALUES
};