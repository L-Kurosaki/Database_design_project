// Initialize Stripe
const stripe = Stripe('your_publishable_key'); // Replace with your actual Stripe publishable key
const elements = stripe.elements();

document.addEventListener('DOMContentLoaded', () => {
    // Check authentication
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/login.html';
        return;
    }

    // Load user data
    loadUserData();
    
    // Get booking ID from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const bookingId = urlParams.get('bookingId');
    
    if (!bookingId) {
        window.location.href = '/dashboard.html';
        return;
    }

    // Load booking details
    loadBookingDetails(bookingId);
    
    // Setup Stripe elements
    setupStripeElements();
    
    // Setup payment method toggle
    setupPaymentMethodToggle();
    
    // Setup form submission
    setupFormSubmission(bookingId);
    
    // Setup bank transfer upload
    setupBankTransferUpload(bookingId);
    
    // Setup logout handler
    setupLogout();
});

async function loadUserData() {
    try {
        const response = await fetch('http://localhost:5000/api/users/profile', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        if (response.ok) {
            const userData = await response.json();
            document.getElementById('userName').textContent = userData.First_Name;
        }
    } catch (error) {
        console.error('Error loading user data:', error);
    }
}

async function loadBookingDetails(bookingId) {
    try {
        const response = await fetch(`http://localhost:5000/api/bookings/${bookingId}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        if (response.ok) {
            const booking = await response.json();
            
            // Update booking summary
            document.getElementById('bookingId').textContent = booking._id;
            document.getElementById('fromLocation').textContent = booking.schedule.From_Location;
            document.getElementById('toLocation').textContent = booking.schedule.To_Location;
            document.getElementById('journeyDate').textContent = new Date(booking.schedule.Departure_Date).toLocaleDateString();
            document.getElementById('passengerCount').textContent = booking.passengers.length;
            
            const baseFare = booking.totalFare / 1.15; // Remove 15% tax
            document.getElementById('baseFare').textContent = baseFare.toFixed(2);
            document.getElementById('tax').textContent = (booking.totalFare - baseFare).toFixed(2);
            document.getElementById('totalFare').textContent = booking.totalFare.toFixed(2);
            document.getElementById('payAmount').textContent = booking.totalFare.toFixed(2);
            
            // Set transfer reference
            document.getElementById('transferReference').textContent = `BB${booking._id}`;
        }
    } catch (error) {
        console.error('Error loading booking details:', error);
    }
}

function setupStripeElements() {
    const style = {
        base: {
            fontSize: '16px',
            color: '#495057',
            '::placeholder': {
                color: '#6c757d'
            }
        }
    };

    // Create card elements
    const cardNumber = elements.create('cardNumber', { style });
    const cardExpiry = elements.create('cardExpiry', { style });
    const cardCvc = elements.create('cardCvc', { style });

    // Mount elements
    cardNumber.mount('#cardNumber');
    cardExpiry.mount('#cardExpiry');
    cardCvc.mount('#cardCvc');

    // Handle validation errors
    [cardNumber, cardExpiry, cardCvc].forEach(element => {
        element.addEventListener('change', (event) => {
            const errorElement = document.getElementById('paymentError');
            if (event.error) {
                errorElement.textContent = event.error.message;
                errorElement.classList.remove('d-none');
            } else {
                errorElement.classList.add('d-none');
            }
        });
    });
}

function setupPaymentMethodToggle() {
    const cardPayment = document.getElementById('cardPayment');
    const bankTransfer = document.getElementById('bankTransfer');
    const cardForm = document.getElementById('cardPaymentForm');
    const bankDetails = document.getElementById('bankTransferDetails');

    cardPayment.addEventListener('change', () => {
        cardForm.classList.remove('d-none');
        bankDetails.classList.add('d-none');
    });

    bankTransfer.addEventListener('change', () => {
        cardForm.classList.add('d-none');
        bankDetails.classList.remove('d-none');
    });
}

function setupFormSubmission(bookingId) {
    const form = document.getElementById('paymentForm');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const submitButton = document.getElementById('payButton');
        submitButton.disabled = true;
        submitButton.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Processing...';

        try {
            // Create payment intent
            const intentResponse = await fetch(`http://localhost:5000/api/payments/create-intent`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    bookingId,
                    amount: parseFloat(document.getElementById('totalFare').textContent) * 100 // Convert to cents
                })
            });

            if (!intentResponse.ok) {
                throw new Error('Failed to create payment intent');
            }

            const { clientSecret } = await intentResponse.json();

            // Confirm card payment
            const result = await stripe.confirmCardPayment(clientSecret, {
                payment_method: {
                    card: elements.getElement('cardNumber'),
                    billing_details: {
                        name: document.getElementById('userName').textContent
                    }
                }
            });

            if (result.error) {
                // Handle payment error
                const errorElement = document.getElementById('paymentError');
                errorElement.textContent = result.error.message;
                errorElement.classList.remove('d-none');
                submitButton.disabled = false;
                submitButton.textContent = `Pay R${document.getElementById('payAmount').textContent}`;
            } else {
                // Payment successful
                await updateBookingPaymentStatus(bookingId, 'Completed', result.paymentIntent.id);
                window.location.href = `/booking-confirmation.html?bookingId=${bookingId}`;
            }
        } catch (error) {
            console.error('Payment error:', error);
            const errorElement = document.getElementById('paymentError');
            errorElement.textContent = 'An error occurred while processing your payment. Please try again.';
            errorElement.classList.remove('d-none');
            submitButton.disabled = false;
            submitButton.textContent = `Pay R${document.getElementById('payAmount').textContent}`;
        }
    });
}

function setupBankTransferUpload(bookingId) {
    const uploadBtn = document.getElementById('uploadProofBtn');
    const fileInput = document.getElementById('proofOfPayment');

    uploadBtn.addEventListener('click', async () => {
        if (!fileInput.files.length) {
            alert('Please select a file to upload');
            return;
        }

        const file = fileInput.files[0];
        const formData = new FormData();
        formData.append('proofOfPayment', file);
        formData.append('bookingId', bookingId);

        uploadBtn.disabled = true;
        uploadBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Uploading...';

        try {
            const response = await fetch('http://localhost:5000/api/payments/upload-proof', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: formData
            });

            if (response.ok) {
                await updateBookingPaymentStatus(bookingId, 'Pending', null);
                window.location.href = `/booking-confirmation.html?bookingId=${bookingId}&paymentMethod=bank`;
            } else {
                const error = await response.json();
                alert(error.message || 'Failed to upload proof of payment');
            }
        } catch (error) {
            console.error('Upload error:', error);
            alert('Failed to upload proof of payment. Please try again.');
        } finally {
            uploadBtn.disabled = false;
            uploadBtn.textContent = 'Upload Proof of Payment';
        }
    });
}

async function updateBookingPaymentStatus(bookingId, status, paymentId) {
    try {
        await fetch(`http://localhost:5000/api/bookings/${bookingId}/payment`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ status, paymentId })
        });
    } catch (error) {
        console.error('Error updating payment status:', error);
    }
}

function setupLogout() {
    document.getElementById('logoutBtn').addEventListener('click', async (e) => {
        e.preventDefault();
        try {
            const response = await fetch('http://localhost:5000/api/auth/logout', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            
            if (response.ok) {
                localStorage.removeItem('token');
                window.location.href = '/login.html';
            }
        } catch (error) {
            console.error('Logout error:', error);
        }
    });
} 