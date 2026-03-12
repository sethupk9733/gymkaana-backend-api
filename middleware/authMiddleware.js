const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
    let token;

    const authHeader = req.headers.authorization;
    const cookieToken = req.cookies ? req.cookies.accessToken : null;

    if ((authHeader && authHeader.startsWith('Bearer')) || cookieToken) {
        try {
            token = authHeader ? authHeader.split(' ')[1] : cookieToken;
            console.log('🔓 Auth Token found, verifying...');

            if (!process.env.JWT_SECRET) {
                console.error('❌ CRITICAL: JWT_SECRET is not defined in .env');
                return res.status(500).json({ message: 'Server configuration error: JWT_SECRET missing' });
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            console.log('✅ Token decoded correctly for user id:', decoded.id);
            req.user = await User.findById(decoded.id).select('-password');

            if (!req.user) {
                console.error('❌ User not found in database for token id:', decoded.id);
                return res.status(401).json({ message: 'User not found or account deactivated' });
            }

            console.log('👤 User authenticated:', req.user._id, 'roles:', req.user.roles);
            return next();
        } catch (error) {
            console.error('❌ Auth Verification Error:', error.message);
            return res.status(401).json({ message: 'Not authorized, token failed: ' + error.message });
        }
    }

    console.error('🚫 No token found in authorization header or cookies');
    return res.status(401).json({ message: 'Not authorized, no session found. Please login.' });
};

const admin = (req, res, next) => {
    const roles = (req.user && req.user.roles) ? req.user.roles.map(r => r.toLowerCase()) : [];
    if (roles.includes('admin')) {
        return next();
    } else {
        console.error('🛡️ Admin Check Failed | User:', req.user?._id, '| Roles:', req.user?.roles);
        return res.status(403).json({
            message: 'Not authorized as an admin',
            userRoles: req.user?.roles
        });
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
