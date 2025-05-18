const mongoose = require('mongoose');

const passengerSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: true,
        trim: true
    },
    lastName: {
        type: String,
        required: true,
        trim: true
    },
    age: {
        type: Number,
        required: true,
        min: 1
    },
    gender: {
        type: String,
        required: true,
        enum: ['M', 'F', 'O']
    },
    seatId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Seat',
        required: true
    },
    seatNumber: {
        type: String,
        required: true
    }
});

const bookingSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    busId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Bus',
        required: true
    },
    scheduleId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Schedule',
        required: true
    },
    passengers: [passengerSchema],
    totalFare: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['Pending', 'Confirmed', 'Cancelled'],
        default: 'Pending'
    },
    paymentStatus: {
        type: String,
        enum: ['Pending', 'Completed', 'Failed'],
        default: 'Pending'
    },
    paymentId: {
        type: String
    },
    bookingDate: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Add indexes for better query performance
bookingSchema.index({ userId: 1, status: 1 });
bookingSchema.index({ scheduleId: 1, status: 1 });
bookingSchema.index({ bookingDate: -1 });

// Virtual populate for user details
bookingSchema.virtual('user', {
    ref: 'User',
    localField: 'userId',
    foreignField: '_id',
    justOne: true
});

// Virtual populate for bus details
bookingSchema.virtual('bus', {
    ref: 'Bus',
    localField: 'busId',
    foreignField: '_id',
    justOne: true
});

// Virtual populate for schedule details
bookingSchema.virtual('schedule', {
    ref: 'Schedule',
    localField: 'scheduleId',
    foreignField: '_id',
    justOne: true
});

// Methods
bookingSchema.methods.updateStatus = function(status) {
    this.status = status;
    return this.save();
};

bookingSchema.methods.updatePaymentStatus = function(status, paymentId) {
    this.paymentStatus = status;
    if (paymentId) {
        this.paymentId = paymentId;
    }
    if (status === 'Completed') {
        this.status = 'Confirmed';
    }
    return this.save();
};

// Statics
bookingSchema.statics.getActiveBookings = function(userId) {
    return this.find({
        userId,
        status: { $ne: 'Cancelled' },
        'schedule.departureDate': { $gte: new Date() }
    })
    .populate('bus')
    .populate('schedule')
    .sort({ 'schedule.departureDate': 1 });
};

bookingSchema.statics.getPastBookings = function(userId) {
    return this.find({
        userId,
        'schedule.departureDate': { $lt: new Date() }
    })
    .populate('bus')
    .populate('schedule')
    .sort({ 'schedule.departureDate': -1 });
};

const Booking = mongoose.model('Booking', bookingSchema);

module.exports = Booking; 