// Dashboard JavaScript

const API_BASE_URL = '/api';
const STORAGE_KEY = 'auth_token';

// User Data
let currentUser = null;
let userRole = null;

// Initialize Dashboard
document.addEventListener('DOMContentLoaded', function() {
    initializeDashboard();
    setupEventListeners();
    loadUserData();
    loadDashboardStats();
    loadCategories();
});

// Setup Event Listeners
function setupEventListeners() {
    // Sidebar Toggle
    const sidebarToggle = document.getElementById('sidebar-toggle');
    const sidebar = document.querySelector('.sidebar');
    
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', function() {
            sidebar.classList.toggle('show');
        });
    }
    
    // Logout
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
    
    // Upload Form
    const uploadForm = document.getElementById('upload-form');
    if (uploadForm) {
        uploadForm.addEventListener('submit', handleContentUpload);
    }
    
    // Content Search and Filter
    const contentSearch = document.getElementById('content-search');
    const statusFilter = document.getElementById('status-filter');
    
    if (contentSearch) {
        contentSearch.addEventListener('keyup', debounce(loadUserContent, 500));
    }
    
    if (statusFilter) {
        statusFilter.addEventListener('change', loadUserContent);
    }
    
    // Approval Search and Filter
    const approvalSearch = document.getElementById('approval-search');
    const approvalStatusFilter = document.getElementById('approval-status-filter');
    
    if (approvalSearch) {
        approvalSearch.addEventListener('keyup', debounce(loadPendingApprovals, 500));
    }
    
    if (approvalStatusFilter) {
        approvalStatusFilter.addEventListener('change', loadPendingApprovals);
    }
    
    // Profile Form
    const profileForm = document.getElementById('profile-form');
    if (profileForm) {
        profileForm.addEventListener('submit', handleProfileUpdate);
    }
    
    // Tab Changes
    const tabs = document.querySelectorAll('[data-bs-toggle="tab"]');
    tabs.forEach(tab => {
        tab.addEventListener('shown.bs.tab', function(e) {
            const tabId = e.target.getAttribute('href').substring(1);
            handleTabChange(tabId);
        });
    });
}

// Initialize Dashboard
async function initializeDashboard() {
    // Check authentication
    if (!isAuthenticated()) {
        window.location.href = '/login';
        return;
    }
    
    // Load user data
    await loadUserData();
}

// Load User Data
async function loadUserData() {
    try {
        const response = await fetchAPI('/auth/user/', 'GET');
        
        if (response.ok) {
            currentUser = await response.json();
            userRole = currentUser.role.name;
            
            // Update UI with user info
            document.getElementById('user-name').textContent = 
                currentUser.first_name + ' ' + currentUser.last_name || currentUser.username;
            document.getElementById('user-role').textContent = currentUser.role.description;
            document.getElementById('profile-name').textContent = 
                currentUser.first_name + ' ' + currentUser.last_name || currentUser.username;
            document.getElementById('profile-role').textContent = currentUser.role.description;
            document.getElementById('profile-email').textContent = currentUser.email;
            
            // Pre-fill profile form
            document.getElementById('profile-first-name').value = currentUser.first_name;
            document.getElementById('profile-last-name').value = currentUser.last_name;
            document.getElementById('profile-organization').value = currentUser.organization || '';
            document.getElementById('profile-phone').value = currentUser.phone_number || '';
            
            // Show/hide role-specific sections
            const approvalsMenu = document.getElementById('approvals-menu');
            const adminMenu = document.getElementById('admin-menu');
            
            if (userRole === 'content_manager') {
                approvalsMenu.style.display = 'block';
            }
            
            if (userRole === 'admin') {
                adminMenu.style.display = 'block';
                loadAdminDashboard();
            }
            
            // Load content
            loadUserContent();
        } else if (response.status === 401) {
            logout();
        }
    } catch (error) {
        console.error('Error loading user data:', error);
        showAlert('Error loading user data', 'danger');
    }
}

// Load Dashboard Statistics
async function loadDashboardStats() {
    try {
        // Get content statistics
        const contentResponse = await fetchAPI('/content/my-content/?limit=100', 'GET');
        
        if (contentResponse.ok) {
            const contentData = await contentResponse.json();
            const contents = contentData.results || [];
            
            // Calculate statistics
            const totalContent = contents.length;
            const approved = contents.filter(c => c.status === 'approved').length;
            const pending = contents.filter(c => c.status === 'pending').length;
            const rejected = contents.filter(c => c.status === 'rejected').length;
            
            // Update stat cards
            document.getElementById('total-content').textContent = totalContent;
            document.getElementById('approved-count').textContent = approved;
            document.getElementById('pending-count-stat').textContent = pending;
            document.getElementById('rejected-count').textContent = rejected;
            document.getElementById('pending-count').textContent = pending > 0 ? pending : '';
            
            // Load recent content
            loadRecentContent(contents.slice(0, 5));
        }
    } catch (error) {
        console.error('Error loading dashboard stats:', error);
    }
}

// Load Recent Content
function loadRecentContent(contents) {
    const recentContent = document.getElementById('recent-content');
    
    if (contents.length === 0) {
        recentContent.innerHTML = '<p class="text-muted text-center py-4">No content uploaded yet</p>';
        return;
    }
    
    let html = '<table class="table table-hover"><tbody>';
    
    contents.forEach(content => {
        html += `
            <tr>
                <td>
                    <strong>${content.title}</strong>
                    <br>
                    <small class="text-muted">${content.category_name}</small>
                </td>
                <td><span class="badge bg-${getStatusColor(content.status)}">${content.status.toUpperCase()}</span></td>
                <td><small>${new Date(content.created_at).toLocaleDateString()}</small></td>
            </tr>
        `;
    });
    
    html += '</tbody></table>';
    recentContent.innerHTML = html;
}

// Load User Content
async function loadUserContent() {
    try {
        const searchQuery = document.getElementById('content-search')?.value || '';
        const statusFilter = document.getElementById('status-filter')?.value || '';
        
        let url = '/content/my-content/';
        const params = new URLSearchParams();
        
        if (searchQuery) {
            params.append('search', searchQuery);
        }
        
        if (statusFilter) {
            params.append('status', statusFilter);
        }
        
        if (params.toString()) {
            url += '?' + params.toString();
        }
        
        const response = await fetchAPI(url, 'GET');
        
        if (response.ok) {
            const data = await response.json();
            const contents = data.results || [];
            
            const contentList = document.getElementById('content-list');
            
            if (contents.length === 0) {
                contentList.innerHTML = '<div class="alert alert-info">No content found. Upload your first content!</div>';
                return;
            }
            
            let html = '<table class="table table-striped"><thead><tr><th>Title</th><th>Type</th><th>Category</th><th>Status</th><th>Submitted</th><th>Actions</th></tr></thead><tbody>';
            
            contents.forEach(content => {
                html += `
                    <tr>
                        <td><strong>${content.title}</strong></td>
                        <td>${content.content_type}</td>
                        <td>${content.category_name}</td>
                        <td><span class="badge bg-${getStatusColor(content.status)}">${content.status.toUpperCase()}</span></td>
                        <td>${content.submitted_at ? new Date(content.submitted_at).toLocaleDateString() : '-'}</td>
                        <td>
                            <button class="btn btn-sm btn-info" onclick="viewContent('${content.id}')">View</button>
                            ${content.status === 'draft' ? `<button class="btn btn-sm btn-primary" onclick="editContent('${content.id}')">Edit</button>` : ''}
                            ${content.status === 'draft' ? `<button class="btn btn-sm btn-success" onclick="submitContent('${content.id}')">Submit</button>` : ''}
                        </td>
                    </tr>
                `;
            });
            
            html += '</tbody></table>';
            contentList.innerHTML = html;
        }
    } catch (error) {
        console.error('Error loading user content:', error);
        showAlert('Error loading content', 'danger');
    }
}

// Handle Content Upload
async function handleContentUpload(e) {
    e.preventDefault();
    
    const title = document.getElementById('content-title').value;
    const description = document.getElementById('content-description').value;
    const contentType = document.getElementById('content-type').value;
    const category = document.getElementById('content-category').value;
    const file = document.getElementById('content-file').files[0];
    const tags = document.getElementById('content-tags').value;
    
    if (!title || !contentType || !category || !file) {
        showAlert('Please fill all required fields', 'danger');
        return;
    }
    
    // Create FormData for file upload
    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    formData.append('content_type', contentType);
    formData.append('category', category);
    formData.append('file', file);
    formData.append('tags_list', tags.split(',').map(t => t.trim()));
    
    try {
        const response = await fetch(`${API_BASE_URL}/content/create/`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem(STORAGE_KEY)}`,
                'X-CSRFToken': getCookie('csrftoken')
            },
            body: formData
        });
        
        if (response.ok) {
            showAlert('Content uploaded successfully!', 'success');
            document.getElementById('upload-form').reset();
            
            // Close modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('uploadModal'));
            modal.hide();
            
            // Reload content list
            loadUserContent();
        } else {
            const error = await response.json();
            showAlert(error.detail || 'Error uploading content', 'danger');
        }
    } catch (error) {
        console.error('Error uploading content:', error);
        showAlert('Error uploading content', 'danger');
    }
}

// Load Categories
async function loadCategories() {
    try {
        const response = await fetchAPI('/content/categories/', 'GET');
        
        if (response.ok) {
            const data = await response.json();
            const categories = data.results || [];
            
            // Update category select in upload form
            const categorySelect = document.getElementById('content-category');
            if (categorySelect) {
                categories.forEach(cat => {
                    const option = document.createElement('option');
                    option.value = cat.id;
                    option.textContent = cat.name;
                    categorySelect.appendChild(option);
                });
            }
            
            // Update category breakdown in dashboard
            loadCategoryBreakdown(categories);
        }
    } catch (error) {
        console.error('Error loading categories:', error);
    }
}

// Load Category Breakdown
async function loadCategoryBreakdown(categories) {
    try {
        const response = await fetchAPI('/content/my-content/?limit=100', 'GET');
        
        if (response.ok) {
            const data = await response.json();
            const contents = data.results || [];
            
            const categoryBreakdown = document.getElementById('category-breakdown');
            let html = '';
            
            categories.forEach(cat => {
                const count = contents.filter(c => c.category === cat.id).length;
                html += `
                    <div style="margin-bottom: 15px;">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                            <strong>${cat.name}</strong>
                            <span class="badge bg-primary">${count}</span>
                        </div>
                        <div class="progress" style="height: 8px;">
                            <div class="progress-bar" style="width: ${count > 0 ? (count / contents.length * 100) : 0}%; background-color: ${cat.color_code};"></div>
                        </div>
                    </div>
                `;
            });
            
            categoryBreakdown.innerHTML = html || '<p class="text-muted">No category data</p>';
        }
    } catch (error) {
        console.error('Error loading category breakdown:', error);
    }
}

// Load Pending Approvals (Content Manager)
async function loadPendingApprovals() {
    if (userRole !== 'content_manager') return;
    
    try {
        const searchQuery = document.getElementById('approval-search')?.value || '';
        const statusFilter = document.getElementById('approval-status-filter')?.value || 'pending';
        
        let url = '/content/pending-approvals/';
        const params = new URLSearchParams();
        
        if (searchQuery) {
            params.append('search', searchQuery);
        }
        
        if (statusFilter !== 'all') {
            params.append('status', statusFilter);
        }
        
        if (params.toString()) {
            url += '?' + params.toString();
        }
        
        const response = await fetchAPI(url, 'GET');
        
        if (response.ok) {
            const data = await response.json();
            const approvals = data.results || [];
            
            const approvalQueue = document.getElementById('approval-queue');
            
            if (approvals.length === 0) {
                approvalQueue.innerHTML = '<div class="alert alert-info">No pending approvals</div>';
                return;
            }
            
            let html = '';
            
            approvals.forEach(approval => {
                html += `
                    <div class="card mb-3">
                        <div class="card-body">
                            <div class="row">
                                <div class="col-md-8">
                                    <h5>${approval.title}</h5>
                                    <p class="text-muted">${approval.description ? approval.description.substring(0, 100) + '...' : 'No description'}</p>
                                    <small>
                                        Submitted by: <strong>${approval.created_by_username}</strong> | 
                                        Type: <strong>${approval.content_type}</strong> | 
                                        Date: <strong>${new Date(approval.submitted_at).toLocaleDateString()}</strong>
                                    </small>
                                </div>
                                <div class="col-md-4 text-end">
                                    <button class="btn btn-primary btn-sm" onclick="reviewContent('${approval.id}')">Review</button>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            });
            
            approvalQueue.innerHTML = html;
        }
    } catch (error) {
        console.error('Error loading pending approvals:', error);
        showAlert('Error loading approvals', 'danger');
    }
}

// Load Admin Dashboard
async function loadAdminDashboard() {
    if (userRole !== 'admin') return;
    
    loadAdminUsers();
    loadAdminCategories();
    loadAllContent();
}

// Load Admin Users
async function loadAdminUsers() {
    try {
        const response = await fetchAPI('/auth/users/', 'GET');
        
        if (response.ok) {
            const data = await response.json();
            const users = data.results || [];
            
            const usersList = document.getElementById('users-list');
            
            if (users.length === 0) {
                usersList.innerHTML = '<p class="text-muted">No users found</p>';
                return;
            }
            
            let html = '<table class="table table-striped"><thead><tr><th>Username</th><th>Email</th><th>Role</th><th>Organization</th><th>Status</th><th>Actions</th></tr></thead><tbody>';
            
            users.forEach(user => {
                html += `
                    <tr>
                        <td>${user.username}</td>
                        <td>${user.email}</td>
                        <td>${user.role.name}</td>
                        <td>${user.organization || '-'}</td>
                        <td><span class="badge ${user.is_active_user ? 'bg-success' : 'bg-danger'}">${user.is_active_user ? 'Active' : 'Inactive'}</span></td>
                        <td>
                            <button class="btn btn-sm btn-info" onclick="editUser('${user.id}')">Edit</button>
                            <button class="btn btn-sm btn-danger" onclick="deactivateUser('${user.id}')">Deactivate</button>
                        </td>
                    </tr>
                `;
            });
            
            html += '</tbody></table>';
            usersList.innerHTML = html;
        }
    } catch (error) {
        console.error('Error loading users:', error);
    }
}

// Load Admin Categories
async function loadAdminCategories() {
    try {
        const response = await fetchAPI('/content/categories/', 'GET');
        
        if (response.ok) {
            const data = await response.json();
            const categories = data.results || [];
            
            const categoriesList = document.getElementById('categories-list');
            
            if (categories.length === 0) {
                categoriesList.innerHTML = '<p class="text-muted">No categories found</p>';
                return;
            }
            
            let html = '';
            
            categories.forEach(cat => {
                html += `
                    <div class="card mb-2">
                        <div class="card-body">
                            <div class="row align-items-center">
                                <div class="col-md-8">
                                    <h6>${cat.name}</h6>
                                    <p class="text-muted small">${cat.description || 'No description'}</p>
                                </div>
                                <div class="col-md-4 text-end">
                                    <button class="btn btn-sm btn-warning" onclick="editCategory('${cat.id}')">Edit</button>
                                    <button class="btn btn-sm btn-danger" onclick="deleteCategory('${cat.id}')">Delete</button>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            });
            
            categoriesList.innerHTML = html;
        }
    } catch (error) {
        console.error('Error loading categories:', error);
    }
}

// Load All Content (Admin)
async function loadAllContent() {
    try {
        const response = await fetchAPI('/content/all/', 'GET');
        
        if (response.ok) {
            const data = await response.json();
            const contents = data.results || [];
            
            const contentList = document.getElementById('all-content-list');
            
            if (contents.length === 0) {
                contentList.innerHTML = '<p class="text-muted">No content found</p>';
                return;
            }
            
            let html = '<table class="table table-striped"><thead><tr><th>Title</th><th>Creator</th><th>Status</th><th>Created</th><th>Actions</th></tr></thead><tbody>';
            
            contents.forEach(content => {
                html += `
                    <tr>
                        <td>${content.title}</td>
                        <td>${content.created_by_username}</td>
                        <td><span class="badge bg-${getStatusColor(content.status)}">${content.status.toUpperCase()}</span></td>
                        <td>${new Date(content.created_at).toLocaleDateString()}</td>
                        <td>
                            <button class="btn btn-sm btn-info" onclick="viewContent('${content.id}')">View</button>
                            <button class="btn btn-sm btn-danger" onclick="deleteContent('${content.id}')">Delete</button>
                        </td>
                    </tr>
                `;
            });
            
            html += '</tbody></table>';
            contentList.innerHTML = html;
        }
    } catch (error) {
        console.error('Error loading all content:', error);
    }
}

// Handle Profile Update
async function handleProfileUpdate(e) {
    e.preventDefault();
    
    const firstName = document.getElementById('profile-first-name').value;
    const lastName = document.getElementById('profile-last-name').value;
    const organization = document.getElementById('profile-organization').value;
    const phone = document.getElementById('profile-phone').value;
    const currentPassword = document.getElementById('current-password').value;
    const newPassword = document.getElementById('new-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    
    // Prepare update data
    const updateData = {
        first_name: firstName,
        last_name: lastName,
        organization: organization,
        phone_number: phone
    };
    
    // Validate and add password change if provided
    if (newPassword || confirmPassword || currentPassword) {
        if (!currentPassword) {
            showAlert('Current password is required to change password', 'danger');
            return;
        }
        
        if (!newPassword || !confirmPassword) {
            showAlert('New password and confirmation are required', 'danger');
            return;
        }
        
        if (newPassword !== confirmPassword) {
            showAlert('Passwords do not match', 'danger');
            return;
        }
        
        updateData.old_password = currentPassword;
        updateData.new_password = newPassword;
    }
    
    try {
        const response = await fetchAPI('/auth/profile/update/', 'PUT', updateData);
        
        if (response.ok) {
            showAlert('Profile updated successfully!', 'success');
            
            // Clear password fields
            document.getElementById('current-password').value = '';
            document.getElementById('new-password').value = '';
            document.getElementById('confirm-password').value = '';
            
            // Reload user data
            loadUserData();
        } else {
            const error = await response.json();
            showAlert(error.detail || 'Error updating profile', 'danger');
        }
    } catch (error) {
        console.error('Error updating profile:', error);
        showAlert('Error updating profile', 'danger');
    }
}

// Handle Tab Changes
function handleTabChange(tabId) {
    const pageTitle = document.getElementById('page-title');
    
    const titles = {
        'dashboard': 'Dashboard',
        'content': 'My Content',
        'approvals': 'Content Approvals',
        'admin': 'Administration',
        'profile': 'My Profile'
    };
    
    pageTitle.textContent = titles[tabId] || 'Dashboard';
    
    // Load data for specific tabs
    if (tabId === 'approvals') {
        loadPendingApprovals();
    } else if (tabId === 'admin') {
        loadAdminDashboard();
    }
}

// Utility Functions

async function fetchAPI(endpoint, method = 'GET', body = null) {
    const options = {
        method: method,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem(STORAGE_KEY)}`,
            'X-CSRFToken': getCookie('csrftoken')
        }
    };
    
    if (body) {
        options.body = JSON.stringify(body);
    }
    
    return fetch(`${API_BASE_URL}${endpoint}`, options);
}

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

function isAuthenticated() {
    return localStorage.getItem(STORAGE_KEY) !== null;
}

function logout() {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem('remember_me');
    localStorage.removeItem('remembered_username');
    window.location.href = '/login';
}

function handleLogout(e) {
    e.preventDefault();
    logout();
}

function logout() {
    // Clear all stored data
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_role');
    localStorage.removeItem('current_user');
    localStorage.removeItem('remember_me');
    localStorage.removeItem('remembered_username');

    window.location.href = 'login.html';
}

function showAlert(message, type = 'info') {
    // Create alert element
    const alert = document.createElement('div');
    alert.className = `alert alert-${type} alert-dismissible fade show`;
    alert.setAttribute('role', 'alert');
    alert.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    // Add to page
    const container = document.querySelector('.tab-content');
    container.insertBefore(alert, container.firstChild);
    
    // Auto-dismiss after 5 seconds
    setTimeout(() => {
        alert.remove();
    }, 5000);
}

function getStatusColor(status) {
    const colors = {
        'draft': 'secondary',
        'pending': 'warning',
        'approved': 'success',
        'rejected': 'danger',
        'published': 'primary',
        'archived': 'dark'
    };
    return colors[status] || 'secondary';
}

function debounce(func, wait) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

// Placeholder functions for actions
function viewContent(contentId) {
    console.log('Viewing content:', contentId);
}

function editContent(contentId) {
    console.log('Editing content:', contentId);
}

function submitContent(contentId) {
    console.log('Submitting content:', contentId);
}

function reviewContent(contentId) {
    console.log('Reviewing content:', contentId);
}

function editUser(userId) {
    console.log('Editing user:', userId);
}

function deactivateUser(userId) {
    console.log('Deactivating user:', userId);
}

function editCategory(categoryId) {
    console.log('Editing category:', categoryId);
}

function deleteCategory(categoryId) {
    console.log('Deleting category:', categoryId);
}

function deleteContent(contentId) {
    console.log('Deleting content:', contentId);
}
