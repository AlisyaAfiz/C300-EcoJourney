// Assuming you have a form with id="addUserForm" and button id="addUserBtn"
// Add this script to your HTML or a separate JS file

document.getElementById('addUserBtn').addEventListener('click', async (e) => {
    e.preventDefault();
    
    const formData = new FormData(document.getElementById('addUserForm'));
    const userData = {
        username: formData.get('username'),
        email: formData.get('email'),
        password: formData.get('password'),
        firstName: formData.get('firstName'),
        lastName: formData.get('lastName'),
        role: formData.get('role'),
        phone: formData.get('phone'),
        organization: formData.get('organization')
    };

    try {
        const response = await fetch('/api/users', {  // Adjust URL if needed, e.g., full API_URL
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`  // Assuming JWT token is stored
            },
            body: JSON.stringify(userData)
        });

        if (response.ok) {
            const result = await response.json();
            alert('User created successfully!');
            // Optionally, refresh the user list or redirect
        } else {
            const error = await response.json();
            alert('Error: ' + error.error);
        }
    } catch (err) {
        console.error('Error creating user:', err);
        alert('An error occurred while creating the user.');
    }
});