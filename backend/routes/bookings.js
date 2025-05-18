const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Booking = require('../models/Booking');
const Schedule = require('../models/Schedule');
const Seat = require('../models/Seat');
const { body, validationResult } = require('express-validator');

// Get all bookings for the authenticated user
router.get('/', auth, async (req, res) => {
    try {
        const bookings = await Booking.find({ userId: req.user._id })
            .populate('bus')
            .populate('schedule')
            .sort({ bookingDate: -1 });
        res.json(bookings);
    } catch (error) {
        console.error('Error fetching bookings:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get active bookings for the authenticated user
router.get('/active', auth, async (req, res) => {
    try {
        const bookings = await Booking.getActiveBookings(req.user._id);
        res.json(bookings);
    } catch (error) {
        console.error('Error fetching active bookings:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get past bookings for the authenticated user
router.get('/past', auth, async (req, res) => {
    try {
        const bookings = await Booking.getPastBookings(req.user._id);
        res.json(bookings);
    } catch (error) {
        console.error('Error fetching past bookings:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get a specific booking by ID
router.get('/:id', auth, async (req, res) => {
    try {
        const booking = await Booking.findOne({
            _id: req.params.id,
            userId: req.user._id
        })
        .populate('bus')
        .populate('schedule');
        
        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }
        
        res.json(booking);
    } catch (error) {
        console.error('Error fetching booking:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Create a new booking
router.post('/', [
    auth,
    body('busId').notEmpty().withMessage('Bus ID is required'),
    body('scheduleId').notEmpty().withMessage('Schedule ID is required'),
    body('passengers').isArray().withMessage('Passengers must be an array'),
    body('passengers.*.firstName').notEmpty().withMessage('Passenger first name is required'),
    body('passengers.*.lastName').notEmpty().withMessage('Passenger last name is required'),
    body('passengers.*.age').isInt({ min: 1 }).withMessage('Valid passenger age is required'),
    body('passengers.*.gender').isIn(['M', 'F', 'O']).withMessage('Valid gender is required'),
    body('passengers.*.seatId').notEmpty().withMessage('Seat ID is required'),
    body('totalFare').isFloat({ min: 0 }).withMessage('Valid total fare is required')
], async (req, res) => {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        // Check if schedule exists and is available
        const schedule = await Schedule.findById(req.body.scheduleId);
        if (!schedule) {
            return res.status(404).json({ message: 'Schedule not found' });
        }
        
        if (new Date(schedule.departureDate) < new Date()) {
            return res.status(400).json({ message: 'Cannot book past schedules' });
        }

        // Check if seats are available and not already booked
        const seatIds = req.body.passengers.map(p => p.seatId);
        const seats = await Seat.find({
            _id: { $in: seatIds },
            busId: req.body.busId
        });

        if (seats.length !== seatIds.length) {
            return res.status(400).json({ message: 'One or more seats are invalid' });
        }

        // Check if any of the seats are already booked
        const bookedSeats = await Booking.find({
            scheduleId: req.body.scheduleId,
            status: { $ne: 'Cancelled' },
            'passengers.seatId': { $in: seatIds }
        });

        if (bookedSeats.length > 0) {
            return res.status(400).json({ message: 'One or more seats are already booked' });
        }

        // Create the booking
        const booking = new Booking({
            userId: req.user._id,
            busId: req.body.busId,
            scheduleId: req.body.scheduleId,
            passengers: req.body.passengers,
            totalFare: req.body.totalFare,
            status: 'Pending',
            paymentStatus: 'Pending'
        });

        await booking.save();

        // Populate bus and schedule details
        await booking.populate('bus schedule');

        res.status(201).json(booking);
    } catch (error) {
        console.error('Error creating booking:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Cancel a booking
router.post('/:id/cancel', auth, async (req, res) => {
    try {
        const booking = await Booking.findOne({
            _id: req.params.id,
            userId: req.user._id
        });

        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        if (booking.status === 'Cancelled') {
            return res.status(400).json({ message: 'Booking is already cancelled' });
        }

        // Check if cancellation is allowed (e.g., 24 hours before departure)
        const schedule = await Schedule.findById(booking.scheduleId);
        const cancellationDeadline = new Date(schedule.departureDate);
        cancellationDeadline.setHours(cancellationDeadline.getHours() - 24);

        if (new Date() > cancellationDeadline) {
            return res.status(400).json({ 
                message: 'Cancellation is only allowed up to 24 hours before departure' 
            });
        }

        await booking.updateStatus('Cancelled');
        res.json(booking);
    } catch (error) {
        console.error('Error cancelling booking:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update booking payment status (webhook endpoint)
router.post('/:id/payment', async (req, res) => {
    try {
        const { status, paymentId } = req.body;
        const booking = await Booking.findById(req.params.id);

        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        await booking.updatePaymentStatus(status, paymentId);
        res.json(booking);
    } catch (error) {
        console.error('Error updating payment status:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router; 