const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
require('dotenv').config();

console.log('=========================================');
console.log('🚀 GYMKAANA BACKEND STARTING UP... (V2)');
console.log('=========================================');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
    origin: function (origin, callback) {
        // Allow all local origins during development
        if (!origin || origin.indexOf('localhost') !== -1 || origin.indexOf('gymkaana.com') !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));
app.use(cookieParser());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

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
    res.send('Gymkaana API is running...');
});

// Debug endpoint to check gym data
app.get('/api/debug/gyms', async (req, res) => {
    try {
        const Gym = require('./models/Gym');
        const Booking = require('./models/Booking');

        const gyms = await Gym.find({}).select('_id name');
        console.log('🔍 All Gyms:', gyms);

        const gymData = [];
        for (const gym of gyms) {
            const bookings = await Booking.find({ gymId: gym._id });
            const revenue = bookings.reduce((sum, b) => sum + (b.amount || 0), 0);
            gymData.push({
                _id: gym._id,
                name: gym.name,
                bookingCount: bookings.length,
                totalRevenue: revenue,
                bookings: bookings.map(b => ({ status: b.status, amount: b.amount }))
            });
        }

        console.log('📊 Gym Data:', gymData);
        res.json(gymData);
    } catch (err) {
        console.error('Debug error:', err);
        res.status(500).json({ error: err.message });
    }
});

// Direct Booking Creation Endpoint - MUST BE BEFORE router.use(protect)
app.post('/api/bookings/create-direct', async (req, res) => {
    try {
        console.log('\n🎯 DIRECT BOOKING ENDPOINT HIT!');
        console.log('Request body:', JSON.stringify(req.body, null, 2));

        const Booking = require('./models/Booking');
        console.log('✓ Booking model loaded');

        // Validate required fields
        const { gymId, planId, userId, memberName, memberEmail, amount, startDate, endDate, status } = req.body;

        console.log('✓ Extracted fields:', { gymId, planId, userId, memberName, memberEmail, amount });

        if (!gymId || !planId || !userId || !memberName || !memberEmail || !amount || !startDate || !endDate) {
            console.error('❌ Missing required fields');
            return res.status(400).json({
                message: 'Missing required fields',
                received: { gymId, planId, userId, memberName, memberEmail, amount, startDate, endDate }
            });
        }

        // Generate transaction ID BEFORE creating document
        const date = new Date();
        const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
        const randomStr = Math.random().toString(36).substring(2, 8).toUpperCase();
        const transactionId = `GYM-${dateStr}-${randomStr}`;
        console.log('✓ Transaction ID generated:', transactionId);

        console.log('Creating booking document with transaction ID...');
        // Create booking - include transactionId to avoid pre-save hook issues
        const booking = new Booking({
            transactionId,  // Set directly to avoid pre-save hook
            gymId,
            planId,
            userId,
            memberName,
            memberEmail,
            amount,
            startDate,
            endDate,
            status: status || 'upcoming'
        });

        console.log('Document created, attempting to save...');
        const savedBooking = await booking.save().catch(err => {
            console.error('Save error caught:', err.message);
            throw err;
        });
        console.log('✅ Booking saved:', savedBooking._id);

        // Populate references
        console.log('Populating references...');
        const populated = await Booking.findById(savedBooking._id).populate('gymId planId userId');
        console.log('✅ Booking populated, sending response');

        res.status(201).json(populated);
    } catch (error) {
        console.error('❌ Direct Booking Error:', error.message);
        console.error('Error type:', error.constructor.name);
        console.error('Stack:', error.stack);
        res.status(500).json({
            message: error.message,
            error: error.toString(),
            type: error.constructor.name,
            stack: error.stack
        });
    }
});

// Routes
app.use('/api/gyms', require('./routes/gymRoutes'));
app.use('/api/plans', require('./routes/planRoutes'));
app.use('/api/bookings', require('./routes/bookingRoutes'));
app.use('/api/dashboard', require('./routes/dashboardRoutes'));
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/activities', require('./routes/activityRoutes'));
app.use('/api/reviews', require('./routes/reviewRoutes'));
app.use('/api/payouts', require('./routes/payoutRoutes'));
app.use('/api/accounting', require('./routes/accountingRoutes'));
app.use('/api/tickets', require('./routes/ticketRoutes'));

// 404 Handler - MUST BE AFTER ALL ROUTES
app.use((req, res) => {
    console.log(`404 - Not Found: ${req.method} ${req.originalUrl}`);
    res.status(404).json({
        message: `Route ${req.method} ${req.url} not found`,
        error: 'Not Found'
    });
});

// Global Error Handler
app.use((err, req, res, next) => {
    console.error('GLOBAL ERROR:', err);
    res.status(err.status || 500).json({
        message: err.message || 'Internal Server Error',
        error: process.env.NODE_ENV === 'development' ? err : {}
    });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
