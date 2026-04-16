-- =============================================
-- Migration: Create Thalis table for provider app
-- =============================================

CREATE TABLE IF NOT EXISTS Thalis (
    id VARCHAR(36) PRIMARY KEY,
    messId VARCHAR(36) NOT NULL,
    name VARCHAR(255) NOT NULL,
    mealTime ENUM('Breakfast','Lunch','Dinner','All Day') DEFAULT 'Lunch',
    type ENUM('Veg','Non-Veg','Jain') DEFAULT 'Veg',
    itemsIncluded TEXT,
    numberOfItems INT DEFAULT 0,
    price DECIMAL(10,2) NOT NULL,
    discountedPrice DECIMAL(10,2) DEFAULT NULL,
    description TEXT,
    maxQtyPerDay INT DEFAULT NULL,
    image VARCHAR(500) DEFAULT NULL,
    isSubscriptionThali BOOLEAN DEFAULT FALSE,
    isAvailable BOOLEAN DEFAULT TRUE,
    isSpecial BOOLEAN DEFAULT FALSE,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (messId) REFERENCES Messes(id) ON DELETE CASCADE
);
