// auth.js
const bcrypt = require('bcrypt');
const saltRounds = 10;

async function hashPassword(password) {
    try {
        const salt = await bcrypt.genSalt(saltRounds);
        const hash = await bcrypt.hash(password, salt);
        return hash;
    } catch (error) {
        throw new Error('Error hashing password');
    }
}

async function comparePassword(password, hash) {
    try {
        const match = await bcrypt.compare(password, hash);
        return match;
    } catch (error) {
        throw new Error('Error comparing passwords');
    }
}

module.exports = { hashPassword, comparePassword };

// Connect to server endpoints
const paymentAPI = {
    initializePaystack: async (email, amount, metadata) => {
        const response = await fetch(`${API_BASE_URL}/payment/paystack/initialize`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ email, amount, metadata })
        });
        return response.json();
    },
    
    initializeStripe: async (amount, metadata) => {
        const response = await fetch(`${API_BASE_URL}/payment/stripe/initialize`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ amount, metadata })
        });
        return response.json();
    }
};
