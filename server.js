const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
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
    res.send('Gymkaana API is running...');
});

// Routes
app.use('/api/gyms', require('./routes/gymRoutes'));
app.use('/api/plans', require('./routes/planRoutes'));
app.use('/api/bookings', require('./routes/bookingRoutes'));
app.use('/api/dashboard', require('./routes/dashboardRoutes'));
app.use('/api/auth', require('./routes/authRoutes'));

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
