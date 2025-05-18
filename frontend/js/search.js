document.addEventListener('DOMContentLoaded', () => {
    // Check authentication
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/frontend/login.html';
        return;
    }

    // Initialize map
    let map;
    initializeMap();

    // Update user name in navbar
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
    if (userData.First_Name) {
        document.getElementById('userName').textContent = userData.First_Name;
    }

    // Set minimum date for journey date input
    const journeyDateInput = document.getElementById('journeyDate');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    journeyDateInput.min = today.toISOString().split('T')[0];

    // Get user's current location for the map
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            position => {
                const userLocation = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };
                updateMapWithUserLocation(userLocation);
            },
            error => {
                console.error('Error getting location:', error);
            }
        );
    }

    // Handle search form submission
    const searchForm = document.getElementById('searchForm');
    if (searchForm) {
        searchForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const fromLocation = document.getElementById('fromLocation').value.trim();
            const toLocation = document.getElementById('toLocation').value.trim();
            const journeyDate = document.getElementById('journeyDate').value;
            const passengers = document.getElementById('passengers').value;
            
            // Validate input
            if (!fromLocation || !toLocation || !journeyDate || !passengers) {
                alert('Please fill in all fields');
                return;
            }

            // Show loading state
            const busListContainer = document.getElementById('busListContainer');
            busListContainer.innerHTML = `
                <div class="text-center">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Loading...</span>
                    </div>
                    <p class="mt-2">Searching for available buses...</p>
                </div>
            `;

            try {
                // Get route information first
                const routeResponse = await fetch(`http://localhost:5000/api/routes/info`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        fromLocation,
                        toLocation
                    })
                });

                if (!routeResponse.ok) {
                    throw new Error('Failed to fetch route information');
                }

                const routeInfo = await routeResponse.json();
                
                // Update map with route and stops
                updateMapWithRoute(routeInfo.stops);

                // Make API request to search buses
                const response = await fetch(`http://localhost:5000/api/schedules/search`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        fromLocation,
                        toLocation,
                        journeyDate,
                        passengers: parseInt(passengers)
                    })
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch buses');
                }

                const buses = await response.json();
                
                // Get active trips for availability checking
                const activeTripsResponse = await fetch(`http://localhost:5000/api/schedules/active-trips`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                const activeTrips = await activeTripsResponse.json();
                
                // Filter out buses that are currently on trips
                const availableBuses = buses.filter(bus => 
                    !activeTrips.some(trip => 
                        trip.Bus_ID === bus.Bus_ID && 
                        isTimeConflict(trip.DepartureTime, trip.ArrivalTime, bus.DepartureTime)
                    )
                );
                
                // Limit to maximum 10 buses and sort by route order
                const limitedBuses = availableBuses
                    .slice(0, 10)
                    .sort((a, b) => a.RouteOrder - b.RouteOrder);
                
                // Display results
                displaySearchResults(limitedBuses, routeInfo);

                // Setup sorting
                setupSorting(limitedBuses, routeInfo);
            } catch (error) {
                console.error('Error searching buses:', error);
                busListContainer.innerHTML = `
                    <div class="alert alert-danger" role="alert">
                        <i class="fas fa-exclamation-circle me-2"></i>
                        Failed to search buses. Please try again.
                    </div>
                `;
            }
        });
    }

    // Handle logout
    document.getElementById('logoutBtn').addEventListener('click', handleLogout);
});

function initializeMap() {
    // Initialize Google Maps
    map = new google.maps.Map(document.getElementById('map'), {
        zoom: 12,
        center: { lat: -26.2041, lng: 28.0473 } // Default to Johannesburg
    });
}

function updateMapWithUserLocation(location) {
    if (map) {
        map.setCenter(location);
        new google.maps.Marker({
            position: location,
            map: map,
            title: 'Your Location',
            icon: {
                url: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png'
            }
        });
    }
}

function updateMapWithRoute(stops) {
    if (!map) return;

    // Clear existing markers
    map.markers?.forEach(marker => marker.setMap(null));
    map.markers = [];

    // Add markers for each stop
    stops.forEach((stop, index) => {
        const marker = new google.maps.Marker({
            position: { lat: stop.latitude, lng: stop.longitude },
            map: map,
            title: stop.name,
            label: (index + 1).toString()
        });
        map.markers.push(marker);
    });

    // Draw route line
    const path = stops.map(stop => ({ lat: stop.latitude, lng: stop.longitude }));
    new google.maps.Polyline({
        path: path,
        geodesic: true,
        strokeColor: '#FF0000',
        strokeOpacity: 1.0,
        strokeWeight: 2,
        map: map
    });

    // Fit map to show all stops
    const bounds = new google.maps.LatLngBounds();
    stops.forEach(stop => bounds.extend({ lat: stop.latitude, lng: stop.longitude }));
    map.fitBounds(bounds);
}

function isTimeConflict(tripStart, tripEnd, newTripStart) {
    const start = new Date(tripStart);
    const end = new Date(tripEnd);
    const newStart = new Date(newTripStart);
    return newStart >= start && newStart <= end;
}

function displaySearchResults(buses, routeInfo) {
    const busListContainer = document.getElementById('busListContainer');
    
    if (!buses || buses.length === 0) {
        busListContainer.innerHTML = `
            <div class="alert alert-info" role="alert">
                <i class="fas fa-info-circle me-2"></i>
                No buses available for the selected route and date.
            </div>
        `;
        return;
    }

    const busCards = buses.map((bus, index) => `
        <div class="card mb-3 bus-card">
            <div class="card-body">
                <div class="row align-items-center">
                    <div class="col-md-3">
                        <h5 class="card-title mb-0">${bus.Bus_Model}</h5>
                        <small class="text-muted">Bus ID: ${bus.Bus_ID}</small>
                        <div class="badge bg-info mt-2">Bus ${index + 1} of ${buses.length}</div>
                    </div>
                    <div class="col-md-3">
                        <div class="text-muted mb-1">Departure</div>
                        <strong>${new Date(bus.DepartureTime).toLocaleTimeString()}</strong>
                        <div class="text-success mt-1">
                            <i class="fas fa-check-circle"></i> Available
                        </div>
                    </div>
                    <div class="col-md-2">
                        <div class="text-center">
                            <div class="text-muted mb-1">Duration</div>
                            <strong>${bus.Estimated_Time}</strong>
                        </div>
                    </div>
                    <div class="col-md-2">
                        <div class="text-muted mb-1">Available Seats</div>
                        <strong>${bus.Seat_Available}</strong>
                        <div class="progress mt-2" style="height: 5px;">
                            <div class="progress-bar" role="progressbar" 
                                 style="width: ${(bus.Seat_Available / bus.Bus_Capacity) * 100}%"></div>
                        </div>
                    </div>
                    <div class="col-md-2 text-end">
                        <div class="text-muted mb-1">Fare</div>
                        <h5 class="mb-2">R${bus.Fare.toFixed(2)}</h5>
                        <a href="/frontend/booking.html?busId=${bus.Bus_ID}&scheduleId=${bus.Schedule_ID}" 
                           class="btn btn-primary btn-sm w-100">Select</a>
                    </div>
                </div>
                <div class="mt-3 pt-3 border-top">
                    <small class="text-muted">
                        <i class="fas fa-map-marker-alt text-primary"></i> Route: 
                        ${routeInfo.stops.map((stop, idx) => 
                            `<span class="badge bg-light text-dark">${idx + 1}. ${stop.name}</span>`
                        ).join(' → ')}
                    </small>
                </div>
            </div>
        </div>
    `).join('');

    busListContainer.innerHTML = busCards;
}

function setupSorting(buses, routeInfo) {
    const sortPrice = document.getElementById('sortPrice');
    const sortTime = document.getElementById('sortTime');

    sortPrice.addEventListener('click', () => {
        const sorted = [...buses].sort((a, b) => a.Fare - b.Fare);
        displaySearchResults(sorted, routeInfo);
    });

    sortTime.addEventListener('click', () => {
        const sorted = [...buses].sort((a, b) => 
            new Date(a.DepartureTime) - new Date(b.DepartureTime)
        );
        displaySearchResults(sorted, routeInfo);
    });
}

async function handleLogout(e) {
    e.preventDefault();
    const token = localStorage.getItem('token');
    try {
        const response = await fetch('http://localhost:5000/api/auth/logout', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            localStorage.removeItem('token');
            localStorage.removeItem('userData');
            window.location.href = '/frontend/login.html';
        } else {
            throw new Error('Logout failed');
        }
    } catch (error) {
        console.error('Logout error:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('userData');
        window.location.href = '/frontend/login.html';
    }
} 