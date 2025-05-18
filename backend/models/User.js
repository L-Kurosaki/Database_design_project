const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    User_ID: {
        type: String,
        required: true,
        unique: true,
        primary: true
    },
    First_Name: {
        type: String,
        required: true,
        trim: true
    },
    Last_Name: {
        type: String,
        required: true,
        trim: true
    },
    Age: {
        type: Number,
        required: true,
        min: [16, 'Age must be at least 16']
    },
    Email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please enter a valid email address']
    },
    Phone_Num: {
        type: String,
        required: true,
        trim: true
    },
    Reg_Date: {
        type: Date,
        default: Date.now
    },
    Password: {
        type: String,
        required: true
    },
    NextOfKin_Name: {
        type: String,
        required: true,
        trim: true
    },
    NextOfKin_Phone: {
        type: String,
        required: true,
        trim: true
    }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
    if (!this.isModified('Password')) {
        return next();
    }
    try {
        const salt = await bcrypt.genSalt(10);
        this.Password = await bcrypt.hash(this.Password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Clean email before saving
userSchema.pre('save', function(next) {
    if (this.isModified('Email')) {
        this.Email = this.Email.trim().toLowerCase();
    }
    next();
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
    try {
        return await bcrypt.compare(candidatePassword, this.Password);
    } catch (error) {
        throw error;
    }
};

const User = mongoose.model('User', userSchema);

module.exports = User; 