const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
    let token;

    const authHeader = req.headers.authorization;
    if ((authHeader && authHeader.startsWith('Bearer')) || req.cookies.accessToken) {
        try {
            token = authHeader ? authHeader.split(' ')[1] : req.cookies.accessToken;
            console.log('Auth Token found, verifying...');
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            console.log('Token decoded:', decoded);
            req.user = await User.findById(decoded.id).select('-password');

            if (!req.user) {
                console.error('User not found in database for token id:', decoded.id);
                return res.status(401).json({ message: 'User not found' });
            }

            console.log('User authenticated:', req.user._id);
            return next();
        } catch (error) {
            console.error('Auth Error:', error.message);
            return res.status(401).json({ message: 'Not authorized, token failed: ' + error.message });
        }
    }

    console.error('No token found in authorization header');
    return res.status(401).json({ message: 'Not authorized, no token' });
};

const admin = (req, res, next) => {
    if (req.user && req.user.roles && req.user.roles.includes('admin')) {
        return next();
    } else {
        return res.status(401).json({ message: 'Not authorized as an admin' });
    }
};

const owner = (req, res, next) => {
    if (req.user && req.user.roles && (req.user.roles.includes('owner') || req.user.roles.includes('admin'))) {
        return next();
    } else {
        return res.status(401).json({ message: 'Not authorized as an owner' });
    }
};

const protectOptional = async (req, res, next) => {
    let token;

    const authHeader = req.headers.authorization;
    if ((authHeader && authHeader.startsWith('Bearer')) || req.cookies.accessToken) {
        try {
            token = authHeader ? authHeader.split(' ')[1] : req.cookies.accessToken;
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = await User.findById(decoded.id).select('-password');
        } catch (error) {
            console.error('Optional Auth Error:', error.message);
        }
    }
    return next();
};

module.exports = { protect, admin, owner, protectOptional };
