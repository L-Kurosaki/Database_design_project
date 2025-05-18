const mongoose = require('mongoose');

const busStopSchema = new mongoose.Schema({
    Stop_ID: {
        type: String,
        required: true,
        unique: true
    },
    Route_ID: {
        type: String,
        required: true,
        ref: 'Route'
    },
    Stop_Name: {
        type: String,
        required: true
    },
    Latitude: {
        type: Number,
        required: true
    },
    Longitude: {
        type: Number,
        required: true
    },
    Stop_Order: {
        type: Number,
        required: true
    },
    Arrival_Time: {
        type: String,
        required: true
    },
    Departure_Time: {
        type: String,
        required: true
    },
    Is_Major_Stop: {
        type: Boolean,
        default: false
    },
    Facilities: {
        has_shelter: { type: Boolean, default: false },
        has_seating: { type: Boolean, default: false },
        has_lighting: { type: Boolean, default: false },
        is_accessible: { type: Boolean, default: true }
    },
    Status: {
        type: String,
        enum: ['Active', 'Inactive', 'Under Maintenance'],
        default: 'Active'
    }
});

// Index for faster queries
busStopSchema.index({ Route_ID: 1, Stop_Order: 1 });
busStopSchema.index({ Latitude: 1, Longitude: 1 });

// Virtual for calculating distance to next stop
busStopSchema.virtual('distanceToNext').get(function() {
    // Implementation would go here
    // Would need the next stop's coordinates to calculate
    return 0;
});

const BusStop = mongoose.model('BusStop', busStopSchema);

module.exports = BusStop; 