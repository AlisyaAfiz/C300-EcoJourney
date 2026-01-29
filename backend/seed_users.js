const mongoose = require('mongoose');
const User = require('./models/User');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ecojourney';

mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(async () => {
    console.log('Connected to MongoDB');
    
    const users = [
        {
            username: 'admin',
            email: 'admin@example.com',
            password: 'password1',
            role: 'admin',
            firstName: 'System',
            lastName: 'Admin'
        },
        {
            username: 'producer',
            email: 'producer@example.com',
            password: 'password2',
            role: 'content_producer',
            firstName: 'Content',
            lastName: 'Producer'
        },
        {
            username: 'manager',
            email: 'manager@example.com',
            password: 'password3',
            role: 'content_manager',
            firstName: 'Content',
            lastName: 'Manager'
        }
    ];

    for (const u of users) {
        try {
            let user = await User.findOne({ $or: [{ username: u.username }, { email: u.email }] });
            
            if (user) {
                console.log(`User ${u.username} exists. Updating...`);
                user.password = u.password; // Triggers hash
                user.role = u.role;
                user.email = u.email;
                user.firstName = u.firstName;
                user.lastName = u.lastName;
                // Reset lock
                user.isLocked = false;
                user.loginAttempts = 0;
            } else {
                console.log(`Creating user ${u.username}...`);
                user = new User(u);
            }
            
            await user.save();
            console.log(`User ${u.username} saved.`);
        } catch (err) {
            console.error(`Error processing ${u.username}:`, err.message);
        }
    }

    console.log('Seeding completed.');
    process.exit(0);
}).catch(err => {
    console.error('Connection error:', err);
    process.exit(1);
});
