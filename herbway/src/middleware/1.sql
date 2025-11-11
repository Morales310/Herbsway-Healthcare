-- Create the database
CREATE DATABASE IF NOT EXISTS herbsway_sounds;
USE herbsway_sounds;

-- Users table
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    phone_number VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email)
);

-- Categories table for organizing sounds
CREATE TABLE categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sounds table with foreign key to categories
CREATE TABLE sounds (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    file_path VARCHAR(255) NOT NULL,
    file_hash VARCHAR(64) UNIQUE, -- For VirusTotal integration
    price DECIMAL(10,2) NOT NULL,
    duration INT, -- in seconds
    category_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id),
    INDEX idx_category (category_id)
);

-- Purchases table with proper foreign keys
CREATE TABLE purchases (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    sound_id INT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    reference VARCHAR(255) NOT NULL,
    status ENUM('pending', 'completed', 'failed') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (sound_id) REFERENCES sounds(id),
    INDEX idx_user (user_id),
    INDEX idx_reference (reference)
);

-- User sessions table for JWT token management
CREATE TABLE user_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    INDEX idx_user (user_id)
);

-- Insert sample categories
INSERT INTO categories (name, description) VALUES
('Meditation', 'Sounds for deep meditation and mindfulness'),
('Sleep', 'Calming sounds for better sleep'),
('Focus', 'Sounds to improve concentration'),
('Relaxation', 'General relaxation and stress relief');

-- Insert sample sounds
INSERT INTO sounds (name, description, file_path, price, duration, category_id) VALUES
('Ocean Waves', 'Calming ocean waves for deep meditation', 'sounds/ocean_waves.mp3', 1.99, 1800, 1),
('Rain Forest', 'Natural rainforest sounds for stress relief', 'sounds/rain_forest.mp3', 1.99, 2400, 4),
('Sleep Piano', 'Gentle piano melodies for sleep', 'sounds/sleep_piano.mp3', 2.99, 3600, 2),
-- Add more sounds as needed
;
