const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const userRoutes = require('./routes/user');
const chatRoutes = require('./routes/chat');
const webhookRoutes = require('./routes/webhook');

const app = express();
const PORT = process.env.PORT || 3001;

// CORS middleware
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
}));

// Webhook route MUST come BEFORE bodyParser to receive raw body
// Stripe needs raw body to verify webhook signature
app.use('/api/webhook', webhookRoutes);

// Body parser middleware for all other routes
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok', message: 'Zhang Ayi API is running' });
});

// Routes
app.use('/api/user', userRoutes);
app.use('/api/chat', chatRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({
        error: 'Internal server error',
        message: err.message
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Zhang Ayi API server running on port ${PORT}`);
    console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔗 Health check: http://localhost:${PORT}/health`);
});

module.exports = app;
