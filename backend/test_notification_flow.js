
const axios = require('axios');
const crypto = require('crypto');

const API_URL = 'http://localhost:8001';
let authToken = '';
let userId = '';
let notificationIds = [];

// Helper to generate random hex string (for dummy ObjectIds)
const randomObjectId = () => crypto.randomBytes(12).toString('hex');

// Helper for logging
const log = (step, msg, success = true) => {
    const icon = success ? '✅' : '❌';
    console.log(`${icon} [${step}] ${msg}`);
    if (!success) process.exit(1);
};

async function runTests() {
    console.log('🚀 Starting Notification System Tests...\n');

    // 1. Register Test User
    try {
        const uniqueSuffix = Date.now().toString().slice(-4);
        const userData = {
            username: `notif_test_${uniqueSuffix}`,
            email: `test${uniqueSuffix}@example.com`,
            password: 'password123',
            firstName: 'Test',
            lastName: 'User'
        };

        const res = await axios.post(`${API_URL}/api/auth/register`, userData);
        if (res.status === 201) {
            authToken = res.data.token;
            userId = res.data.user.id || res.data.user._id;
            log('Register', `User registered: ${userData.username}`);
        }
    } catch (error) {
        const errorMsg = error.response?.data?.error || error.response?.data?.message || error.message;
        log('Register', `Failed: ${errorMsg}`, false);
    }

    // 2. Create Notifications (Directly via API)
    try {
        const notificationsToCreate = [
            {
                recipientId: userId,
                contentId: randomObjectId(),
                contentTitle: 'Test Content 1',
                type: 'approved',
                message: 'Your content has been approved!',
                approverName: 'Admin',
                approverComments: 'Great work!'
            },
            {
                recipientId: userId,
                contentId: randomObjectId(),
                contentTitle: 'Test Content 2',
                type: 'rejected',
                message: 'Your content was rejected.',
                approverName: 'Manager',
                approverComments: 'Please fix typos.'
            },
            {
                recipientId: userId,
                contentId: randomObjectId(),
                contentTitle: 'System Update',
                type: 'pending', // using 'pending' as a proxy for info/system msg if needed, or just standard type
                message: 'System maintenance scheduled.'
            }
        ];

        for (const n of notificationsToCreate) {
            const res = await axios.post(`${API_URL}/api/notifications`, n);
            notificationIds.push(res.data._id);
        }
        log('Create', `Created ${notificationIds.length} notifications`);
    } catch (error) {
        log('Create', `Failed: ${error.response?.data?.message || error.message}`, false);
    }

    // 3. Fetch Notifications
    try {
        const res = await axios.get(`${API_URL}/api/notifications`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });
        
        if (res.data.length === 3) {
            log('Fetch', `Successfully retrieved 3 notifications`);
            
            // Verify content
            const approved = res.data.find(n => n.type === 'approved');
            if (approved && approved.message.includes('approved')) {
                log('Verify', 'Content verification passed');
            } else {
                log('Verify', 'Content verification failed', false);
            }
        } else {
            log('Fetch', `Expected 3 notifications, got ${res.data.length}`, false);
        }
    } catch (error) {
        log('Fetch', `Failed: ${error.message}`, false);
    }

    // 4. Mark as Read
    try {
        const targetId = notificationIds[0];
        const res = await axios.patch(`${API_URL}/api/notifications/${targetId}/read`, {}, {
            headers: { Authorization: `Bearer ${authToken}` }
        });
        
        if (res.data.read === true) {
            log('MarkRead', `Notification ${targetId} marked as read`);
        } else {
            log('MarkRead', 'Response did not indicate read status', false);
        }

        // Verify Unread Count
        const countRes = await axios.get(`${API_URL}/api/notifications/count/unread`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });
        if (countRes.data.unreadCount === 2) {
            log('UnreadCount', 'Unread count is correctly 2');
        } else {
            log('UnreadCount', `Expected 2 unread, got ${countRes.data.unreadCount}`, false);
        }

    } catch (error) {
        log('MarkRead', `Failed: ${error.message}`, false);
    }

    // 5. Delete Notification
    try {
        const targetId = notificationIds[1];
        await axios.delete(`${API_URL}/api/notifications/${targetId}`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });
        log('Delete', `Notification ${targetId} deleted`);

        // Verify list length
        const res = await axios.get(`${API_URL}/api/notifications`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });
        if (res.data.length === 2) {
            log('VerifyDelete', 'Notification list length is now 2');
        } else {
            log('VerifyDelete', `Expected 2 notifications, got ${res.data.length}`, false);
        }

    } catch (error) {
        log('Delete', `Failed: ${error.message}`, false);
    }

    console.log('\n✨ All tests completed successfully!');
}

runTests();
