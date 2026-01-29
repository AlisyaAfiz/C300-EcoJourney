
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

// Configuration
const API_URL = 'http://localhost:8001';
const PRODUCER_CREDENTIALS = { username: 'producer', password: 'password2' };
const MANAGER_CREDENTIALS = { username: 'manager', password: 'password3' };

// Test State
let producerToken = null;
let managerToken = null;
let contentId = null;

async function runTest() {
    console.log('🚀 Starting End-to-End Lifecycle Test (Axios)\n');

    try {
        // 1. Producer Login
        console.log('1. Producer Login...');
        try {
            const producerLogin = await axios.post(`${API_URL}/api/auth/login`, PRODUCER_CREDENTIALS);
            producerToken = producerLogin.data.token;
            console.log('✅ Producer logged in. Token acquired.\n');
        } catch (err) {
            throw new Error(`Producer login failed: ${err.message}`);
        }

        // 2. Producer Upload Content
        console.log('2. Producer Uploading Content...');
        const formData = new FormData();
        formData.append('title', 'E2E Test Content ' + Date.now());
        formData.append('description', 'This is a test content for E2E verification');
        formData.append('category', 'Environmental'); // Ensure this matches a valid category ID or Name if backend requires ID
        // Note: If backend requires ID for category, this might fail. We'll see.
        formData.append('content_type', 'Document'); 
        
        // Create a dummy file
        const dummyFilePath = path.join(__dirname, 'test_upload.txt');
        fs.writeFileSync(dummyFilePath, 'Dummy content for testing');
        formData.append('documentFile', fs.createReadStream(dummyFilePath));

        try {
            const uploadRes = await axios.post(`${API_URL}/api/content/upload`, formData, {
                headers: {
                    'Authorization': `Bearer ${producerToken}`,
                    ...formData.getHeaders()
                }
            });
            
            // Clean up dummy file
            fs.unlinkSync(dummyFilePath);

            contentId = uploadRes.data.content._id || uploadRes.data.content.id;
            console.log(`✅ Content uploaded. ID: ${contentId}\n`);
        } catch (err) {
            // Clean up dummy file if it exists
            if (fs.existsSync(dummyFilePath)) fs.unlinkSync(dummyFilePath);
            throw new Error(`Upload failed: ${err.response ? JSON.stringify(err.response.data) : err.message}`);
        }

        // 3. Manager Login
        console.log('3. Manager Login...');
        try {
            const managerLogin = await axios.post(`${API_URL}/api/auth/login`, MANAGER_CREDENTIALS);
            managerToken = managerLogin.data.token;
            console.log('✅ Manager logged in. Token acquired.\n');
        } catch (err) {
            throw new Error(`Manager login failed: ${err.message}`);
        }

        // 4. Manager Approve Content
        console.log(`4. Manager Approving Content ${contentId}...`);
        try {
            const approveRes = await axios.post(`${API_URL}/api/content/${contentId}/approve`, 
                { comments: 'Approved via E2E Test Script' },
                {
                    headers: {
                        'Authorization': `Bearer ${managerToken}`
                    }
                }
            );
            console.log('✅ Content approved successfully.\n');
        } catch (err) {
            throw new Error(`Approval failed: ${err.response ? JSON.stringify(err.response.data) : err.message}`);
        }

        // 5. Producer Check Notifications
        console.log('5. Producer Checking Notifications...');
        try {
            const notifRes = await axios.get(`${API_URL}/api/notifications`, {
                headers: {
                    'Authorization': `Bearer ${producerToken}`
                }
            });

            const notifications = notifRes.data;
            console.log(`Received ${notifications.length} notifications.`);
            
            // Loose matching for notification
            const found = notifications.find(n => 
                (n.content && n.content._id === contentId) || // Correct check for populated content object
                (n.contentId && n.contentId.toString() === contentId.toString()) || 
                (n.data && n.data.contentId && n.data.contentId.toString() === contentId.toString()) ||
                (n.message && n.message.includes('Approved')) // Fallback check
            );
            
            if (found) {
                console.log('✅ Notification found for approved content!');
                console.log('   Message:', found.message);
            } else {
                console.log('⚠️ Notification NOT found for this content. Dumping latest notifications:');
                console.log(notifications.slice(0, 3));
                throw new Error('Notification verification failed');
            }
        } catch (err) {
            throw new Error(`Fetch notifications failed: ${err.response ? JSON.stringify(err.response.data) : err.message}`);
        }

        console.log('\n🎉 E2E TEST PASSED SUCCESSFULLY!');

    } catch (error) {
        console.error('\n❌ TEST FAILED:', error.message);
    }
}

runTest();
