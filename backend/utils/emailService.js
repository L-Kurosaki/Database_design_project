const nodemailer = require('nodemailer');
const User = require('../models/User');

// Create nodemailer transporter
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: true,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

// Format currency
const formatCurrency = (amount) => {
    return `R${amount.toFixed(2)}`;
};

// Format date
const formatDate = (date) => {
    return new Date(date).toLocaleString('en-ZA', {
        dateStyle: 'full',
        timeStyle: 'short'
    });
};

// Send booking confirmation email
async function sendBookingConfirmationEmail(booking) {
    try {
        const user = await User.findById(booking.userId);
        const schedule = await booking.populate('schedule');
        
        const mailOptions = {
            from: process.env.SMTP_FROM,
            to: user.email,
            subject: `Booking Confirmation - Booking ID: ${booking._id}`,
            html: `
                <h2>Booking Confirmation</h2>
                <p>Dear ${user.First_Name},</p>
                <p>Your bus booking has been confirmed. Here are the details:</p>
                
                <h3>Journey Details</h3>
                <p>
                    <strong>From:</strong> ${schedule.From_Location}<br>
                    <strong>To:</strong> ${schedule.To_Location}<br>
                    <strong>Date:</strong> ${formatDate(schedule.Departure_Date)}<br>
                    <strong>Passengers:</strong> ${booking.passengers.length}
                </p>

                <h3>Passenger Details</h3>
                <ul>
                    ${booking.passengers.map(p => `
                        <li>
                            ${p.firstName} ${p.lastName} - Seat ${p.seatNumber}
                        </li>
                    `).join('')}
                </ul>

                <h3>Payment Details</h3>
                <p>
                    <strong>Total Amount:</strong> ${formatCurrency(booking.totalFare)}<br>
                    <strong>Payment Status:</strong> ${booking.paymentStatus}
                </p>

                <p>Please complete the payment to confirm your booking.</p>

                <p>
                    Thank you for choosing BusBooking!<br>
                    For any queries, please contact our support team.
                </p>
            `
        };

        await transporter.sendMail(mailOptions);
    } catch (error) {
        console.error('Error sending booking confirmation email:', error);
    }
}

// Send payment confirmation email
async function sendPaymentConfirmationEmail(booking) {
    try {
        const user = await User.findById(booking.userId);
        const schedule = await booking.populate('schedule');
        
        const mailOptions = {
            from: process.env.SMTP_FROM,
            to: user.email,
            subject: `Payment Confirmation - Booking ID: ${booking._id}`,
            html: `
                <h2>Payment Confirmation</h2>
                <p>Dear ${user.First_Name},</p>
                <p>Your payment has been received and processed successfully. Here are your booking details:</p>
                
                <h3>Journey Details</h3>
                <p>
                    <strong>From:</strong> ${schedule.From_Location}<br>
                    <strong>To:</strong> ${schedule.To_Location}<br>
                    <strong>Date:</strong> ${formatDate(schedule.Departure_Date)}<br>
                    <strong>Passengers:</strong> ${booking.passengers.length}
                </p>

                <h3>Payment Details</h3>
                <p>
                    <strong>Amount Paid:</strong> ${formatCurrency(booking.totalFare)}<br>
                    <strong>Payment ID:</strong> ${booking.paymentId}<br>
                    <strong>Payment Date:</strong> ${formatDate(new Date())}
                </p>

                <h3>Important Information</h3>
                <ul>
                    <li>Please arrive at least 30 minutes before departure</li>
                    <li>Carry a valid ID proof for all passengers</li>
                    <li>Keep this email as proof of payment</li>
                </ul>

                <p>
                    Thank you for choosing BusBooking!<br>
                    Have a safe journey!
                </p>
            `
        };

        await transporter.sendMail(mailOptions);
    } catch (error) {
        console.error('Error sending payment confirmation email:', error);
    }
}

// Send bank transfer instructions email
async function sendBankTransferInstructionsEmail(booking) {
    try {
        const user = await User.findById(booking.userId);
        
        const mailOptions = {
            from: process.env.SMTP_FROM,
            to: user.email,
            subject: `Bank Transfer Instructions - Booking ID: ${booking._id}`,
            html: `
                <h2>Bank Transfer Instructions</h2>
                <p>Dear ${user.First_Name},</p>
                <p>Thank you for choosing bank transfer as your payment method. Please follow these instructions to complete your payment:</p>
                
                <h3>Bank Details</h3>
                <p>
                    <strong>Bank:</strong> Standard Bank<br>
                    <strong>Account Name:</strong> BusBooking PTY LTD<br>
                    <strong>Account Number:</strong> 1234567890<br>
                    <strong>Branch Code:</strong> 051001<br>
                    <strong>Reference:</strong> BB${booking._id}
                </p>

                <h3>Amount to Pay</h3>
                <p><strong>Total Amount:</strong> ${formatCurrency(booking.totalFare)}</p>

                <h3>Important Notes</h3>
                <ul>
                    <li>Use the provided reference number in your payment</li>
                    <li>Keep your proof of payment safe</li>
                    <li>Payment must be made within 24 hours to secure your booking</li>
                    <li>Upload your proof of payment through our website</li>
                </ul>

                <p>
                    Once we receive and verify your payment, we'll send you a confirmation email.<br>
                    If you have any questions, please contact our support team.
                </p>
            `
        };

        await transporter.sendMail(mailOptions);
    } catch (error) {
        console.error('Error sending bank transfer instructions email:', error);
    }
}

// Send booking reminder email
async function sendBookingReminderEmail(booking) {
    try {
        const user = await User.findById(booking.userId);
        const schedule = await booking.populate('schedule');
        
        const mailOptions = {
            from: process.env.SMTP_FROM,
            to: user.email,
            subject: `Journey Reminder - Tomorrow's Bus Trip`,
            html: `
                <h2>Journey Reminder</h2>
                <p>Dear ${user.First_Name},</p>
                <p>This is a reminder for your bus journey tomorrow:</p>
                
                <h3>Journey Details</h3>
                <p>
                    <strong>From:</strong> ${schedule.From_Location}<br>
                    <strong>To:</strong> ${schedule.To_Location}<br>
                    <strong>Date:</strong> ${formatDate(schedule.Departure_Date)}<br>
                    <strong>Passengers:</strong> ${booking.passengers.length}
                </p>

                <h3>Important Reminders</h3>
                <ul>
                    <li>Arrive at least 30 minutes before departure</li>
                    <li>Carry valid ID proof for all passengers</li>
                    <li>Keep your booking confirmation handy</li>
                    <li>Check weather conditions and plan accordingly</li>
                </ul>

                <p>
                    We wish you a pleasant journey!<br>
                    Thank you for choosing BusBooking.
                </p>
            `
        };

        await transporter.sendMail(mailOptions);
    } catch (error) {
        console.error('Error sending booking reminder email:', error);
    }
}

module.exports = {
    sendBookingConfirmationEmail,
    sendPaymentConfirmationEmail,
    sendBankTransferInstructionsEmail,
    sendBookingReminderEmail
}; 