const mongoose = require('mongoose');

const routeSchema = new mongoose.Schema({
    Route_ID: {
        type: String,
        required: true,
        unique: true,
        primary: true
    },
    Source: {
        type: String,
        required: true
    },
    Destination: {
        type: String,
        required: true
    },
    Distance_KM: {
        type: Number,
        required: true
    },
    Estimated_Time: {
        type: String,
        required: true
    }
});

const Route = mongoose.model('Route', routeSchema);

module.exports = Route;