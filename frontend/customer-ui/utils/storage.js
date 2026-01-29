// Static user database (simulating backend)
const USERS_DB = [
    { id: 1, name: 'John Doe', email: 'john@example.com', password: 'password123' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com', password: 'password123' },
    { id: 3, name: 'Demo User', email: 'demo@valerix.com', password: 'demo' },
];

// Get registered users from localStorage
function getRegisteredUsers() {
    const stored = localStorage.getItem('valerix_registered_users');
    return stored ? JSON.parse(stored) : [...USERS_DB];
}

// Save registered users to localStorage
function saveRegisteredUsers(users) {
    localStorage.setItem('valerix_registered_users', JSON.stringify(users));
}

// Validate email format
function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
