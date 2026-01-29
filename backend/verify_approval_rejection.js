const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

const API_URL = 'http://localhost:8001';

// Colors for console output
const colors = {
    reset: "\x1b[0m",
    bright: "\x1b[1m",
    green: "\x1b[32m",
    red: "\x1b[31m",
    yellow: "\x1b[33m",
    blue: "\x1b[34m",
    cyan: "\x1b[36m"
};

async function runTest() {
    console.log(`${colors.bright}🚀 Starting End-to-End Approval & Rejection Test${colors.reset}`);

    try {
        // --- PREPARATION ---
        const producerAuth = await login('producer', 'password2');
        const managerAuth = await login('manager', 'password3');

        // --- SCENARIO 1: APPROVAL FLOW ---
        console.log(`\n${colors.cyan}--- SCENARIO 1: APPROVAL FLOW ---${colors.reset}`);
        
        // 1. Upload Content A
        const contentA = await uploadContent(producerAuth.token, 'Content for Approval');
        console.log(`   📝 Uploaded Content A: ${contentA._id}`);

        // 2. Approve Content A
        await approveContent(managerAuth.token, contentA._id);
        console.log(`   ✅ Approved Content A`);

        // --- SCENARIO 2: REJECTION FLOW ---
        console.log(`\n${colors.cyan}--- SCENARIO 2: REJECTION FLOW ---${colors.reset}`);

        // 3. Upload Content B
        const contentB = await uploadContent(producerAuth.token, 'Content for Rejection');
        console.log(`   📝 Uploaded Content B: ${contentB._id}`);

        // 4. Reject Content B
        await rejectContent(managerAuth.token, contentB._id);
        console.log(`   ❌ Rejected Content B`);

        // --- VERIFICATION ---
        console.log(`\n${colors.cyan}--- VERIFICATION (Producer Notifications) ---${colors.reset}`);

        // 5. Check Notifications
        const notifications = await getNotifications(producerAuth.token);
        
        const notifA = notifications.find(n => (n.content._id === contentA._id || n.content === contentA._id));
        const notifB = notifications.find(n => (n.content._id === contentB._id || n.content === contentB._id));

        // Verify A (Approved)
        if (notifA && notifA.type === 'approved') {
            console.log(`${colors.green}   [PASS] Content A Notification: APPROVED${colors.reset}`);
        } else {
            console.error(`${colors.red}   [FAIL] Content A Notification: Expected 'approved', found ${notifA ? notifA.type : 'NONE'}${colors.reset}`);
        }

        // Verify B (Rejected)
        if (notifB && notifB.type === 'rejected') {
            console.log(`${colors.green}   [PASS] Content B Notification: REJECTED${colors.reset}`);
        } else {
            console.error(`${colors.red}   [FAIL] Content B Notification: Expected 'rejected', found ${notifB ? notifB.type : 'NONE'}${colors.reset}`);
        }

        console.log(`\n${colors.bright}🏁 Test Suite Completed${colors.reset}`);

    } catch (error) {
        console.error(`${colors.red}💥 Test Suite Failed:${colors.reset}`, error.message);
        if (error.response) {
            console.error('Response Status:', error.response.status);
            console.error('Response Data:', error.response.data);
        }
    }
}

// --- HELPER FUNCTIONS ---

async function login(username, password) {
    try {
        const res = await axios.post(`${API_URL}/api/auth/login`, { username, password });
        return res.data;
    } catch (error) {
        throw new Error(`Login failed for ${username}: ${error.message}`);
    }
}

async function uploadContent(token, titleSuffix) {
    const tempFile = `temp_${Date.now()}.txt`;
    fs.writeFileSync(tempFile, 'Dummy content');

    const form = new FormData();
    form.append('title', `Test ${titleSuffix} ${Date.now()}`);
    form.append('description', 'Automated test content');
    form.append('category', 'Technology');
    form.append('type', 'Document');
    form.append('documentFile', fs.createReadStream(tempFile));

    try {
        const res = await axios.post(`${API_URL}/api/content/upload`, form, {
            headers: {
                ...form.getHeaders(),
                'Authorization': `Bearer ${token}`
            }
        });
        fs.unlinkSync(tempFile);
        return res.data.content;
    } catch (error) {
        if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
        throw error;
    }
}

async function approveContent(token, contentId) {
    await axios.post(`${API_URL}/api/content/${contentId}/approve`, 
        { comments: 'Approved by automation' },
        { headers: { 'Authorization': `Bearer ${token}` } }
    );
}

async function rejectContent(token, contentId) {
    await axios.post(`${API_URL}/api/content/${contentId}/reject`, 
        { comments: 'Rejected by automation' },
        { headers: { 'Authorization': `Bearer ${token}` } }
    );
}

async function getNotifications(token) {
    const res = await axios.get(`${API_URL}/api/notifications`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    return res.data;
}

runTest();
