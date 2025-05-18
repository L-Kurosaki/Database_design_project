const mongoose = require('mongoose');

const seatSchema = new mongoose.Schema({
    Seat_ID: {
        type: String,
        required: true,
        unique: true
    },
    Bus_ID: {
        type: String,
        required: true,
        ref: 'Bus'
    },
    Seat_Number: {
        type: String,
        required: true
    },
    Seat_Type: {
        type: String,
        enum: ['Window', 'Aisle', 'Middle'],
        required: true
    },
    Floor: {
        type: Number,
        default: 1,
        enum: [1, 2] // For double-decker buses
    },
    Is_Available: {
        type: Boolean,
        default: true
    },
    Status: {
        type: String,
        enum: ['Available', 'Booked', 'Reserved', 'Maintenance'],
        default: 'Available'
    },
    Price_Multiplier: {
        type: Number,
        default: 1.0 // For premium seats
    },
    Features: {
        is_reclining: { type: Boolean, default: true },
        has_usb_port: { type: Boolean, default: false },
        has_entertainment: { type: Boolean, default: false }
    },
    Position: {
        row: { type: Number, required: true },
        column: { type: Number, required: true }
    }
}, {
    timestamps: true
});

// Indexes for faster queries
seatSchema.index({ Bus_ID: 1, Seat_Number: 1 });
seatSchema.index({ Status: 1 });

// Virtual for seat label (e.g., "1A", "2B")
seatSchema.virtual('label').get(function() {
    return `${this.Position.row}${String.fromCharCode(65 + this.Position.column)}`;
});

// Method to check if seat can be booked
seatSchema.methods.canBeBooked = function() {
    return this.Status === 'Available' && this.Is_Available;
};

// Method to book seat
seatSchema.methods.book = function() {
    if (!this.canBeBooked()) {
        throw new Error('Seat is not available for booking');
    }
    this.Status = 'Booked';
    this.Is_Available = false;
    return this.save();
};

// Method to release seat
seatSchema.methods.release = function() {
    if (this.Status !== 'Booked') {
        throw new Error('Seat is not currently booked');
    }
    this.Status = 'Available';
    this.Is_Available = true;
    return this.save();
};

const Seat = mongoose.model('Seat', seatSchema);

module.exports = Seat; 