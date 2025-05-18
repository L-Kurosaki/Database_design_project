const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Booking = require('../models/Booking');
const { sendPaymentConfirmationEmail, sendBankTransferInstructionsEmail } = require('../utils/emailService');

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/payment-proofs');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
        cb(null, `payment-proof-${uniqueSuffix}${path.extname(file.originalname)}`);
    }
});

const upload = multer({
    storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|pdf/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);

        if (extname && mimetype) {
            return cb(null, true);
        }
        cb(new Error('Only .png, .jpg, .jpeg and .pdf files are allowed'));
    }
});

// Create payment intent for Stripe
router.post('/create-intent', auth, async (req, res) => {
    try {
        const { bookingId, amount } = req.body;

        // Verify booking exists and belongs to user
        const booking = await Booking.findOne({
            _id: bookingId,
            userId: req.user._id
        });

        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        if (booking.paymentStatus === 'Completed') {
            return res.status(400).json({ message: 'Booking is already paid' });
        }

        // Create payment intent
        const paymentIntent = await stripe.paymentIntents.create({
            amount,
            currency: 'zar',
            metadata: {
                bookingId,
                userId: req.user._id.toString()
            }
        });

        res.json({ clientSecret: paymentIntent.client_secret });
    } catch (error) {
        console.error('Error creating payment intent:', error);
        res.status(500).json({ message: 'Failed to create payment intent' });
    }
});

// Stripe webhook handler
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
        event = stripe.webhooks.constructEvent(
            req.body,
            sig,
            process.env.STRIPE_WEBHOOK_SECRET
        );
    } catch (err) {
        console.error('Webhook signature verification failed:', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    try {
        if (event.type === 'payment_intent.succeeded') {
            const paymentIntent = event.data.object;
            const bookingId = paymentIntent.metadata.bookingId;
            const booking = await Booking.findById(bookingId);

            if (booking) {
                await booking.updatePaymentStatus('Completed', paymentIntent.id);
                await sendPaymentConfirmationEmail(booking);
            }
        }

        res.json({ received: true });
    } catch (error) {
        console.error('Error processing webhook:', error);
        res.status(500).json({ message: 'Error processing webhook' });
    }
});

// Upload proof of payment for bank transfer
router.post('/upload-proof', [auth, upload.single('proofOfPayment')], async (req, res) => {
    try {
        const { bookingId } = req.body;

        // Verify booking exists and belongs to user
        const booking = await Booking.findOne({
            _id: bookingId,
            userId: req.user._id
        });

        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        if (booking.paymentStatus === 'Completed') {
            return res.status(400).json({ message: 'Booking is already paid' });
        }

        // Update booking with proof of payment details
        booking.proofOfPayment = {
            filename: req.file.filename,
            path: req.file.path,
            uploadedAt: new Date()
        };
        await booking.save();

        // Send email notification
        await sendBankTransferInstructionsEmail(booking);

        res.json({ message: 'Proof of payment uploaded successfully' });
    } catch (error) {
        console.error('Error uploading proof of payment:', error);
        res.status(500).json({ message: 'Failed to upload proof of payment' });
    }
});

module.exports = router; 