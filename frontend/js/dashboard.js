document.addEventListener('DOMContentLoaded', () => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');

    if (!token) {
        window.location.href = '/frontend/login.html';
        return;
    }

    // Update user name in the navbar and welcome message
    const userNameElement = document.getElementById('userName');
    const userWelcomeElement = document.getElementById('userWelcome');
    
    if (userData.First_Name) {
        userNameElement.textContent = userData.First_Name;
        userWelcomeElement.textContent = `${userData.First_Name} ${userData.Last_Name}`;
    }

    // Handle logout
    document.getElementById('logoutBtn').addEventListener('click', async (e) => {
        e.preventDefault();
        try {
            const response = await fetch('http://localhost:5000/api/auth/logout', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                // Clear local storage
                localStorage.removeItem('token');
                localStorage.removeItem('userData');
                
                // Redirect to login page
                window.location.href = '/frontend/login.html';
            } else {
                throw new Error('Logout failed');
            }
        } catch (error) {
            console.error('Logout error:', error);
            // If logout fails, still clear local storage and redirect
            localStorage.removeItem('token');
            localStorage.removeItem('userData');
            window.location.href = '/frontend/login.html';
        }
    });

    // Load dashboard data
    loadDashboardData();
});

async function loadDashboardData() {
    const token = localStorage.getItem('token');
    
    try {
        // Load active bookings count
        const activeBookingsResponse = await fetch('http://localhost:5000/api/bookings/active', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (activeBookingsResponse.ok) {
            const activeBookings = await activeBookingsResponse.json();
            document.getElementById('activeBookingsCount').textContent = activeBookings.length;
        }

        // Load completed trips count
        const completedTripsResponse = await fetch('http://localhost:5000/api/bookings/completed', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (completedTripsResponse.ok) {
            const completedTrips = await completedTripsResponse.json();
            document.getElementById('completedTripsCount').textContent = completedTrips.length;
        }

        // Load recent bookings
        const recentBookingsResponse = await fetch('http://localhost:5000/api/bookings/recent', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (recentBookingsResponse.ok) {
            const recentBookings = await recentBookingsResponse.json();
            updateRecentBookingsTable(recentBookings);
        }

        // Load upcoming trip
        const upcomingTripResponse = await fetch('http://localhost:5000/api/bookings/upcoming', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (upcomingTripResponse.ok) {
            const upcomingTrip = await upcomingTripResponse.json();
            updateUpcomingTripCard(upcomingTrip);
        }

    } catch (error) {
        console.error('Error loading dashboard data:', error);
    }
}

function updateRecentBookingsTable(bookings) {
    const tbody = document.querySelector('#recentBookingsTable tbody');
    tbody.innerHTML = '';

    if (bookings.length === 0) {
        const tr = document.createElement('tr');
        tr.innerHTML = '<td colspan="5" class="text-center">No recent bookings</td>';
        tbody.appendChild(tr);
        return;
    }

    bookings.forEach(booking => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${booking.Booking_ID}</td>
            <td>${booking.route}</td>
            <td>${new Date(booking.date).toLocaleDateString()}</td>
            <td><span class="badge bg-${getStatusBadgeClass(booking.status)}">${booking.status}</span></td>
            <td>
                <a href="/frontend/booking-details.html?id=${booking.Booking_ID}" class="btn btn-sm btn-primary">View</a>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function updateUpcomingTripCard(trip) {
    const card = document.getElementById('upcomingTripCard');
    
    if (!trip) {
        card.innerHTML = '<p class="text-muted text-center mb-0">No upcoming trips</p>';
        return;
    }

    card.innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-3">
            <div>
                <h6 class="mb-1">${trip.route}</h6>
                <small class="text-muted">${new Date(trip.date).toLocaleDateString()}</small>
            </div>
            <span class="badge bg-${getStatusBadgeClass(trip.status)}">${trip.status}</span>
        </div>
        <div class="d-grid">
            <a href="/frontend/booking-details.html?id=${trip.Booking_ID}" class="btn btn-primary">View Details</a>
        </div>
    `;
}

function getStatusBadgeClass(status) {
    switch (status.toLowerCase()) {
        case 'confirmed':
            return 'success';
        case 'pending':
            return 'warning';
        case 'cancelled':
            return 'danger';
        default:
            return 'secondary';
    }
} 