// src/controllers/authController.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');
const config = require('../config/config');
const logger = require('../utils/logger');
const { SUCCESS_MESSAGES, ERROR_MESSAGES } = require('../utils/constants');

class AuthController {
    // User login
    async login(req, res, next) {
        try {
            const { email, password } = req.body;
            
            const [users] = await pool.execute(
                'SELECT id, first_name, last_name, email, password, role, section FROM staff WHERE email = ? AND is_active = true',
                [email]
            );
            
            if (users.length === 0) {
                logger.warn('Login attempt with invalid email:', { email });
                return res.status(401).json({ error: ERROR_MESSAGES.INVALID_CREDENTIALS });
            }
            
            const user = users[0];
            const validPassword = await bcrypt.compare(password, user.password);
            
            if (!validPassword) {
                logger.warn('Login attempt with invalid password:', { email });
                return res.status(401).json({ error: ERROR_MESSAGES.INVALID_CREDENTIALS });
            }
            
            const token = jwt.sign(
                { 
                    id: user.id, 
                    email: user.email, 
                    role: user.role,
                    section: user.section 
                },
                config.jwtSecret,
                { expiresIn: '8h' }
            );
            
            logger.info('User logged in:', { 
                userId: user.id, 
                email: user.email, 
                role: user.role 
            });
            
            res.json({
                token,
                user: {
                    id: user.id,
                    first_name: user.first_name,
                    last_name: user.last_name,
                    email: user.email,
                    role: user.role,
                    section: user.section
                },
                message: SUCCESS_MESSAGES.LOGIN_SUCCESS
            });
            
        } catch (error) {
            logger.error('Login error:', error);
            next(error);
        }
    }

    // User registration
    async register(req, res, next) {
        try {
            const { first_name, last_name, email, password, role, section } = req.body;
            
            const hashedPassword = await bcrypt.hash(password, 12);
            
            const [result] = await pool.execute(`
                INSERT INTO staff (first_name, last_name, email, password, role, section)
                VALUES (?, ?, ?, ?, ?, ?)
            `, [first_name, last_name, email, hashedPassword, role, section]);
            
            logger.info('Staff member registered:', { 
                staffId: result.insertId, 
                email, 
                role 
            });
            
            res.status(201).json({
                id: result.insertId,
                message: 'Staff member registered successfully'
            });
            
        } catch (error) {
            if (error.code === 'ER_DUP_ENTRY') {
                res.status(409).json({ error: 'Email already exists' });
            } else {
                logger.error('Registration error:', error);
                next(error);
            }
        }
    }

    // Verify token
    async verifyToken(req, res, next) {
        try {
            // Token verification is handled by middleware
            // If we reach here, token is valid
            const [user] = await pool.execute(
                'SELECT id, first_name, last_name, email, role, section FROM staff WHERE id = ? AND is_active = true',
                [req.user.id]
            );
            
            if (user.length === 0) {
                return res.status(401).json({ error: 'User not found or inactive' });
            }
            
            res.json({
                valid: true,
                user: user[0]
            });
        } catch (error) {
            logger.error('Token verification error:', error);
            next(error);
        }
    }

    // Change password
    async changePassword(req, res, next) {
        try {
            const { current_password, new_password } = req.body;
            const userId = req.user.id;
            
            // Get current password
            const [users] = await pool.execute(
                'SELECT password FROM staff WHERE id = ?',
                [userId]
            );
            
            if (users.length === 0) {
                return res.status(404).json({ error: ERROR_MESSAGES.NOT_FOUND });
            }
            
            // Verify current password
            const validPassword = await bcrypt.compare(current_password, users[0].password);
            if (!validPassword) {
                return res.status(400).json({ error: 'Current password is incorrect' });
            }
            
            // Hash new password
            const hashedNewPassword = await bcrypt.hash(new_password, 12);
            
            // Update password
            await pool.execute(
                'UPDATE staff SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                [hashedNewPassword, userId]
            );
            
            logger.info('Password changed:', { userId });
            
            res.json({ message: 'Password changed successfully' });
            
        } catch (error) {
            logger.error('Password change error:', error);
            next(error);
        }
    }
}

module.exports = new AuthController();