const axios = require('axios');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');

const API_URL = 'http://localhost:8001/api';

const users = {
    manager: { email: 'manager@example.com', password: 'password3' },
    producer: { email: 'producer@example.com', password: 'password2' }
};

let managerToken = '';
let producerToken = '';
let contentIdToApprove = '';
let contentIdToReject = '';

async function login(role) {
    try {
        console.log(`Logging in as ${role}...`);
        const response = await axios.post(`${API_URL}/auth/login`, {
            email: users[role].email,
            password: users[role].password
        });
        console.log(`${role} login success! Token received.`);
        return response.data.token;
    } catch (error) {
        console.error(`${role} login failed:`, error.response ? error.response.data : error.message);
        process.exit(1);
    }
}

async function createContent(token, title) {
    try {
        console.log(`Creating content "${title}"...`);
        // We need to simulate form-data upload
        // Since we don't have real files easily, we'll try to use a dummy buffer or just metadata if allowed.
        // Looking at content.js, it expects req.files['mediaFile'] and req.files['documentFile'].
        // However, usually fields are enough if files are optional?
        // Let's check content.js upload endpoint again.
        // It says upload.fields(...).
        // If we don't provide files, it might fail or just work with metadata.
        // Let's try sending just fields first. 
        // If it fails, we will need to create dummy files.
        
        const form = new FormData();
        form.append('title', title);
        form.append('description', 'Test Description');
        form.append('category', 'Environment');
        form.append('type', 'Article');
        
        // Add dummy file to satisfy multer if needed
        // form.append('mediaFile', Buffer.from('dummy'), { filename: 'test.jpg' });

        const response = await axios.post(`${API_URL}/content/upload`, form, {
            headers: {
                ...form.getHeaders(),
                'Authorization': `Bearer ${token}`
            }
        });
        console.log(`Content "${title}" created! ID: ${response.data.content._id}`);
        return response.data.content._id;
    } catch (error) {
        console.error(`Create content failed:`, error.response ? error.response.data : error.message);
        // If it failed, maybe because of missing files? 
        // Let's assume for now we can create content.
        process.exit(1);
    }
}

async function approveContent(token, contentId) {
    try {
        console.log(`Approving content ${contentId}...`);
        const response = await axios.post(`${API_URL}/content/${contentId}/approve`, {
            comments: 'Great work!'
        }, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        console.log(`Content approved! Status: ${response.status}`);
    } catch (error) {
        console.error(`Approval failed:`, error.response ? error.response.data : error.message);
        process.exit(1);
    }
}

async function rejectContent(token, contentId) {
    try {
        console.log(`Rejecting content ${contentId}...`);
        const response = await axios.post(`${API_URL}/content/${contentId}/reject`, {
            comments: 'Needs improvement.'
        }, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        console.log(`Content rejected! Status: ${response.status}`);
    } catch (error) {
        console.error(`Rejection failed:`, error.response ? error.response.data : error.message);
        process.exit(1);
    }
}

async function checkNotifications(token) {
    try {
        console.log(`Checking notifications for Producer...`);
        const response = await axios.get(`${API_URL}/notifications`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        console.log(`Notifications found: ${response.data.length}`);
        response.data.forEach(n => {
            console.log(`- [${n.type}] ${n.contentTitle}: ${n.message}`);
        });
        return response.data;
    } catch (error) {
        console.error(`Check notifications failed:`, error.response ? error.response.data : error.message);
        process.exit(1);
    }
}

async function run() {
    // 1. Login
    managerToken = await login('manager');
    producerToken = await login('producer');

    // 2. Create Content (Producer)
    // We need to handle file upload requirements.
    // If upload fails due to missing files, we might need to mock files.
    // For now, let's try to see if we can create without files or mock them simply.
    // To be safe, I will create a temporary dummy file.
    fs.writeFileSync('dummy.txt', 'test content');
    
    const form1 = new FormData();
    form1.append('title', 'Test Content 1 (To Approve)');
    form1.append('description', 'Description 1');
    form1.append('category', 'Environment');
    form1.append('type', 'Article');
    form1.append('documentFile', fs.createReadStream('dummy.txt'));

    try {
         const res1 = await axios.post(`${API_URL}/content/upload`, form1, {
            headers: { ...form1.getHeaders(), 'Authorization': `Bearer ${producerToken}` }
        });
        contentIdToApprove = res1.data.content._id;
        console.log(`Created content 1: ${contentIdToApprove}`);
    } catch (e) {
        console.error("Failed to upload content 1", e.response ? e.response.data : e.message);
        process.exit(1);
    }

    const form2 = new FormData();
    form2.append('title', 'Test Content 2 (To Reject)');
    form2.append('description', 'Description 2');
    form2.append('category', 'Social');
    form2.append('type', 'Video');
    form2.append('documentFile', fs.createReadStream('dummy.txt'));

    try {
         const res2 = await axios.post(`${API_URL}/content/upload`, form2, {
            headers: { ...form2.getHeaders(), 'Authorization': `Bearer ${producerToken}` }
        });
        contentIdToReject = res2.data.content._id;
        console.log(`Created content 2: ${contentIdToReject}`);
    } catch (e) {
        console.error("Failed to upload content 2", e.response ? e.response.data : e.message);
        process.exit(1);
    }

    // 3. Approve Content 1 (Manager)
    await approveContent(managerToken, contentIdToApprove);

    // 4. Reject Content 2 (Manager)
    await rejectContent(managerToken, contentIdToReject);

    // 5. Check Notifications (Producer)
    const notifications = await checkNotifications(producerToken);
    
    // Cleanup
    fs.unlinkSync('dummy.txt');

    if (notifications.length >= 2) {
        console.log('SUCCESS: Full flow verified!');
    } else {
        console.log('WARNING: Expected at least 2 notifications.');
    }
}

run();
