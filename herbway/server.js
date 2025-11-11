// server.js
require('dotenv').config();
const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const paystack = require('paystack-api')(process.env.PAYSTACK_SECRET_KEY);
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

// Middleware
app.use(express.static('public'));
app.use(express.json());
app.use(cors());

// --- API Routes ---

// 1. Create a Paystack Checkout Session
app.post('/create-paystack-session', async (req, res) => {
    const { soundId, soundName, price, email } = req.body; // Paystack requires an email

    try {
        const response = await paystack.transaction.initialize({
            email: email,
            amount: price * 100, // Amount in kobo (NGN)
            currency: 'NGN',
            // Pass product info in metadata to verify later
            metadata: {
                soundId: soundId,
                soundName: soundName,
            },
            // Paystack will redirect to this URL on success
            callback_url: `${req.protocol}://${req.get('host')}/verify-payment?reference={reference}`,
        });
        res.json({ url: response.data.authorization_url });
    } catch (error) {
        console.error("Paystack Error:", error);
        res.status(500).json({ error: { message: error.message } });
    }
});

// 2. Create a Stripe (PayPal) Checkout Session
app.post('/create-stripe-session', async (req, res) => {
    const { soundId, soundName, price } = req.body;

    try {
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card', 'paypal'], // Enable PayPal!
            mode: 'payment',
            line_items: [{
                price_data: {
                    currency: 'usd', // PayPal transactions through Stripe are often in USD
                    product_data: { name: soundName },
                    unit_amount: price * 100, // Price in cents (USD)
                },
                quantity: 1,
            }],
            success_url: `${req.protocol}://${req.get('host')}/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${req.protocol}://${req.get('host')}/cancel.html`,
        });
        res.json({ url: session.url });
    } catch (error) {
        console.error("Stripe Error:", error);
        res.status(500).json({ error: { message: error.message } });
    }
});

// 3. Verification Route for Paystack
app.get('/verify-payment', async (req, res) => {
    const { reference } = req.query;
    if (!reference) {
        return res.status(400).send('Payment reference not found.');
    }

    try {
        const response = await paystack.transaction.verify({ reference });

        if (response.data.status === 'success') {
            // PAYMENT WAS SUCCESSFUL!
            const soundName = response.data.metadata.soundName;
            const filePath = path.join(__dirname, 'sounds', soundName);
            
            if (!fs.existsSync(filePath)) {
                return res.status(404).send("Sound file not found.");
            }

            res.setHeader('Content-Disposition', `attachment; filename="${soundName}"`);
            res.setHeader('Content-Type', 'audio/wav');
            const fileStream = fs.createReadStream(filePath);
            fileStream.pipe(res);

        } else {
            res.status(403).send('Payment was not successful.');
        }
    } catch (error) {
        console.error("Paystack Verification Error:", error);
        res.status(500).send("An error occurred during payment verification.");
    }
});

// 4. Success Route for Stripe (PayPal) - This remains the same as before
app.get('/success', async (req, res) => {
    const sessionId = req.query.session_id;
    try {
        const session = await stripe.checkout.sessions.retrieve(sessionId);
        if (session.payment_status === 'paid') {
            const soundName = session.display_items[0].price.product.name;
            const filePath = path.join(__dirname, 'sounds', soundName);
            if (!fs.existsSync(filePath)) {
                return res.status(404).send("Sound file not found.");
            }
            res.setHeader('Content-Disposition', `attachment; filename="${soundName}"`);
            res.setHeader('Content-Type', 'audio/wav');
            const fileStream = fs.createReadStream(filePath);
            fileStream.pipe(res);
        } else {
            res.status(403).send('Payment not successful.');
        }
    } catch (error) {
        console.error("Stripe Success Error:", error);
        res.status(500).send("An error occurred.");
    }
});

// 5. Cancel page
app.get('/cancel.html', (req, res) => {
    res.send('<h1>Payment Cancelled</h1><p>You have cancelled the payment. You can close this tab.</p>');
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
