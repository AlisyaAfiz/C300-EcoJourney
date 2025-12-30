// Forgot Password JavaScript

const API_BASE_URL = '/api';
const STORAGE_KEY = 'auth_token';

// Form Handlers
const resetRequestForm = document.getElementById('reset-request-form');
const resetConfirmForm = document.getElementById('reset-confirm-form');

if (resetRequestForm) {
    resetRequestForm.addEventListener('submit', handleResetRequest);
}

if (resetConfirmForm) {
    resetConfirmForm.addEventListener('submit', handleResetConfirm);
}

// Password Toggle Functions
const togglePassword1 = document.getElementById('toggle-password-1');
const togglePassword2 = document.getElementById('toggle-password-2');

if (togglePassword1) {
    togglePassword1.addEventListener('click', function() {
        togglePasswordField('new-password', this);
    });
}

if (togglePassword2) {
    togglePassword2.addEventListener('click', function() {
        togglePasswordField('confirm-password', this);
    });
}

function togglePasswordField(fieldId, button) {
    const field = document.getElementById(fieldId);
    const icon = button.querySelector('i');
    
    if (field.type === 'password') {
        field.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
    } else {
        field.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
    }
}

// Reset Request Handler
async function handleResetRequest(e) {
    e.preventDefault();
    
    const email = document.getElementById('email').value.trim();
    const requestBtn = document.getElementById('request-btn');
    const requestText = document.getElementById('request-text');
    const requestSpinner = document.getElementById('request-spinner');
    const requestAlert = document.getElementById('request-alert');
    const requestSuccess = document.getElementById('request-success');
    const emailError = document.getElementById('email-error');
    
    // Reset messages
    requestAlert.classList.add('d-none');
    requestSuccess.classList.add('d-none');
    emailError.classList.add('d-none');
    
    // Validation
    if (!email) {
        emailError.textContent = 'Email is required';
        emailError.classList.remove('d-none');
        return;
    }
    
    if (!isValidEmail(email)) {
        emailError.textContent = 'Please enter a valid email address';
        emailError.classList.remove('d-none');
        return;
    }
    
    // Show loading state
    requestBtn.disabled = true;
    requestText.textContent = 'Sending...';
    requestSpinner.classList.remove('d-none');
    
    try {
        const response = await fetch(`${API_BASE_URL}/auth/password-reset-request/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken')
            },
            body: JSON.stringify({
                email: email
            })
        });
        
        if (response.ok) {
            requestSuccess.innerHTML = `
                <strong>Check your email!</strong> 
                <br>
                We've sent you a password reset link to <strong>${email}</strong>. 
                Please check your email (including spam folder) for further instructions.
            `;
            requestSuccess.classList.remove('d-none');
            
            // Show confirmation section after 2 seconds
            setTimeout(() => {
                document.getElementById('reset-request-section').style.display = 'none';
                document.getElementById('reset-confirm-section').style.display = 'block';
            }, 2000);
        } else {
            const error = await response.json();
            requestAlert.textContent = error.detail || 'An error occurred. Please try again.';
            requestAlert.classList.remove('d-none');
        }
    } catch (error) {
        console.error('Reset request error:', error);
        requestAlert.textContent = 'An error occurred. Please try again later.';
        requestAlert.classList.remove('d-none');
    } finally {
        requestBtn.disabled = false;
        requestText.textContent = 'Send Reset Link';
        requestSpinner.classList.add('d-none');
    }
}

// Reset Confirm Handler
async function handleResetConfirm(e) {
    e.preventDefault();
    
    const token = document.getElementById('reset-token').value.trim();
    const password = document.getElementById('new-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    const confirmBtn = document.getElementById('confirm-btn');
    const confirmText = document.getElementById('confirm-text');
    const confirmSpinner = document.getElementById('confirm-spinner');
    const confirmAlert = document.getElementById('confirm-alert');
    const confirmSuccess = document.getElementById('confirm-success');
    const tokenError = document.getElementById('token-error');
    const passwordError = document.getElementById('password-error');
    const confirmError = document.getElementById('confirm-error');
    
    // Reset messages
    confirmAlert.classList.add('d-none');
    confirmSuccess.classList.add('d-none');
    tokenError.classList.add('d-none');
    passwordError.classList.add('d-none');
    confirmError.classList.add('d-none');
    
    // Validation
    if (!token) {
        tokenError.textContent = 'Reset token is required';
        tokenError.classList.remove('d-none');
        return;
    }
    
    if (!password) {
        passwordError.textContent = 'Password is required';
        passwordError.classList.remove('d-none');
        return;
    }
    
    if (password.length < 8) {
        passwordError.textContent = 'Password must be at least 8 characters long';
        passwordError.classList.remove('d-none');
        return;
    }
    
    if (!validatePasswordStrength(password)) {
        passwordError.textContent = 'Password must contain uppercase, lowercase, number, and special character';
        passwordError.classList.remove('d-none');
        return;
    }
    
    if (password !== confirmPassword) {
        confirmError.textContent = 'Passwords do not match';
        confirmError.classList.remove('d-none');
        return;
    }
    
    // Show loading state
    confirmBtn.disabled = true;
    confirmText.textContent = 'Resetting...';
    confirmSpinner.classList.remove('d-none');
    
    try {
        const response = await fetch(`${API_BASE_URL}/auth/password-reset-confirm/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken')
            },
            body: JSON.stringify({
                token: token,
                password: password,
                password_confirm: confirmPassword
            })
        });
        
        if (response.ok) {
            confirmSuccess.innerHTML = `
                <strong>Success!</strong> 
                <br>
                Your password has been reset. You will be redirected to login in 3 seconds...
            `;
            confirmSuccess.classList.remove('d-none');
            
            // Redirect to login after 3 seconds
            setTimeout(() => {
                window.location.href = '/login';
            }, 3000);
        } else {
            const error = await response.json();
            confirmAlert.textContent = error.detail || 'An error occurred. Please try again.';
            confirmAlert.classList.remove('d-none');
        }
    } catch (error) {
        console.error('Reset confirm error:', error);
        confirmAlert.textContent = 'An error occurred. Please try again later.';
        confirmAlert.classList.remove('d-none');
    } finally {
        confirmBtn.disabled = false;
        confirmText.textContent = 'Reset Password';
        confirmSpinner.classList.add('d-none');
    }
}

// Utility Functions

function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function validatePasswordStrength(password) {
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};:'".,<>?/\\|`~]/.test(password);
    
    return hasUppercase && hasLowercase && hasNumber && hasSpecialChar;
}
