// config.js
const dotenv = require('dotenv');
const crypto = require('crypto');

// Load environment variables
dotenv.config();

// Validate required environment variables
const requiredEnvVars = [
    'DB_HOST',
    'DB_USER',
    'DB_PASSWORD',
    'JWT_SECRET',
    'RECAPTCHA_V3_SECRET_KEY',
    'PAYSTACK_SECRET_KEY',
    'TWILIO_ACCOUNT_SID',
    'TWILIO_AUTH_TOKEN',
    'VIRUSTOTAL_API_KEY'
];

// Check for missing environment variables
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
}

// Encrypt sensitive data at rest
const encrypt = (text) => {
    const algorithm = 'aes-256-gcm';
    const key = crypto.scryptSync(process.env.JWT_SECRET, 'salt', 32);
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher(algorithm, key, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return {
        encrypted,
        iv: iv.toString('hex'),
        authTag: authTag.toString('hex')
    };
};

const decrypt = (encryption) => {
    const algorithm = 'aes-256-gcm';
    const key = crypto.scryptSync(process.env.JWT_SECRET, 'salt', 32);
    const decipher = crypto.createDecipher(algorithm, key, Buffer.from(encryption.iv, 'hex'));
    
    decipher.setAuthTag(Buffer.from(encryption.authTag, 'hex'));
    
    let decrypted = decipher.update(encryption.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
};

module.exports = {
    // Database configuration
    db: {
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    },
    
    // JWT configuration
    jwt: {
        secret: process.env.JWT_SECRET,
        expiresIn: '24h'
    },
    
    // API keys (encrypted)
    apiKeys: {
        recaptcha: encrypt(process.env.RECAPTCHA_V3_SECRET_KEY),
        paystack: encrypt(process.env.PAYSTACK_SECRET_KEY),
        twilio: {
            accountSid: encrypt(process.env.TWILIO_ACCOUNT_SID),
            authToken: encrypt(process.env.TWILIO_AUTH_TOKEN)
        },
        virusTotal: encrypt(process.env.VIRUSTOTAL_API_KEY)
    },
    
    // Helper functions
    encrypt,
    decrypt
};
