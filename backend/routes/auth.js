const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');

// Use a default JWT secret if not set in environment
const JWT_SECRET = process.env.JWT_SECRET || 'kbbs_default_jwt_secret_key';

// Input validation middleware
const validateLoginInput = (req, res, next) => {
    const { Email, Password } = req.body;
    
    console.log('Validating login input:', {
        hasEmail: !!Email,
        emailType: typeof Email,
        hasPassword: !!Password,
        passwordType: typeof Password,
        receivedEmail: Email
    });

    if (!Email || typeof Email !== 'string' || Email.trim().length === 0) {
        return res.status(400).json({ 
            error: 'Invalid email format',
            details: { field: 'Email', issue: 'Email is required and must be a non-empty string' }
        });
    }

    if (!Password || typeof Password !== 'string' || Password.length === 0) {
        return res.status(400).json({ 
            error: 'Invalid password format',
            details: { field: 'Password', issue: 'Password is required and must be a non-empty string' }
        });
    }

    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(Email)) {
        return res.status(400).json({ 
            error: 'Invalid email format',
            details: { field: 'Email', issue: 'Email format is invalid' }
        });
    }

    next();
};

// Register User
router.post('/register', async (req, res) => {
    try {
        // Clean the email
        const cleanEmail = req.body.Email.trim().toLowerCase();
        
        // Check if user already exists
        const existingUser = await User.findOne({ 
            Email: { $regex: new RegExp('^' + cleanEmail.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&') + '$', 'i') }
        });
        
        if (existingUser) {
            return res.status(400).json({ error: 'Email already registered' });
        }

        // Create new user with cleaned email
        const userData = {
            ...req.body,
            Email: cleanEmail
        };
        
        const user = new User(userData);
        await user.save();
        
        const token = jwt.sign({ User_ID: user.User_ID }, JWT_SECRET);
        res.status(201).json({ user, token });
    } catch (error) {
        console.error('Registration error:', error);
        if (error.name === 'ValidationError') {
            return res.status(400).json({ error: 'Please check all required fields are filled correctly' });
        }
        res.status(500).json({ error: 'Server error during registration. Please try again.' });
    }
});

// Login User
router.post('/login', validateLoginInput, async (req, res) => {
    try {
        const { Email, Password } = req.body;
        
        console.log('Processing login request:', {
            email: Email,
            emailLength: Email.length,
            hasPassword: !!Password,
            passwordLength: Password.length
        });

        // Clean the email
        const cleanEmail = Email.trim().toLowerCase();

        // First try exact match
        let user = await User.findOne({ Email: cleanEmail });
        
        // If no exact match, try case-insensitive
        if (!user) {
            user = await User.findOne({
                Email: { $regex: new RegExp('^' + cleanEmail.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&') + '$', 'i') }
            });
        }
        
        if (!user) {
            console.log('Login failed: No user found with email:', cleanEmail);
            return res.status(400).json({ 
                error: 'Invalid email or password',
                details: { field: 'Email', issue: 'User not found' }
            });
        }
        
        console.log('User found:', {
            id: user.User_ID,
            email: user.Email,
            storedEmail: user.Email,
            providedEmail: cleanEmail,
            hasPassword: !!user.Password,
            passwordLength: user.Password ? user.Password.length : 0
        });

        // Compare password
        const isMatch = await bcrypt.compare(Password, user.Password);
        console.log('Password verification:', {
            isMatch,
            providedPasswordLength: Password.length,
            storedPasswordLength: user.Password.length
        });
        
        if (!isMatch) {
            console.log('Login failed: Invalid password for user:', cleanEmail);
            return res.status(400).json({ 
                error: 'Invalid email or password',
                details: { field: 'Password', issue: 'Invalid password' }
            });
        }

        // Generate token using consistent secret
        const token = jwt.sign(
            { User_ID: user.User_ID }, 
            JWT_SECRET,
            { expiresIn: '24h' }
        );
        
        // Send response without password
        const userResponse = user.toObject();
        delete userResponse.Password;
        
        console.log('Login successful for user:', cleanEmail);
        res.json({ 
            message: 'Login successful',
            user: userResponse, 
            token 
        });
    } catch (error) {
        console.error('Login error:', {
            name: error.name,
            message: error.message,
            stack: error.stack
        });
        res.status(500).json({ 
            error: 'Unable to login',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Logout User
router.post('/logout', auth, async (req, res) => {
    try {
        res.send({ message: 'Logged out successfully' });
    } catch (error) {
        res.status(500).send();
    }
});

module.exports = router; 