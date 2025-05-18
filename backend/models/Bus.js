const mongoose = require('mongoose');

const busSchema = new mongoose.Schema({
    Bus_ID: {
        type: String,
        required: true,
        unique: true,
        primary: true
    },
    Bus_Model: {
        type: String,
        required: true
    },
    Bus_Capacity: {
        type: Number,
        required: true
    },
    Driver_ID: {
        type: String,
        required: true,
        ref: 'Driver'
    }
});

const Bus = mongoose.model('Bus', busSchema);

module.exports = Bus; 