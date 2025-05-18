const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema({
    Admin_ID: {
        type: String,
        required: true,
        unique: true,
        primary: true
    },
    Admin_Name: {
        type: String,
        required: true
    }
});

const Admin = mongoose.model('Admin', adminSchema);

module.exports = Admin; 