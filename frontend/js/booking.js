document.addEventListener('DOMContentLoaded', () => {
    // Check authentication
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/login.html';
        return;
    }

    // Load user data
    loadUserData();
    
    // Get bus details from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const busId = urlParams.get('busId');
    const scheduleId = urlParams.get('scheduleId');
    
    if (!busId || !scheduleId) {
        window.location.href = '/search.html';
        return;
    }

    // Load bus and schedule details
    loadBusDetails(busId, scheduleId);
    
    // Load seat map
    loadSeatMap(busId, scheduleId);
    
    // Setup form submission
    setupFormSubmission();
    
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

async function loadBusDetails(busId, scheduleId) {
    try {
        const response = await fetch(`http://localhost:5000/api/schedules/${scheduleId}?busId=${busId}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        if (response.ok) {
            const details = await response.json();
            
            // Update journey details
            document.getElementById('fromLocation').textContent = details.From_Location;
            document.getElementById('toLocation').textContent = details.To_Location;
            document.getElementById('journeyDate').textContent = new Date(details.Departure_Date).toLocaleDateString();
            document.getElementById('busType').textContent = details.Bus_Type;
            document.getElementById('departureTime').textContent = new Date(details.Departure_Date).toLocaleTimeString();
            document.getElementById('arrivalTime').textContent = new Date(details.Arrival_Date).toLocaleTimeString();
            document.getElementById('fare').textContent = details.Fare.toFixed(2);
            
            // Update price summary
            updatePriceSummary(details.Fare);
        }
    } catch (error) {
        console.error('Error loading bus details:', error);
    }
}

async function loadSeatMap(busId, scheduleId) {
    try {
        const response = await fetch(`http://localhost:5000/api/seats/${busId}?scheduleId=${scheduleId}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        if (response.ok) {
            const seatData = await response.json();
            const seatMap = document.getElementById('seatMap');
            seatMap.innerHTML = '';
            
            seatData.forEach(seat => {
                const seatElement = document.createElement('div');
                seatElement.className = `seat ${seat.Is_Booked ? 'booked' : 'available'}`;
                seatElement.dataset.seatId = seat.Seat_ID;
                seatElement.dataset.seatNumber = seat.Seat_Number;
                seatElement.innerHTML = `<span>${seat.Seat_Number}</span>`;
                
                if (!seat.Is_Booked) {
                    seatElement.addEventListener('click', () => toggleSeatSelection(seatElement));
                }
                
                seatMap.appendChild(seatElement);
            });
        }
    } catch (error) {
        console.error('Error loading seat map:', error);
    }
}

function toggleSeatSelection(seatElement) {
    const maxSeats = 6; // Maximum seats that can be selected
    const currentlySelected = document.querySelectorAll('.seat.selected').length;
    
    if (seatElement.classList.contains('selected')) {
        seatElement.classList.remove('selected');
        removePasengerForm(seatElement.dataset.seatNumber);
    } else if (currentlySelected < maxSeats) {
        seatElement.classList.add('selected');
        addPassengerForm(seatElement.dataset.seatNumber);
    } else {
        alert('Maximum 6 seats can be selected at once');
    }
    
    updatePriceSummary();
}

function addPassengerForm(seatNumber) {
    const passengerDetails = document.getElementById('passengerDetails');
    const formHtml = `
        <div class="passenger-form mb-4" data-seat="${seatNumber}">
            <h6>Passenger Details - Seat ${seatNumber}</h6>
            <div class="row">
                <div class="col-md-6 mb-3">
                    <label class="form-label">First Name</label>
                    <input type="text" class="form-control" name="firstName_${seatNumber}" required>
                </div>
                <div class="col-md-6 mb-3">
                    <label class="form-label">Last Name</label>
                    <input type="text" class="form-control" name="lastName_${seatNumber}" required>
                </div>
            </div>
            <div class="row">
                <div class="col-md-6 mb-3">
                    <label class="form-label">Age</label>
                    <input type="number" class="form-control" name="age_${seatNumber}" min="1" required>
                </div>
                <div class="col-md-6 mb-3">
                    <label class="form-label">Gender</label>
                    <select class="form-select" name="gender_${seatNumber}" required>
                        <option value="">Select Gender</option>
                        <option value="M">Male</option>
                        <option value="F">Female</option>
                        <option value="O">Other</option>
                    </select>
                </div>
            </div>
        </div>
    `;
    passengerDetails.insertAdjacentHTML('beforeend', formHtml);
}

function removePasengerForm(seatNumber) {
    const form = document.querySelector(`.passenger-form[data-seat="${seatNumber}"]`);
    if (form) {
        form.remove();
    }
}

function updatePriceSummary(baseFare = null) {
    const selectedSeats = document.querySelectorAll('.seat.selected').length;
    const fareElement = document.getElementById('fare');
    const baseFareElement = document.getElementById('baseFare');
    const taxElement = document.getElementById('tax');
    const totalFareElement = document.getElementById('totalFare');
    
    const fare = baseFare || parseFloat(fareElement.textContent);
    const totalBaseFare = fare * selectedSeats;
    const tax = totalBaseFare * 0.15;
    const totalFare = totalBaseFare + tax;
    
    baseFareElement.textContent = totalBaseFare.toFixed(2);
    taxElement.textContent = tax.toFixed(2);
    totalFareElement.textContent = totalFare.toFixed(2);
}

function setupFormSubmission() {
    const form = document.getElementById('passengerForm');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const selectedSeats = document.querySelectorAll('.seat.selected');
        if (selectedSeats.length === 0) {
            alert('Please select at least one seat');
            return;
        }
        
        const formData = new FormData(form);
        const passengers = [];
        
        selectedSeats.forEach(seat => {
            const seatNumber = seat.dataset.seatNumber;
            passengers.push({
                seatId: seat.dataset.seatId,
                seatNumber: seatNumber,
                firstName: formData.get(`firstName_${seatNumber}`),
                lastName: formData.get(`lastName_${seatNumber}`),
                age: formData.get(`age_${seatNumber}`),
                gender: formData.get(`gender_${seatNumber}`)
            });
        });
        
        const urlParams = new URLSearchParams(window.location.search);
        const bookingData = {
            busId: urlParams.get('busId'),
            scheduleId: urlParams.get('scheduleId'),
            passengers: passengers,
            totalFare: parseFloat(document.getElementById('totalFare').textContent)
        };
        
        try {
            const response = await fetch('http://localhost:5000/api/bookings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(bookingData)
            });
            
            if (response.ok) {
                const result = await response.json();
                // Redirect to payment page with booking ID
                window.location.href = `/payment.html?bookingId=${result.Booking_ID}`;
            } else {
                const error = await response.json();
                alert(error.message || 'Failed to create booking');
            }
        } catch (error) {
            console.error('Error creating booking:', error);
            alert('Failed to create booking. Please try again.');
        }
    });
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