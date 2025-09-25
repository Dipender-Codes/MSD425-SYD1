// src/controllers/bookingController.js
const { pool } = require('../config/database');
const logger = require('../utils/logger');
const { SUCCESS_MESSAGES, ERROR_MESSAGES } = require('../utils/constants');
const { hasTimeConflict, calculateEndTime } = require('../utils/helpers');

class BookingController {
    // Get all bookings with filters
    async getAllBookings(req, res, next) {
        try {
            let whereClause = '';
            let params = [];
            
            if (req.query.date) {
                whereClause += ' WHERE date = ?';
                params.push(req.query.date);
            }
            
            if (req.query.service && req.query.service !== 'all') {
                whereClause += whereClause ? ' AND service = ?' : ' WHERE service = ?';
                params.push(req.query.service);
            }
            
            if (req.query.section && req.query.section !== 'all') {
                whereClause += whereClause ? ' AND section = ?' : ' WHERE section = ?';
                params.push(req.query.section);
            }
            
            const [rows] = await pool.execute(`
                SELECT b.*, t.table_number, s.first_name as staff_first_name, s.last_name as staff_last_name
                FROM bookings b
                LEFT JOIN tables t ON b.table_id = t.id
                LEFT JOIN staff s ON b.staff_id = s.id
                ${whereClause}
                ORDER BY date DESC, time ASC
            `, params);
            
            res.json(rows);
        } catch (error) {
            logger.error('Error fetching bookings:', error);
            next(error);
        }
    }

    // Get booking by ID
    async getBookingById(req, res, next) {
        try {
            const [rows] = await pool.execute(`
                SELECT b.*, t.table_number, s.first_name as staff_first_name, s.last_name as staff_last_name
                FROM bookings b
                LEFT JOIN tables t ON b.table_id = t.id
                LEFT JOIN staff s ON b.staff_id = s.id
                WHERE b.id = ?
            `, [req.params.id]);
            
            if (rows.length === 0) {
                return res.status(404).json({ error: ERROR_MESSAGES.NOT_FOUND });
            }
            
            res.json(rows[0]);
        } catch (error) {
            logger.error('Error fetching booking:', error);
            next(error);
        }
    }

    // Create new booking
    async createBooking(req, res, next) {
        const connection = await pool.getConnection();
        
        try {
            await connection.beginTransaction();
            
            const {
                date, time, party_size, duration, service, section, status,
                customer_name, customer_phone, customer_email, customer_company,
                tags, internal_notes, customer_notes, special_requirements,
                website, social_media, documents, table_number, staff_member
            } = req.body;
            
            // Check for existing customer or create new one
            let customerId;
            const [existingCustomer] = await connection.execute(
                'SELECT id FROM customers WHERE phone = ?',
                [customer_phone]
            );
            
            if (existingCustomer.length > 0) {
                customerId = existingCustomer[0].id;
                // Update customer info
                await connection.execute(`
                    UPDATE customers SET first_name = ?, last_name = ?, email = ?, company = ?, tags = ?, 
                    website = ?, social_media = ?, documents = ?, updated_at = CURRENT_TIMESTAMP
                    WHERE id = ?
                `, [
                    customer_name.split(' ')[0], 
                    customer_name.split(' ').slice(1).join(' '),
                    customer_email, customer_company, tags, website, social_media, documents, customerId
                ]);
            } else {
                const [customerResult] = await connection.execute(`
                    INSERT INTO customers (first_name, last_name, phone, email, company, tags, website, social_media, documents)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                `, [
                    customer_name.split(' ')[0], 
                    customer_name.split(' ').slice(1).join(' '),
                    customer_phone, customer_email, customer_company, tags, website, social_media, documents
                ]);
                customerId = customerResult.insertId;
            }
            
            // Get table ID if specified
            let tableId = null;
            if (table_number) {
                const [tableResult] = await connection.execute(
                    'SELECT id FROM tables WHERE table_number = ?',
                    [table_number]
                );
                if (tableResult.length > 0) {
                    tableId = tableResult[0].id;
                }
            }
            
            // Get staff ID if specified
            let staffId = null;
            if (staff_member) {
                const [staffResult] = await connection.execute(
                    'SELECT id FROM staff WHERE CONCAT(first_name, "-", last_name) = ?',
                    [staff_member]
                );
                if (staffResult.length > 0) {
                    staffId = staffResult[0].id;
                }
            }
            
            // Check for conflicts
            const [conflicts] = await connection.execute(`
                SELECT COUNT(*) as count FROM bookings 
                WHERE date = ? AND table_id = ? AND status NOT IN ('cancelled', 'completed')
                AND ((time <= ? AND ADDTIME(time, SEC_TO_TIME(duration * 60)) > ?) OR
                     (time < ADDTIME(?, SEC_TO_TIME(? * 60)) AND time >= ?))
            `, [date, tableId, time, time, time, duration, time]);
            
            if (conflicts[0].count > 0 && tableId) {
                await connection.rollback();
                return res.status(409).json({ error: ERROR_MESSAGES.BOOKING_CONFLICT });
            }
            
            // Create booking
            const [bookingResult] = await connection.execute(`
                INSERT INTO bookings (
                    customer_id, table_id, staff_id, date, time, party_size, duration, 
                    service, section, status, customer_name, customer_phone, customer_email, 
                    customer_company, tags, internal_notes, customer_notes, special_requirements
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                customerId, tableId, staffId, date, time, party_size, duration,
                service, section || 'any', status || 'pending', customer_name, customer_phone,
                customer_email, customer_company, tags, internal_notes, customer_notes, special_requirements
            ]);
            
            // Log booking history
            await connection.execute(`
                INSERT INTO booking_history (booking_id, action, new_values, changed_by)
                VALUES (?, 'created', ?, ?)
            `, [bookingResult.insertId, JSON.stringify(req.body), req.user?.id]);
            
            await connection.commit();
            
            logger.info('Booking created:', { 
                bookingId: bookingResult.insertId, 
                customer: customer_name,
                date, 
                time 
            });
            
            res.status(201).json({
                id: bookingResult.insertId,
                message: SUCCESS_MESSAGES.BOOKING_CREATED
            });
            
        } catch (error) {
            await connection.rollback();
            logger.error('Error creating booking:', error);
            next(error);
        } finally {
            connection.release();
        }
    }

    // Update booking
    async updateBooking(req, res, next) {
        const connection = await pool.getConnection();
        
        try {
            await connection.beginTransaction();
            
            // Get current booking data for history
            const [currentBooking] = await connection.execute(
                'SELECT * FROM bookings WHERE id = ?',
                [req.params.id]
            );
            
            if (currentBooking.length === 0) {
                await connection.rollback();
                return res.status(404).json({ error: ERROR_MESSAGES.NOT_FOUND });
            }
            
            const updateFields = [];
            const updateValues = [];
            
            // Build dynamic update query
            Object.keys(req.body).forEach(key => {
                if (req.body[key] !== undefined && key !== 'id') {
                    updateFields.push(`${key} = ?`);
                    updateValues.push(req.body[key]);
                }
            });
            
            if (updateFields.length === 0) {
                await connection.rollback();
                return res.status(400).json({ error: 'No fields to update' });
            }
            
            updateValues.push(req.params.id);
            
            await connection.execute(`
                UPDATE bookings SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `, updateValues);
            
            // Log booking history
            await connection.execute(`
                INSERT INTO booking_history (booking_id, action, old_values, new_values, changed_by)
                VALUES (?, 'updated', ?, ?, ?)
            `, [req.params.id, JSON.stringify(currentBooking[0]), JSON.stringify(req.body), req.user?.id]);
            
            await connection.commit();
            
            logger.info('Booking updated:', { bookingId: req.params.id });
            
            res.json({ message: SUCCESS_MESSAGES.BOOKING_UPDATED });
            
        } catch (error) {
            await connection.rollback();
            logger.error('Error updating booking:', error);
            next(error);
        } finally {
            connection.release();
        }
    }

    // Cancel booking (soft delete)
    async cancelBooking(req, res, next) {
        const connection = await pool.getConnection();
        
        try {
            await connection.beginTransaction();
            
            // Check if booking exists
            const [booking] = await connection.execute(
                'SELECT * FROM bookings WHERE id = ?',
                [req.params.id]
            );
            
            if (booking.length === 0) {
                await connection.rollback();
                return res.status(404).json({ error: ERROR_MESSAGES.NOT_FOUND });
            }
            
            // Update status to cancelled instead of deleting
            await connection.execute(
                'UPDATE bookings SET status = "cancelled", updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                [req.params.id]
            );
            
            // Log booking history
            await connection.execute(`
                INSERT INTO booking_history (booking_id, action, old_values, changed_by)
                VALUES (?, 'cancelled', ?, ?)
            `, [req.params.id, JSON.stringify(booking[0]), req.user?.id]);
            
            await connection.commit();
            
            logger.info('Booking cancelled:', { bookingId: req.params.id });
            
            res.json({ message: SUCCESS_MESSAGES.BOOKING_CANCELLED });
            
        } catch (error) {
            await connection.rollback();
            logger.error('Error cancelling booking:', error);
            next(error);
        } finally {
            connection.release();
        }
    }

    // Batch operations
    async batchUpdate(req, res, next) {
        const connection = await pool.getConnection();
        
        try {
            await connection.beginTransaction();
            
            const { action, booking_ids, status } = req.body;
            let updateQuery;
            let updateParams;
            
            switch (action) {
                case 'confirm':
                    updateQuery = 'UPDATE bookings SET status = "confirmed", updated_at = CURRENT_TIMESTAMP WHERE id IN (?)';
                    updateParams = [booking_ids];
                    break;
                case 'cancel':
                    updateQuery = 'UPDATE bookings SET status = "cancelled", updated_at = CURRENT_TIMESTAMP WHERE id IN (?)';
                    updateParams = [booking_ids];
                    break;
                case 'update_status':
                    if (!status) {
                        await connection.rollback();
                        return res.status(400).json({ error: 'Status is required for update_status action' });
                    }
                    updateQuery = 'UPDATE bookings SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id IN (?)';
                    updateParams = [status, booking_ids];
                    break;
                default:
                    await connection.rollback();
                    return res.status(400).json({ error: 'Invalid batch action' });
            }
            
            const [result] = await connection.execute(updateQuery, updateParams);
            
            // Log batch operation
            for (const bookingId of booking_ids) {
                await connection.execute(`
                    INSERT INTO booking_history (booking_id, action, changed_by, notes)
                    VALUES (?, ?, ?, ?)
                `, [bookingId, action, req.user?.id, `Batch operation: ${action}`]);
            }
            
            await connection.commit();
            
            logger.info('Batch operation completed:', { 
                action, 
                affectedRows: result.affectedRows,
                bookingIds: booking_ids 
            });
            
            res.json({
                message: `Successfully ${action}ed ${result.affectedRows} bookings`,
                affected_rows: result.affectedRows
            });
            
        } catch (error) {
            await connection.rollback();
            logger.error('Batch operation error:', error);
            next(error);
        } finally {
            connection.release();
        }
    }

    // Export bookings
    async exportBookings(req, res, next) {
        try {
            const { start_date, end_date, format = 'json' } = req.query;
            
            const [bookings] = await pool.execute(`
                SELECT 
                    b.*,
                    c.first_name as customer_first_name,
                    c.last_name as customer_last_name,
                    t.table_number,
                    s.first_name as staff_first_name,
                    s.last_name as staff_last_name
                FROM bookings b
                LEFT JOIN customers c ON b.customer_id = c.id
                LEFT JOIN tables t ON b.table_id = t.id
                LEFT JOIN staff s ON b.staff_id = s.id
                WHERE b.date BETWEEN ? AND ?
                ORDER BY b.date, b.time
            `, [start_date, end_date]);
            
            const filename = `bookings-${start_date}-${end_date}`;
            
            if (format === 'csv') {
                const { convertToCSV } = require('../utils/helpers');
                const csv = convertToCSV(bookings);
                
                res.setHeader('Content-Type', 'text/csv');
                res.setHeader('Content-Disposition', `attachment; filename=${filename}.csv`);
                res.send(csv);
            } else {
                res.setHeader('Content-Type', 'application/json');
                res.setHeader('Content-Disposition', `attachment; filename=${filename}.json`);
                res.json(bookings);
            }
            
        } catch (error) {
            logger.error('Export error:', error);
            next(error);
        }
    }
}

module.exports = new BookingController();