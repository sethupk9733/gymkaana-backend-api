const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
const allowedOrigins = [
    'https://app.gymkaana.com',
    'https://owner.gymkaana.com',
    'https://admin.gymkaana.com',
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175'
];

app.use(cors({
    origin: function (origin, callback) {
        // allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) === -1) {
            const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
            return callback(new Error(msg), false);
        }
        return callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept']
}));
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI, {
    serverSelectionTimeoutMS: 5000 // 5 second timeout
})
    .then(() => console.log('MongoDB connected successfully'))
    .catch(err => {
        console.error('MongoDB connection error:', err.message);
        console.log('CRITICAL: Ensure MongoDB is running on localhost:27017 or update MONGODB_URI in .env');
    });

// Basic Route
app.get('/', (req, res) => {
    res.json({ message: 'Gymkaana API is healthy', status: 'online' });
});

// Core Routes (always required)
app.use('/api/gyms', require('./routes/gymRoutes'));
app.use('/api/plans', require('./routes/planRoutes'));
app.use('/api/bookings', require('./routes/bookingRoutes'));
app.use('/api/dashboard', require('./routes/dashboardRoutes'));
app.use('/api/auth', require('./routes/authRoutes'));

// Extended Routes (load safely to prevent crashes if file is missing)
const extendedRoutes = [
    { path: '/api/tickets', file: './routes/ticketRoutes' },
    { path: '/api/payouts', file: './routes/payoutRoutes' },
    { path: '/api/reviews', file: './routes/reviewRoutes' },
    { path: '/api/accounting', file: './routes/accountingRoutes' },
    { path: '/api/activities', file: './routes/activityRoutes' },
];
extendedRoutes.forEach(({ path, file }) => {
    try {
        app.use(path, require(file));
        console.log(`✅ Route loaded: ${path}`);
    } catch (e) {
        console.warn(`⚠️ Could not load route ${path}: ${e.message}`);
    }
});
// 404 Handler for API routes
app.use((req, res, next) => {
    res.status(404).json({ message: `Route ${req.originalUrl} not found on this server` });
});

// Global Error Handler
app.use((err, req, res, next) => {
    console.error('🔥 Global Error:', err.stack);
    res.status(500).json({
        message: 'Internal Server Error',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
});
