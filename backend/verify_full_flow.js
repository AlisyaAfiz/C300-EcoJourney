
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const API_URL = 'http://localhost:8001';

async function runTest() {
    console.log('🚀 Starting End-to-End Notification Test (Axios)...');

    try {
        // 1. Login as Producer
        console.log('\n1️⃣  Logging in as Producer...');
        const producerAuth = await login('producer', 'password2');
        if (!producerAuth) return;
        console.log('   ✅ Producer logged in.');

        // 2. Upload Content (Simulated)
        console.log('\n2️⃣  Uploading Test Content...');
        fs.writeFileSync('test_upload.txt', 'This is a test file content');
        
        const form = new FormData();
        form.append('title', 'Test Notification Content ' + Date.now());
        form.append('description', 'Testing notification system');
        form.append('category', 'Technology');
        form.append('type', 'Document');
        form.append('documentFile', fs.createReadStream('test_upload.txt'));

        const uploadRes = await axios.post(`${API_URL}/api/content/upload`, form, {
            headers: {
                ...form.getHeaders()
            }
        });
        
        console.log('   ✅ Content uploaded. ID:', uploadRes.data.content._id);
        const contentId = uploadRes.data.content._id;

        // Clean up dummy file
        fs.unlinkSync('test_upload.txt');

        // 3. Login as Manager
        console.log('\n3️⃣  Logging in as Manager...');
        const managerAuth = await login('manager', 'password3');
        if (!managerAuth) return;
        console.log('   ✅ Manager logged in.');

        // 4. Approve Content
        console.log('\n4️⃣  Approving Content...');
        await axios.post(`${API_URL}/api/content/${contentId}/approve`, 
            { comments: 'Looks good! Approved via Test Script.' },
            {
                headers: {
                    'Authorization': `Bearer ${managerAuth.token}`
                }
            }
        );
        console.log('   ✅ Content approved.');

        // 5. Check Notification as Producer
        console.log('\n5️⃣  Checking Notifications for Producer...');
        const notifRes = await axios.get(`${API_URL}/api/notifications`, {
            headers: {
                'Authorization': `Bearer ${producerAuth.token}`
            }
        });
        
        const notifications = notifRes.data;
        const targetNotif = notifications.find(n => n.content && (n.content._id === contentId || n.content === contentId));
        
        if (targetNotif) {
            console.log('   ✅ Notification FOUND!');
            console.log('      - Message:', targetNotif.message);
            console.log('      - Type:', targetNotif.type);
            console.log('      - Comments:', targetNotif.approverComments);
        } else {
            console.error('   ❌ Notification NOT found for content ID:', contentId);
            console.log('      Total notifications:', notifications.length);
        }

        console.log('\n✅ Test Completed Successfully.');

    } catch (error) {
        console.error('❌ Test Failed:', error.response ? error.response.data : error.message);
    }
}

async function login(username, password) {
    try {
        const res = await axios.post(`${API_URL}/api/auth/login`, { username, password });
        return res.data;
    } catch (error) {
        console.error(`   ❌ Login failed for ${username}:`, error.response ? error.response.data : error.message);
        throw error;
    }
}

runTest();
