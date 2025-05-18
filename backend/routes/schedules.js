const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Schedule = require('../models/Schedule');
const Bus = require('../models/Bus');
const Route = require('../models/Route');
const { body, validationResult } = require('express-validator');

// Search available schedules
router.post('/search', [
    auth,
    body('fromLocation').notEmpty().trim().withMessage('From location is required'),
    body('toLocation').notEmpty().trim().withMessage('To location is required'),
    body('journeyDate').notEmpty().withMessage('Journey date is required'),
    body('passengers').isInt({ min: 1 }).withMessage('Valid number of passengers is required')
], async (req, res) => {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { fromLocation, toLocation, journeyDate, passengers } = req.body;

        // Find matching route
        const route = await Route.findOne({
            Source: fromLocation,
            Destination: toLocation
        });

        if (!route) {
            return res.status(404).json({ message: 'No routes available for this journey' });
        }

        // Find available schedules for the route
        const schedules = await Schedule.find({
            Route_ID: route.Route_ID,
            DepartureDate: {
                $gte: new Date(journeyDate),
                $lt: new Date(new Date(journeyDate).setDate(new Date(journeyDate).getDate() + 1))
            },
            Seat_Available: { $gte: passengers }
        })
        .populate('Bus_ID')
        .limit(10) // Limit to 10 buses
        .sort({ DepartureTime: 1 });

        // Format response
        const availableBuses = await Promise.all(schedules.map(async schedule => {
            const bus = await Bus.findOne({ Bus_ID: schedule.Bus_ID });
            
            return {
                Schedule_ID: schedule.Schedule_ID,
                Bus_ID: bus.Bus_ID,
                Bus_Model: bus.Bus_Model,
                DepartureTime: schedule.DepartureTime,
                ArrivalTime: schedule.ArrivalTime,
                Seat_Available: schedule.Seat_Available,
                Estimated_Time: route.Estimated_Time,
                Fare: calculateFare(route.Distance_KM, bus.Bus_Model),
                From_Location: route.Source,
                To_Location: route.Destination
            };
        }));

        res.json(availableBuses);
    } catch (error) {
        console.error('Error searching schedules:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get schedule by ID
router.get('/:id', auth, async (req, res) => {
    try {
        const schedule = await Schedule.findOne({ Schedule_ID: req.params.id })
            .populate('Bus_ID')
            .populate('Route_ID');
            
        if (!schedule) {
            return res.status(404).json({ message: 'Schedule not found' });
        }
        
        res.json(schedule);
    } catch (error) {
        console.error('Error fetching schedule:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Helper function to calculate fare based on distance and bus type
function calculateFare(distance, busModel) {
    const baseRate = {
        'Luxury': 2.5,
        'Semi-Luxury': 2.0,
        'Standard': 1.5
    };
    
    const rate = baseRate[busModel] || baseRate.Standard;
    return Math.round(distance * rate * 100) / 100; // Round to 2 decimal places
}

module.exports = router; 