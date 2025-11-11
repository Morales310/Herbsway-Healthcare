// payment.js
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const fetch = require('node-fetch');
const { verifyToken } = require('./auth');

// Add to payment.js
validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

validatePaymentData(data) {
    if (!this.validateEmail(data.email)) {
        throw new Error('Invalid email address');
    }
    if (data.price <= 0) {
        throw new Error('Invalid price');
    }
    return true;
}


// Connect to server endpoints
const paymentAPI = {
    initializePaystack: async (email, amount, metadata) => {
         const recaptchaToken = await grecaptcha.execute(process.env.RECAPTCHA_V3_SITE_KEY, {action: 'payment'});
        const response = await fetch(`${API_BASE_URL}/payment/paystack/initialize`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ email, amount, metadata, recaptchaToken })
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


// Initialize payment
router.post('/initialize', verifyToken, async (req, res) => {
    try {
        const { soundId, email } = req.body;
        
        // Get sound details from database
        const sound = await db.query(
            'SELECT * FROM sounds WHERE id = ?',
            [soundId]
        );
        
        if (!sound.length) {
            return res.status(404).json({ error: 'Sound not found' });
        }
        
        // Initialize Paystack transaction
        const response = await fetch('https://api.paystack.co/transaction/initialize', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: email,
                amount: sound[0].price * 100, // Convert to kobo
                callback_url: `${process.env.BASE_URL}/payment/verify`,
                metadata: {
                    soundId: soundId,
                    userId: req.user.id
                }
            })
        });
        
        const data = await response.json();
        
        if (data.status) {
            // Store transaction reference in database
            await db.query(
                'INSERT INTO purchases (user_id, sound_id, amount, reference, status) VALUES (?, ?, ?, ?, ?)',
                [req.user.id, soundId, sound[0].price, data.data.reference, 'pending']
            );
            
            res.json({
                status: true,
                data: {
                    authorization_url: data.data.authorization_url,
                    reference: data.data.reference
                }
            });
        } else {
            res.status(400).json({ error: 'Payment initialization failed' });
        }
    } catch (error) {
        console.error('Payment initialization error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Add to payment.js
trackPaymentEvent(event, data) {
    if (typeof gtag !== 'undefined') {
        gtag('event', event, {
            'event_category': 'payment',
            'event_label': data.soundName,
            'value': data.price
        });
    }
}


// Verify payment
router.get('/verify', async (req, res) => {
    try {
        const { reference } = req.query;
        
        // Verify transaction with Paystack
        const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
            headers: {
                'Authorization': `Bearer ${process.env.PAYSTACK_SECRET_KEY}`
            }
        });
        
        const data = await response.json();
        
        if (data.status && data.data.status === 'success') {
            // Update purchase status in database
            await db.query(
                'UPDATE purchases SET status = ? WHERE reference = ?',
                ['completed', reference]
            );
            
            // Send notification via Twilio
            await sendNotification(
                data.data.customer.email,
                'Your sound purchase was successful!'
            );
            
            res.redirect('/payment/success');
        } else {
            // Update purchase status to failed
            await db.query(
                'UPDATE purchases SET status = ? WHERE reference = ?',
                ['failed', reference]
            );
            
            res.redirect('/payment/failed');
        }
    } catch (error) {
        console.error('Payment verification error:', error);
        res.redirect('/payment/error');
    }
});

// Add to payment.js - Payment retry mechanism
async retryPayment(paymentData, maxRetries = 3) {
    for (let i = 0; i < maxRetries; i++) {
        try {
            const result = await this.initializePayment(paymentData);
            return result;
        } catch (error) {
            if (i === maxRetries - 1) throw error;
            await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
        }
    }
}


module.exports = router;
