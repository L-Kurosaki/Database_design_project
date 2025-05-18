const mongoose = require('mongoose');

const scheduleSchema = new mongoose.Schema({
    Schedule_ID: {
        type: String,
        required: true,
        unique: true,
        primary: true
    },
    Bus_ID: {
        type: String,
        required: true,
        ref: 'Bus'
    },
    Route_ID: {
        type: String,
        required: true,
        ref: 'Route'
    },
    DepartureDate: {
        type: Date,
        required: true
    },
    DepartureTime: {
        type: String,
        required: true
    },
    ArrivalTime: {
        type: String,
        required: true
    },
    Seat_Available: {
        type: Number,
        required: true
    }
});

const Schedule = mongoose.model('Schedule', scheduleSchema);

module.exports = Schedule; 