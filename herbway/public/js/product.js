// products.js
class ProductsManager {
    constructor() {
        this.apiBaseURL = process.env.NODE_ENV === 'production' 
            ? 'https://your-production-url.com/api'
            : 'http://localhost:3000/api';
        this.productsContainer = document.querySelector('.product-list');
        this.filters = {
            category: 'all',
            priceRange: 'all',
            searchTerm: ''
        };
    }

    async fetchProducts() {
        try {
            const response = await fetch(`${this.apiBaseURL}/products`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();
            
            if (data.status) {
                this.renderProducts(data.products);
            } else {
                throw new Error(data.message || 'Failed to fetch products');
            }
        } catch (error) {
            console.error('Products fetch error:', error);
            this.showError(error.message);
        }
    }

    renderProducts(products) {
        if (!this.productsContainer) return;

        this.productsContainer.innerHTML = products.map(product => `
            <div class="product-card" data-product-id="${product.id}">
                <div class="product-image">
                    <img src="${product.image}" alt="${product.name}">
                    <div class="product-overlay">
                        <button class="preview-btn" data-sound="${product.file}">Preview</button>
                    </div>
                </div>
                <div class="product-info">
                    <h2>${product.name}</h2>
                    <p class="description">${product.description}</p>
                    <p class="price">₦${product.price_ngn} / $${product.price_usd}</p>
                    <div class="purchase-options">
                        <input type="email" class="email-input" placeholder="Enter your email" required>
                        <div class="payment-buttons">
                            <button class="paystack-card-btn" 
                                data-sound-id="${product.file}" 
                                data-sound-name="${product.name}"
                                data-price="${product.price_ngn}">
                                Pay with Card / USSD
                            </button>
                            <button class="paystack-transfer-btn" 
                                data-sound-id="${product.file}" 
                                data-sound-name="${product.name}"
                                data-price="${product.price_ngn}">
                                Pay with Bank Transfer
                            </button>
                            <button class="stripe-btn" 
                                data-sound-id="${product.file}" 
                                data-sound-name="${product.name}"
                                data-price="${product.price_usd}">
                                Pay with PayPal
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');

        this.attachEventListeners();
    }

    attachEventListeners() {
        // Preview buttons
        document.querySelectorAll('.preview-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const soundFile = e.target.dataset.sound;
                this.playPreview(soundFile);
            });
        });
    }

    playPreview(soundFile) {
        // Implement audio preview functionality
        const audio = new Audio(`/sounds/${soundFile}`);
        audio.play();
    }

    filterProducts() {
        // Implement product filtering logic
        const filteredProducts = this.products.filter(product => {
            const matchesCategory = this.filters.category === 'all' || product.category === this.filters.category;
            const matchesPrice = this.filters.priceRange === 'all' || this.isInPriceRange(product.price_ngn);
            const matchesSearch = this.filters.searchTerm === '' || 
                product.name.toLowerCase().includes(this.filters.searchTerm.toLowerCase()) ||
                product.description.toLowerCase().includes(this.filters.searchTerm.toLowerCase());

            return matchesCategory && matchesPrice && matchesSearch;
        });

        this.renderProducts(filteredProducts);
    }

    // Add to products.js
async fetchProducts() {
    const cacheKey = 'products_cache';
    const cached = localStorage.getItem(cacheKey);
    
    if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < 3600000) { // 1 hour cache
            this.renderProducts(data);
            return;
        }
    }
    
    // Fetch fresh data...
}


    isInPriceRange(price) {
        const [min, max] = this.filters.priceRange.split('-').map(Number);
        return price >= min && price <= max;
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

// Initialize products manager
const productsManager = new ProductsManager();

// Fetch products when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    productsManager.fetchProducts();
});

