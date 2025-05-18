document.addEventListener('DOMContentLoaded', () => {
    const registerForm = document.getElementById('registerForm');
    const password = document.getElementById('password');
    const confirmPassword = document.getElementById('confirmPassword');
    
    // Add password validation
    function validatePasswords() {
        if (password.value !== confirmPassword.value) {
            confirmPassword.classList.add('is-invalid');
            return false;
        }
        confirmPassword.classList.remove('is-invalid');
        return true;
    }

    // Add event listeners for password fields
    confirmPassword.addEventListener('input', validatePasswords);
    password.addEventListener('input', validatePasswords);
    
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            // Check if passwords match
            if (!validatePasswords()) {
                return;
            }

            // Disable the submit button and show loading state
            const submitButton = registerForm.querySelector('button[type="submit"]');
            const originalButtonText = submitButton.innerHTML;
            submitButton.disabled = true;
            submitButton.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Registering...';
            
            const formData = {
                User_ID: generateUserId(),
                First_Name: document.getElementById('firstName').value,
                Last_Name: document.getElementById('lastName').value,
                Age: parseInt(document.getElementById('age').value),
                Email: document.getElementById('email').value,
                Phone_Num: document.getElementById('phone').value,
                Password: document.getElementById('password').value,
                NextOfKin_Name: document.getElementById('nextOfKinName').value,
                NextOfKin_Phone: document.getElementById('nextOfKinPhone').value
            };
            
            try {
                // First check if the server is accessible
                const serverCheck = await fetch('http://localhost:5000/api/health')
                    .catch(() => {
                        throw new Error('Cannot connect to server. Please check if the server is running.');
                    });

                const response = await fetch('http://localhost:5000/api/auth/register', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(formData)
                });
                
                const data = await response.json();
                
                if (response.ok) {
                    // Show success message
                    alert('Registration successful! Redirecting to dashboard...');
                    // Store token
                    localStorage.setItem('token', data.token);
                    // Redirect to dashboard
                    window.location.href = '/dashboard.html';
                } else {
                    throw new Error(data.error || 'Registration failed. Please try again.');
                }
            } catch (error) {
                console.error('Registration error:', error);
                alert(error.message || 'Failed to connect to server. Please try again later.');
            } finally {
                // Re-enable the submit button and restore original text
                submitButton.disabled = false;
                submitButton.innerHTML = originalButtonText;
            }
        });
    }
});

function generateUserId() {
    return 'USER_' + Math.random().toString(36).substr(2, 9).toUpperCase();
} 