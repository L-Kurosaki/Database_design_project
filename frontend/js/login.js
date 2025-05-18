document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const email = document.getElementById('email').value.trim();
            const password = document.getElementById('password').value;
            
            // Validate input
            if (!email || !password) {
                alert('Please fill in all fields');
                return;
            }

            // Validate email format
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                alert('Please enter a valid email address');
                return;
            }
            
            // Disable submit button and show loading state
            const submitButton = loginForm.querySelector('button[type="submit"]');
            const originalButtonText = submitButton.innerHTML;
            submitButton.disabled = true;
            submitButton.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Logging in...';
            
            try {
                // First check if server is accessible
                console.log('Checking server health...');
                const serverCheck = await fetch('http://localhost:5000/api/health');
                const serverHealth = await serverCheck.json();
                console.log('Server health check response:', serverHealth);

                if (!serverCheck.ok) {
                    throw new Error('Server is not responding. Please try again later.');
                }

                // Create login data object
                const loginData = {
                    Email: email,
                    Password: password
                };

                // Log request details
                console.log('Attempting login with email:', email);
                console.log('Request URL:', 'http://localhost:5000/api/auth/login');
                console.log('Request method:', 'POST');
                console.log('Request headers:', {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                });

                // Make login request
                const response = await fetch('http://localhost:5000/api/auth/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify(loginData)
                });
                
                // Log raw response
                console.log('Raw response status:', response.status);
                console.log('Raw response headers:', Object.fromEntries([...response.headers]));

                // Parse response
                const data = await response.json();
                console.log('Response data:', data);
                
                if (response.ok) {
                    console.log('Login successful, received token');
                    // Store token and user data
                    localStorage.setItem('token', data.token);
                    localStorage.setItem('userData', JSON.stringify(data.user));
                    
                    // Show success message and redirect
                    alert('Login successful! Redirecting to dashboard...');
                    
                    // Get the base URL
                    const baseUrl = window.location.origin;
                    const dashboardPath = '/frontend/dashboard.html';
                    
                    // Redirect to dashboard using the full URL
                    window.location.href = baseUrl + dashboardPath;
                } else {
                    // Handle specific error messages
                    const errorMessage = data.error || 'Login failed. Please try again.';
                    if (data.details) {
                        console.error('Login validation errors:', data.details);
                    }
                    throw new Error(errorMessage);
                }
            } catch (error) {
                console.error('Login error:', {
                    message: error.message,
                    type: error.name,
                    fullError: error
                });
                alert(error.message || 'Failed to login. Please try again.');
            } finally {
                // Re-enable submit button and restore text
                submitButton.disabled = false;
                submitButton.innerHTML = originalButtonText;
            }
        });
    }
}); 