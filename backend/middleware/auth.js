const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Use the same JWT secret as in auth.js
const JWT_SECRET = process.env.JWT_SECRET || 'kbbs_default_jwt_secret_key';

const auth = async (req, res, next) => {
    try {
        const token = req.header('Authorization').replace('Bearer ', '');
        console.log('Verifying token:', { tokenLength: token.length });
        
        const decoded = jwt.verify(token, JWT_SECRET);
        console.log('Token decoded:', { User_ID: decoded.User_ID });
        
        const user = await User.findOne({ User_ID: decoded.User_ID });
        console.log('User found from token:', { 
            found: !!user,
            User_ID: decoded.User_ID 
        });

        if (!user) {
            throw new Error('User not found');
        }

        req.token = token;
        req.user = user;
        next();
    } catch (error) {
        console.error('Authentication error:', {
            name: error.name,
            message: error.message
        });
        
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ error: 'Invalid token' });
        }
        
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Token expired' });
        }
        
        res.status(401).json({ error: 'Please authenticate.' });
    }
};

module.exports = auth; 