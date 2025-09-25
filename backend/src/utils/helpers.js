// src/utils/helpers.js
const crypto = require('crypto');

/**
 * Convert array of objects to CSV format
 * @param {Array} data - Array of objects
 * @returns {string} CSV string
 */
const convertToCSV = (data) => {
    if (!Array.isArray(data) || data.length === 0) return '';
    
    const headers = Object.keys(data[0]);
    const csv = [
        headers.join(','),
        ...data.map(row => 
            headers.map(header => {
                const value = row[header];
                if (value === null || value === undefined) return '';
                if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
                    return `"${value.replace(/"/g, '""')}"`;
                }
                return value;
            }).join(',')
        )
    ].join('\n');
    
    return csv;
};

/**
 * Format time from 24-hour to 12-hour format
 * @param {string} time24 - Time in 24-hour format (HH:MM)
 * @returns {string} Time in 12-hour format
 */
const formatTime12Hour = (time24) => {
    const [hours, minutes] = time24.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
};

/**
 * Generate a random string
 * @param {number} length - Length of the string
 * @returns {string} Random string
 */
const generateRandomString = (length = 32) => {
    return crypto.randomBytes(Math.ceil(length / 2))
        .toString('hex')
        .slice(0, length);
};

/**
 * Check if a date is valid
 * @param {string} dateString - Date string
 * @returns {boolean} True if valid date
 */
const isValidDate = (dateString) => {
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date);
};

/**
 * Get date range for analytics
 * @param {string} period - 'day', 'week', 'month'
 * @param {string} date - Base date
 * @returns {Object} Date range object
 */
const getDateRange = (period, date = new Date().toISOString().split('T')[0]) => {
    const baseDate = new Date(date);
    let startDate, endDate;

    switch (period) {
        case 'week':
            startDate = new Date(baseDate);
            startDate.setDate(baseDate.getDate() - 7);
            endDate = new Date(baseDate);
            break;
        case 'month':
            startDate = new Date(baseDate);
            startDate.setDate(baseDate.getDate() - 30);
            endDate = new Date(baseDate);
            break;
        default: // 'day'
            startDate = new Date(baseDate);
            endDate = new Date(baseDate);
    }

    return {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0]
    };
};

/**
 * Sanitize phone number
 * @param {string} phone - Phone number
 * @returns {string} Sanitized phone number
 */
const sanitizePhone = (phone) => {
    if (!phone) return '';
    // Remove all non-digit characters except +
    return phone.replace(/[^\d+]/g, '');
};

/**
 * Validate email format
 * @param {string} email - Email address
 * @returns {boolean} True if valid email
 */
const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

/**
 * Calculate booking end time
 * @param {string} startTime - Start time (HH:MM)
 * @param {number} duration - Duration in minutes
 * @returns {string} End time (HH:MM)
 */
const calculateEndTime = (startTime, duration) => {
    const [hours, minutes] = startTime.split(':').map(Number);
    const startDate = new Date(2000, 0, 1, hours, minutes);
    const endDate = new Date(startDate.getTime() + duration * 60000);
    
    return `${endDate.getHours().toString().padStart(2, '0')}:${endDate.getMinutes().toString().padStart(2, '0')}`;
};

/**
 * Check for time slot conflicts
 * @param {string} newStart - New booking start time
 * @param {number} newDuration - New booking duration
 * @param {string} existingStart - Existing booking start time
 * @param {number} existingDuration - Existing booking duration
 * @returns {boolean} True if there's a conflict
 */
const hasTimeConflict = (newStart, newDuration, existingStart, existingDuration) => {
    const newEnd = calculateEndTime(newStart, newDuration);
    const existingEnd = calculateEndTime(existingStart, existingDuration);
    
    // Convert times to minutes for easier comparison
    const toMinutes = (time) => {
        const [hours, minutes] = time.split(':').map(Number);
        return hours * 60 + minutes;
    };
    
    const newStartMin = toMinutes(newStart);
    const newEndMin = toMinutes(newEnd);
    const existingStartMin = toMinutes(existingStart);
    const existingEndMin = toMinutes(existingEnd);
    
    // Check for overlap
    return !(newEndMin <= existingStartMin || newStartMin >= existingEndMin);
};

module.exports = {
    convertToCSV,
    formatTime12Hour,
    generateRandomString,
    isValidDate,
    getDateRange,
    sanitizePhone,
    isValidEmail,
    calculateEndTime,
    hasTimeConflict
};

