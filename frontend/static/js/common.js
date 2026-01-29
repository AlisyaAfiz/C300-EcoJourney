// EcoJourney CMS - Common JavaScript
// API Configuration
const API_URL = 'https://rpecocjourney-backend.onrender.com';
const STORAGE_KEY = 'auth_token';

// Global Variables
let allContentData = [];
let currentViewingContentId = null;
let pendingDeleteId = null;
let currentReviewingContent = null;

// Auth Check - Redirect to login if not authenticated
function checkAuth() {
    const currentUser = localStorage.getItem('current_user');
    if (!currentUser) {
        window.location.href = 'login.html';
        return false;
    }
    return true;
}

// Role-based Navigation Permissions
const ROLE_PERMISSIONS = {
    admin: [
        { id: 'dashboard', label: 'Dashboard', icon: 'fa-chart-line', page: 'index.html' },
        { id: 'admin', label: 'Administration', icon: 'fa-cog', page: 'admin.html' },
        { id: 'profile', label: 'Profile', icon: 'fa-user', page: 'profile.html' }
    ],
    manager: [
        { id: 'dashboard', label: 'Dashboard', icon: 'fa-chart-line', page: 'index.html' },
        { id: 'approvals', label: 'Approvals', icon: 'fa-check-circle', page: 'manager.html' },
        { id: 'profile', label: 'Profile', icon: 'fa-user', page: 'profile.html' }
    ],
    producer: [
        { id: 'dashboard', label: 'Dashboard', icon: 'fa-chart-line', page: 'index.html' },
        { id: 'content', label: 'My Content', icon: 'fa-file-upload', page: 'producer.html' },
        { id: 'profile', label: 'Profile', icon: 'fa-user', page: 'profile.html' }
    ]
};

// Render Sidebar
function renderSidebar(activePage) {
    console.log('[Sidebar] Applying role-based visibility...');
    const role = localStorage.getItem('user_role') || 'producer';
    console.log('[Sidebar] User role:', role);
    
    // Show/hide nav items based on role
    const navContent = document.getElementById('nav-content');
    const navNotifications = document.getElementById('nav-notifications');
    const navApprovals = document.getElementById('nav-approvals');
    const navAdmin = document.getElementById('nav-admin');
    
    // Hide all first
    if (navContent) navContent.style.display = 'none';
    if (navNotifications) navNotifications.style.display = 'none';
    if (navApprovals) navApprovals.style.display = 'none';
    if (navAdmin) navAdmin.style.display = 'none';
    
    // Show based on role
    if (role === 'producer') {
        if (navContent) {
            navContent.style.display = '';  // Show with default display
            console.log('[Sidebar] Showing My Content for producer');
        }
        if (navNotifications) {
            navNotifications.style.display = '';  // Show with default display
            console.log('[Sidebar] Showing Notifications for producer');
        }
    } else if (role === 'manager') {
        if (navApprovals) {
            navApprovals.style.display = '';  // Show with default display
            console.log('[Sidebar] Showing Approvals for manager');
        }
    } else if (role === 'admin') {
        if (navAdmin) {
            navAdmin.style.display = '';  // Show with default display
            console.log('[Sidebar] Showing Administration for admin');
        }
    }
    
    console.log('[Sidebar] ✓ Role-based visibility applied for role:', role);
}

// Update User Info in Topbar
function updateUserInfo() {
    console.log('[UserInfo] Updating user info...');
    const role = localStorage.getItem('user_role') || 'producer';
    console.log('[UserInfo] Role:', role);
    
    const roleDisplayNames = {
        admin: 'Administrator',
        producer: 'Content Producer',
        manager: 'Content Manager'
    };
    
    const userNames = {
        admin: { fullName: 'Tom Smith', initials: 'TS' },
        manager: { fullName: 'Jane Smith', initials: 'JS' },
        producer: { fullName: 'John Doe', initials: 'JD' }
    };
    
    const userData = userNames[role] || userNames.producer;
    const roleText = roleDisplayNames[role] || 'User';
    console.log('[UserInfo] User data:', userData, 'Role text:', roleText);
    
    // Update user name
    const userNameEls = document.querySelectorAll('.user-details h6');
    if (userNameEls && userNameEls.length > 0) {
        userNameEls.forEach(el => {
            el.textContent = userData.fullName;
        });
        console.log('[UserInfo] ✓ Updated user name to:', userData.fullName);
    } else {
        console.warn('[UserInfo] ⚠️ User name element not found');
    }
    
    // Update role
    const roleElements = document.getElementsByClassName('profile-role');
    console.log('[UserInfo] Found', roleElements.length, 'role elements');
    for (let i = 0; i < roleElements.length; i++) {
        roleElements[i].textContent = roleText;
    }
    
    // Update avatar - change to show initials (2 chars)
    const avatarElements = document.querySelectorAll('.user-avatar');
    console.log('[UserInfo] Found', avatarElements.length, 'avatar elements');
    avatarElements.forEach(el => {
        el.textContent = userData.initials;
    });
    
    console.log('[UserInfo] ✓ Update complete');
}

// Logout
function logout() {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem('user_role');
    localStorage.removeItem('current_user');
    localStorage.removeItem('remember_me');
    localStorage.removeItem('remembered_username');
    window.location.href = 'login.html';
}

// Popup Functions
function showSuccessPopup(message) {
    const popup = document.getElementById('successPopup');
    const messageEl = document.getElementById('successPopupMessage');
    if (popup && messageEl) {
        messageEl.textContent = message;
        popup.classList.add('show');
    }
}

function closeSuccessPopup() {
    const popup = document.getElementById('successPopup');
    if (popup) popup.classList.remove('show');
}

function showConfirmPopup(contentId) {
    pendingDeleteId = contentId;
    const popup = document.getElementById('confirmPopup');
    if (popup) popup.classList.add('show');
}

async function confirmDelete(confirmed) {
    const popup = document.getElementById('confirmPopup');
    if (popup) popup.classList.remove('show');
    
    if (confirmed && pendingDeleteId) {
        try {
            const response = await fetch(`${API_URL}/api/content/${pendingDeleteId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + localStorage.getItem(STORAGE_KEY)
                }
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Delete failed');
            }
            
            // Remove from global array
            allContentData = allContentData.filter(item => 
                item._id !== pendingDeleteId && item.id !== pendingDeleteId
            );
            
            showSuccessPopup('Content deleted successfully!');
            
            // Reload page to refresh data
            setTimeout(() => window.location.reload(), 1500);
            
        } catch (error) {
            console.error('Failed to delete content:', error);
            alert('Failed to delete content: ' + (error.message || error));
        }
    }
    
    pendingDeleteId = null;
}

// Formatting Functions
function formatToSGTime(isoString) {
    if (!isoString || isoString === 'undefined') return '-';
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return '-';
    
    const options = {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    };
    return date.toLocaleDateString('en-US', options);
}

function formatDateTime(isoString) {
    if (!isoString || isoString === 'undefined') return '-';
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return isoString;
    
    return date.toLocaleString('en-SG', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    });
}

function formatContentId(id) {
    if (!id) return '-';
    if (id.startsWith('default-')) return id.toUpperCase();
    if (id.length > 12) return 'CONTENT-' + id.substring(0, 8).toUpperCase();
    return id.toUpperCase();
}

function formatFileSize(bytes) {
    if (!bytes || bytes === 0) return '0 KB';
    if (typeof bytes === 'string' && (bytes.includes('KB') || bytes.includes('MB') || bytes.includes('GB'))) {
        return bytes;
    }
    
    const numBytes = typeof bytes === 'string' ? parseInt(bytes) : bytes;
    
    if (numBytes < 1024) {
        return numBytes + ' bytes';
    } else if (numBytes < 1024 * 1024) {
        return (numBytes / 1024).toFixed(1) + ' KB';
    } else if (numBytes < 1024 * 1024 * 1024) {
        return (numBytes / (1024 * 1024)).toFixed(1) + ' MB';
    } else {
        return (numBytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
    }
}

// Load Content from API
async function loadStoredContents() {
    console.log('[loadStoredContents] Starting API call to:', `${API_URL}/api/content/all`);
    try {
        const response = await fetch(`${API_URL}/api/content/all`, {
            method: 'GET',
            headers: { 
                'Content-Type': 'application/json'
            }
        });
        
        console.log('[loadStoredContents] Response received:', response.status, response.statusText);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('[loadStoredContents] Failed to fetch contents:', response.status, errorText);
            return [];
        }
        
        const data = await response.json();
        allContentData = data;
        window.EcoJourney.allContentData = data;
        console.log('[loadStoredContents] ✓ Successfully loaded', data.length, 'content items');
        console.log('[loadStoredContents] Sample item:', data[0]);
        return data;
        
    } catch (error) {
        console.error('[loadStoredContents] ERROR:', error.message);
        console.error('[loadStoredContents] Full error:', error);
        return [];
    }
}

// Refresh Dashboard Stats
function refreshDashboardStats() {
    try {
        const statTotal = document.getElementById('stat-total');
        const statApproved = document.getElementById('stat-approved');
        const statPending = document.getElementById('stat-pending');
        const statRejected = document.getElementById('stat-rejected');
        
        if (!statTotal || !statApproved || !statPending || !statRejected) {
            console.log('Stats elements not found on this page');
            return;
        }
        
        const data = window.EcoJourney?.allContentData || allContentData || [];
        console.log('Refreshing stats with', data.length, 'items');
        
        const totals = {
            total: data.length,
            approved: 0,
            pending: 0,
            rejected: 0
        };
        
        data.forEach(item => {
            const status = (item.status || 'Pending').toLowerCase();
            if (status.includes('approved') || status.includes('published')) {
                totals.approved++;
            } else if (status.includes('rejected')) {
                totals.rejected++;
            } else {
                totals.pending++;
            }
        });
        
        statTotal.textContent = totals.total;
        statApproved.textContent = totals.approved;
        statPending.textContent = totals.pending;
        statRejected.textContent = totals.rejected;
        
        console.log('Stats updated:', totals);
        
    } catch (e) {
        console.error('refreshDashboardStats error:', e);
    }
}

// Download Content
async function downloadContent(contentId) {
    if (!contentId) return;
    
    try {
        const downloadUrl = `${API_URL}/api/download/${contentId}`;
        window.open(downloadUrl, '_blank');
        showSuccessPopup('Download started!');
    } catch (error) {
        console.error('Download failed:', error);
        alert('Download failed: ' + error.message);
    }
}

// Preview Content (open content-detail page)
function previewContent(contentId) {
    if (!contentId) return;
    const previewUrl = `content-detail.html?id=${contentId}`;
    window.open(previewUrl, '_blank');
}

// Initialize Page
function initializePage(pageName) {
    console.log('[InitPage] Initializing page:', pageName);
    // Check auth
    if (!checkAuth()) return;
    
    // Update user info FIRST
    updateUserInfo();
    
    // Render sidebar with role-based visibility
    renderSidebar(pageName);
    
    // Attach logout handler
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            logout();
        });
    }
    
    console.log('[InitPage] ✓ Page initialization complete');
}

// Export functions for use in other scripts
window.EcoJourney = {
    API_URL,
    STORAGE_KEY,
    checkAuth,
    renderSidebar,
    updateUserInfo,
    logout,
    showSuccessPopup,
    closeSuccessPopup,
    showConfirmPopup,
    confirmDelete,
    formatToSGTime,
    formatDateTime,
    formatContentId,
    formatFileSize,
    loadStoredContents,
    refreshDashboardStats,
    downloadContent,
    previewContent,
    initializePage,
    allContentData,
    currentViewingContentId,
    pendingDeleteId,
    currentReviewingContent
};
