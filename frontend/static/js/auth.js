// Authentication JavaScript

// API Base URL
const API_BASE_URL = '/api';
const STORAGE_KEY = 'auth_token';

// Login Form Handler
const loginForm = document.getElementById('login-form');
if (loginForm) {
    loginForm.addEventListener('submit', handleLogin);
}

// Password Toggle
const togglePassword = document.getElementById('toggle-password');
if (togglePassword) {
    togglePassword.addEventListener('click', function() {
        const passwordInput = document.getElementById('password');
        const icon = this.querySelector('i');
        
        if (passwordInput.type === 'password') {
            passwordInput.type = 'text';
            icon.classList.remove('fa-eye');
            icon.classList.add('fa-eye-slash');
        } else {
            passwordInput.type = 'password';
            icon.classList.remove('fa-eye-slash');
            icon.classList.add('fa-eye');
        }
    });
}

async function handleLogin(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    const rememberMe = document.getElementById('remember-me').checked;
    
    // Reset alerts
    const loginAlert = document.getElementById('login-alert');
    const usernameError = document.getElementById('username-error');
    const passwordError = document.getElementById('password-error');
    
    loginAlert.classList.add('d-none');
    usernameError.classList.add('d-none');
    passwordError.classList.add('d-none');
    
    // Validation
    if (!username) {
        usernameError.textContent = 'Username or email is required';
        usernameError.classList.remove('d-none');
        return;
    }
    
    if (!password) {
        passwordError.textContent = 'Password is required';
        passwordError.classList.remove('d-none');
        return;
    }
    
    // Show loading state
    const loginBtn = document.getElementById('login-btn');
    const loginText = document.getElementById('login-text');
    const loginSpinner = document.getElementById('login-spinner');
    
    loginBtn.disabled = true;
    loginText.textContent = 'Logging in...';
    loginSpinner.classList.remove('d-none');
    
    try {
        const response = await fetch(`${API_BASE_URL}/auth/login/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken')
            },
            body: JSON.stringify({
                username: username,
                password: password
            })
        });
        
        if (response.ok) {
            const data = await response.json();
            
            // Store authentication token
            localStorage.setItem(STORAGE_KEY, data.token);
            
            if (rememberMe) {
                localStorage.setItem('remember_me', 'true');
                localStorage.setItem('remembered_username', username);
            }
            
            // Redirect to dashboard
            window.location.href = '/dashboard';
        } else {
            const error = await response.json();
            loginAlert.textContent = error.detail || 'Invalid username or password';
            loginAlert.classList.remove('d-none');
        }
    } catch (error) {
        console.error('Login error:', error);
        loginAlert.textContent = 'An error occurred during login. Please try again.';
        loginAlert.classList.remove('d-none');
    } finally {
        loginBtn.disabled = false;
        loginText.textContent = 'Login';
        loginSpinner.classList.add('d-none');
    }
}

// Pre-fill remembered username
window.addEventListener('load', function() {
    const remembered = localStorage.getItem('remember_me');
    const username = localStorage.getItem('remembered_username');
    
    if (remembered && username) {
        document.getElementById('username').value = username;
        document.getElementById('remember-me').checked = true;
    }
});

// Utility: Get CSRF Token
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

// Utility: Get Authorization Header
function getAuthHeader() {
    const token = localStorage.getItem(STORAGE_KEY);
    if (token) {
        return {
            'Authorization': `Bearer ${token}`
        };
    }
    return {};
}

// Utility: Check if user is authenticated
function isAuthenticated() {
    return localStorage.getItem(STORAGE_KEY) !== null;
}

// Utility: Logout
function logout() {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem('remember_me');
    localStorage.removeItem('remembered_username');
    window.location.href = '/login';
}
