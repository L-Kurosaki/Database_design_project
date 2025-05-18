const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const authRouter = require('./routes/auth');
const bookingsRouter = require('./routes/bookings');
const schedulesRouter = require('./routes/schedules');
const paymentsRouter = require('./routes/payments');
const routesRouter = require('./routes/routes');

const app = express();

// Request logging middleware
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    console.log('Request headers:', req.headers);
    if (req.body) {
        console.log('Request body:', {
            ...req.body,
            Password: req.body.Password ? '[HIDDEN]' : undefined
        });
    }
    next();
});

// Middleware
app.use(cors({
    origin: ['http://localhost:5500', 'http://127.0.0.1:5500', 'http://localhost:3000', 'http://localhost:8080'], // Allow multiple frontend origins
    credentials: true
}));

// Add JSON parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/api/health', (req, res) => {
    const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    res.status(200).json({ 
        status: 'OK',
        database: dbStatus,
        timestamp: new Date().toISOString()
    });
});

// Connect to MongoDB
const MONGODB_URI = 'mongodb://localhost:27017/bus_booking';

// Function to check database connection
const checkDatabaseConnection = () => {
    if (mongoose.connection.readyState !== 1) {
        console.error('Database is not connected! ReadyState:', mongoose.connection.readyState);
        return false;
    }
    return true;
};

const connectDB = async () => {
    try {
        await mongoose.connect(MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('Connected to MongoDB successfully');
        
        // Create the database and collections if they don't exist
        const db = mongoose.connection.db;
        console.log(`Connected to database: ${db.databaseName}`);

        // Log when MongoDB connection is lost
        mongoose.connection.on('disconnected', () => {
            console.error('Lost MongoDB connection');
        });

        // Log when MongoDB reconnects
        mongoose.connection.on('reconnected', () => {
            console.log('Reconnected to MongoDB');
        });

        // Test the connection by running a simple query
        const collections = await db.listCollections().toArray();
        console.log('Available collections:', collections.map(c => c.name));

    } catch (err) {
        console.error('MongoDB connection error:', err);
        process.exit(1);
    }
};

// Database connection check middleware
app.use((req, res, next) => {
    if (!checkDatabaseConnection()) {
        return res.status(503).json({ error: 'Database connection is not available' });
    }
    next();
});

// Routes
app.use('/api/auth', authRouter);
app.use('/api/bookings', bookingsRouter);
app.use('/api/schedules', schedulesRouter);
app.use('/api/payments', paymentsRouter);
app.use('/api/routes', routesRouter);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error details:', {
        message: err.message,
        stack: err.stack,
        type: err.name,
        path: req.path,
        body: req.body
    });
    
    // Handle specific types of errors
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        return res.status(400).json({ error: 'Invalid JSON format' });
    }
    
    if (err.name === 'ValidationError') {
        return res.status(400).json({ error: 'Validation Error', details: err.errors });
    }
    
    res.status(500).json({ 
        error: 'Something broke!',
        details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

const PORT = process.env.PORT || 5000;

// Start server only after connecting to MongoDB
connectDB().then(() => {
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
        console.log(`MongoDB is connected at: ${MONGODB_URI}`);
        
        // Log initial database connection state
        console.log('Initial database connection state:', mongoose.connection.readyState);
    });
}).catch(err => {
    console.error('Failed to start server:', err);
}); 