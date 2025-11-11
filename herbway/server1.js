const express = require('express');
const mysql = require('mysql2');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const https = require('https');
const fetch = require('node-fetch');

// Import your routes
const authRoutes = require('./routes/auth');
const paymentRoutes = require('./routes/payment');
const productRoutes = require('./routes/products');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MySQL connection
const db = mysql.createConnection({
    host: 'localhost',
    user: 'your_username',
    password: 'your_password',
    database: 'herbsway_sounds'
});

// JWT secret key
const JWT_SECRET = 'your-secret-key';

// Verify reCAPTCHA
app.post('/verify-recaptcha', async (req, res) => {
    const { token } = req.body;
    const response = await fetch(`https://www.google.com/recaptcha/api/siteverify?secret=YOUR_SECRET_KEY&response=${token}`, {
        method: 'POST'
    });
    const data = await response.json();
    res.json(data);
});

// Paystack payment initialization
app.post('/initialize-payment', async (req, res) => {
    const { email, amount, soundId } = req.body;
    
    // Initialize Paystack transaction
    const response = await fetch('https://api.paystack.co/transaction/initialize', {
        method: 'POST',
        headers: {
            'Authorization': 'Bearer YOUR_PAYSTACK_SECRET_KEY',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            email: email,
            amount: amount * 100, // Convert to kobo
            callback_url: 'https://your-website.com/verify-payment'
        })
    });
    
    const data = await response.json();
    res.json(data);
});

// Verify payment and update database
app.post('/verify-payment', async (req, res) => {
    const { reference } = req.body;
    
    // Verify transaction with Paystack
    const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
        headers: {
            'Authorization': 'Bearer YOUR_PAYSTACK_SECRET_KEY'
        }
    });
    
    const data = await response.json();
    
    if (data.status) {
        // Update database with purchase
        const query = 'INSERT INTO purchases (user_id, sound_id, amount, reference) VALUES (?, ?, ?, ?)';
        db.query(query, [data.data.customer.email, data.data.metadata.soundId, data.data.amount / 100, reference]);
    }
    
    res.json(data);
});

app.listen(3000, () => console.log('Server running on port 3000'));

// In server.js
const virusTotal = require('virustotal-api');
const vt = virusTotal('YOUR_VIRUSTOTAL_API_KEY');

app.post('/scan-file', async (req, res) => {
    const { filePath } = req.body;
    const report = await vt.scanFile(filePath);
    res.json(report);
});

// In server.js
const twilio = require('twilio');
const client = twilio('YOUR_TWILIO_ACCOUNT_SID', 'YOUR_TWILIO_AUTH_TOKEN');

app.post('/send-notification', async (req, res) => {
    const { to, message } = req.body;
    
    try {
        const message = await client.messages.create({
            body: message,
            from: 'YOUR_TWILIO_PHONE_NUMBER',
            to: to
        });
        res.json({ success: true, message: 'Notification sent' });
    } catch (error) {
        res.json({ success: false, error: error.message });
    }
});

// Add to server.js
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            scriptSrc: ["'self'", "https://js.paystack.co", "https://js.stripe.com"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'", "https://api.paystack.co", "https://api.stripe.com"]
        }
    }
}));


