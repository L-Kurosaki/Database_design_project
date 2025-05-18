const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Route = require('../models/Route');
const BusStop = require('../models/BusStop');
const { body, validationResult } = require('express-validator');

// Get route information with stops
router.post('/info', [
    auth,
    body('fromLocation').notEmpty().trim().withMessage('From location is required'),
    body('toLocation').notEmpty().trim().withMessage('To location is required')
], async (req, res) => {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { fromLocation, toLocation } = req.body;

        // Find the route
        const route = await Route.findOne({
            Source: fromLocation,
            Destination: toLocation
        });

        if (!route) {
            return res.status(404).json({ message: 'Route not found' });
        }

        // Get all bus stops for this route
        const stops = await BusStop.find({
            Route_ID: route.Route_ID
        }).sort('Stop_Order');

        // Format response with route and stop information
        const response = {
            route_id: route.Route_ID,
            distance: route.Distance_KM,
            estimated_time: route.Estimated_Time,
            stops: stops.map(stop => ({
                name: stop.Stop_Name,
                latitude: stop.Latitude,
                longitude: stop.Longitude,
                order: stop.Stop_Order,
                arrival_time: stop.Arrival_Time,
                departure_time: stop.Departure_Time
            }))
        };

        res.json(response);
    } catch (error) {
        console.error('Error fetching route information:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get all available routes
router.get('/', auth, async (req, res) => {
    try {
        const routes = await Route.find().sort('Source');
        res.json(routes);
    } catch (error) {
        console.error('Error fetching routes:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get route by ID
router.get('/:id', auth, async (req, res) => {
    try {
        const route = await Route.findOne({ Route_ID: req.params.id });
        
        if (!route) {
            return res.status(404).json({ message: 'Route not found' });
        }
        
        // Get stops for this route
        const stops = await BusStop.find({ Route_ID: route.Route_ID })
            .sort('Stop_Order');
        
        res.json({
            ...route.toObject(),
            stops: stops
        });
    } catch (error) {
        console.error('Error fetching route:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router; 