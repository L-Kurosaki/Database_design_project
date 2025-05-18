const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema({
    Complaint_ID: {
        type: String,
        required: true,
        unique: true,
        primary: true
    },
    User_ID: {
        type: String,
        required: true,
        ref: 'User'
    },
    Booking_ID: {
        type: String,
        required: true,
        ref: 'Booking'
    },
    Complaint_Type: {
        type: String,
        required: true
    },
    Description: {
        type: String,
        required: true
    },
    Status: {
        type: String,
        required: true,
        enum: ['Pending', 'In Progress', 'Resolved']
    },
    DateSubmitted: {
        type: Date,
        required: true,
        default: Date.now
    },
    DateResolved: {
        type: Date
    },
    Admin_ID: {
        type: String,
        ref: 'Admin'
    }
});

const Complaint = mongoose.model('Complaint', complaintSchema);

module.exports = Complaint; 