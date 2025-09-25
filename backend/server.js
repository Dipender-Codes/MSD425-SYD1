const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
require('dotenv').config();

const config = require('./src/config/config');
const { initializeDatabase } = require('./src/config/database');
const logger = require('./src/utils/logger');
const errorHandler = require('./src/middleware/errorHandler');
const rateLimiter = require('./src/middleware/rateLimiter');

// Import routes
const authRoutes = require('./src/routes/auth');
const bookingRoutes = require('./src/routes/bookings');
const customerRoutes = require('./src/routes/customers');
const tableRoutes = require('./src/routes/tables');
const staffRoutes = require('./src/routes/staff');
const analyticsRoutes = require('./src/routes/analytics');
const notificationRoutes = require('./src/routes/notifications');

const app = express();

// Middleware
app.use(helmet());
app.use(compression());
app.use(cors({
    origin: config.frontendUrl,
    credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Logging
app.use(morgan('combined', {
    stream: { 
        write: message => logger.info(message.trim()) 
    }
}));

// Rate limiting
app.use('/api/', rateLimiter);

// Health check endpoint
app.get('/api/health', async (req, res) => {
    try {
        const { pool } = require('./src/config/database');
        const [result] = await pool.execute('SELECT 1 as health_check');
        
        res.json({ 
            status: 'healthy', 
            database: result[0].health_check === 1 ? 'connected' : 'error',
            timestamp: new Date().toISOString(),
            version: require('./package.json').version
        });
    } catch (error) {
        logger.error('Health check failed:', error);
        res.status(500).json({ 
            status: 'unhealthy', 
            database: 'disconnected',
            timestamp: new Date().toISOString()
        });
    }
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/tables', tableRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/notifications', notificationRoutes);

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({ error: 'Endpoint not found' });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Graceful shutdown
const gracefulShutdown = async (signal) => {
    logger.info(`Received ${signal}. Graceful shutdown...`);
    try {
        const { pool } = require('./src/config/database');
        await pool.end();
        logger.info('Database connections closed');
        process.exit(0);
    } catch (error) {
        logger.error('Error during shutdown:', error);
        process.exit(1);
    }
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

// Start server
async function startServer() {
    try {
        // Initialize database
        await initializeDatabase();
        logger.info('Database initialized successfully');
        
        // Start server
        app.listen(config.port, () => {
            logger.info(`Server running on port ${config.port}`);
            logger.info(`Environment: ${config.nodeEnv}`);
            logger.info(`Database: ${config.database.host}:${config.database.database}`);
        });
    } catch (error) {
        logger.error('Failed to start server:', error);
        process.exit(1);
    }
}

// Only start server if this file is run directly
if (require.main === module) {
    startServer();
}

module.exports = app;