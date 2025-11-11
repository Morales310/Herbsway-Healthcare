// client.js

const stripe = Stripe('pk_test_...your_stripe_publishable_key');

document.addEventListener('DOMContentLoaded', () => {
    // --- Function to handle Paystack redirection ---
    const initiatePaystackPayment = async (button) => {
        const productCard = button.closest('.product-card');
        const emailInput = productCard.querySelector('.email-input');
        const email = emailInput.value;

        if (!email) {
            alert('Please enter your email address.');
            return;
        }

        const soundId = button.dataset.soundId;
        const soundName = button.dataset.soundName;
        const price = button.dataset.price; // NGN price

        try {
            const response = await fetch('/create-paystack-session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ soundId, soundName, price, email }),
            });

            const session = await response.json();
            window.location.href = session.url; // Redirect to Paystack
        } catch (error) {
            console.error('Paystack Error:', error);
            alert('Something went wrong. Please try again.');
        }
    };

    // Handle Paystack Card/USSD buttons
    const paystackCardButtons = document.querySelectorAll('.paystack-card-btn');
    paystackCardButtons.forEach(button => {
        button.addEventListener('click', () => initiatePaystackPayment(button));
    });

    // Handle Paystack Bank Transfer buttons
    const paystackTransferButtons = document.querySelectorAll('.paystack-transfer-btn');
    paystackTransferButtons.forEach(button => {
        button.addEventListener('click', () => initiatePaystackPayment(button));
    });

    // Handle Stripe (PayPal) buttons (no changes here)
    const stripeButtons = document.querySelectorAll('.stripe-btn');
    stripeButtons.forEach(button => {
        button.addEventListener('click', async (event) => {
            const soundId = button.dataset.soundId;
            const soundName = button.dataset.soundName;
            const price = button.dataset.price; // USD price

            try {
                const response = await fetch('/create-stripe-session', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ soundId, soundName, price }),
                });

                const session = await response.json();
                const result = await stripe.redirectToCheckout({ sessionId: session.id });

                if (result.error) {
                    console.error(result.error.message);
                    alert('Something went wrong with PayPal. Please try again.');
                }
            } catch (error) {
                console.error('Stripe Error:', error);
                alert('Something went wrong. Please try again.');
            }
        });
    });
});
