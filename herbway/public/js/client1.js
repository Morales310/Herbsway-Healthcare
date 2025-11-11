// reCAPTCHA v3 setup
grecaptcha.ready(function() {
    grecaptcha.execute('YOUR_RECAPTCHA_SITE_KEY', {action: 'submit'}).then(function(token) {
        // Add token to form or send to server
    });
});

// Paystack payment handler
document.querySelectorAll('.paystack-btn').forEach(button => {
    button.addEventListener('click', async function() {
        const email = this.parentElement.parentElement.querySelector('.email-input').value;
        const soundId = this.dataset.soundId;
        const price = this.dataset.price;
        
        // Verify reCAPTCHA first
        const recaptchaToken = await grecaptcha.execute('YOUR_RECAPTCHA_SITE_KEY', {action: 'payment'});
        
        // Initialize payment
        const response = await fetch('/initialize-payment', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: email,
                amount: price,
                soundId: soundId,
                recaptchaToken: recaptchaToken
            })
        });
        
        const data = await response.json();
        
        if (data.status) {
            window.location.href = data.data.authorization_url;
        }
    });
});

// JWT authentication
function setToken(token) {
    localStorage.setItem('token', token);
}

function getToken() {
    return localStorage.getItem('token');
}

function isAuthenticated() {
    const token = getToken();
    if (!token) return false;
    
    try {
        const decoded = jwt.verify(token, 'YOUR_JWT_SECRET');
        return true;
    } catch (err) {
        return false;
    }
}

// API Endpoints
const API_BASE_URL = process.env.NODE_ENV === 'production' 
    ? 'https://your-production-url.com/api'
    : 'http://localhost:3000/api';

// Payment Endpoints
const PAYSTACK_API = 'https://api.paystack.co';
const STRIPE_API = 'https://api.stripe.com';

// Initialize Stripe
const stripe = Stripe('YOUR_STRIPE_PUBLIC_KEY');

// Initialize Paystack
const paystack = PaystackPop.setup({
    key: 'YOUR_PAYSTACK_PUBLIC_KEY',
    email: 'customer@example.com',
    amount: 50000,
    currency: 'NGN',
    ref: 'YOUR_UNIQUE_REFERENCE',
    callback: function(response) {
        // Handle payment response
    },
    onClose: function() {
        // Handle payment close
    }
});


// client.js
class PaymentHandler {
    constructor() {
        this.paystackPublicKey = process.env.PAYSTACK_PUBLIC_KEY;
        this.recaptchaSiteKey = process.env.RECAPTCHA_V3_SITE_KEY;
    }
    
    async initializePayment(soundId, email) {
        try {
            // Get reCAPTCHA token
            const recaptchaToken = await grecaptcha.execute(this.recaptchaSiteKey, {
                action: 'payment'
            });
            
            // Initialize payment
            const response = await fetch('/api/payment/initialize', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    soundId,
                    email,
                    recaptchaToken
                })
            });
            
            const data = await response.json();
            
            if (data.status) {
                // Redirect to Paystack payment page
                window.location.href = data.data.authorization_url;
            } else {
                throw new Error(data.error || 'Payment initialization failed');
            }
        } catch (error) {
            console.error('Payment error:', error);
            this.showError(error.message);
        }
    }
    
    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        document.body.appendChild(errorDiv);
        
        setTimeout(() => {
            errorDiv.remove();
        }, 5000);
    }
}

// Initialize payment handler
const paymentHandler = new PaymentHandler();

// Add event listeners to payment buttons
document.querySelectorAll('.paystack-btn').forEach(button => {
    button.addEventListener('click', async function() {
        const soundId = this.dataset.soundId;
        const email = this.parentElement.parentElement.querySelector('.email-input').value;
        
        if (!email) {
            paymentHandler.showError('Please enter your email address');
            return;
        }
        
        await paymentHandler.initializePayment(soundId, email);
    });
});
