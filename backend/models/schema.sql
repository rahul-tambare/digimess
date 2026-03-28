CREATE TABLE IF NOT EXISTS Users (
    id VARCHAR(36) PRIMARY KEY,
    phone VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(255),
    email VARCHAR(255) UNIQUE,
    isVerified BOOLEAN DEFAULT FALSE,
    role ENUM('customer', 'vendor', 'admin') DEFAULT 'customer',
    walletBalance DECIMAL(10, 2) DEFAULT 0.00,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS Messes (
    id VARCHAR(36) PRIMARY KEY,
    vendorId VARCHAR(36),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    rating FLOAT DEFAULT 0.0,
    isOpen BOOLEAN DEFAULT TRUE,
    address TEXT,
    images JSON, -- Array of image URLs
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (vendorId) REFERENCES Users(id) ON DELETE SET NULL
);

-- Basic menu per Mess
CREATE TABLE IF NOT EXISTS Menus (
    id VARCHAR(36) PRIMARY KEY,
    messId VARCHAR(36) NOT NULL,
    itemName VARCHAR(255) NOT NULL,
    itemDescription TEXT,
    price DECIMAL(10, 2) NOT NULL,
    isAvailable BOOLEAN DEFAULT TRUE,
    isVeg BOOLEAN DEFAULT TRUE,
    calories INT DEFAULT NULL,
    category VARCHAR(100) DEFAULT NULL,
    images JSON, -- Array of image URLs for menu items
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (messId) REFERENCES Messes(id) ON DELETE CASCADE
);

-- Subscriptions / Multi Mess Bundles
CREATE TABLE IF NOT EXISTS Subscriptions (
    id VARCHAR(36) PRIMARY KEY,
    customerId VARCHAR(36) NOT NULL,
    messId VARCHAR(36), -- Can be NULL if it's a multi-mess bundle or region wide
    type ENUM('single_mess', 'multi_mess') DEFAULT 'single_mess',
    startDate DATE NOT NULL,
    endDate DATE NOT NULL,
    mealsRemaining INT NOT NULL DEFAULT 0,
    isActive BOOLEAN DEFAULT TRUE,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (customerId) REFERENCES Users(id) ON DELETE CASCADE,
    FOREIGN KEY (messId) REFERENCES Messes(id) ON DELETE SET NULL
);

-- Orders
CREATE TABLE IF NOT EXISTS Orders (
    id VARCHAR(36) PRIMARY KEY,
    customerId VARCHAR(36) NOT NULL,
    messId VARCHAR(36) NOT NULL,
    totalAmount DECIMAL(10, 2) NOT NULL,
    items JSON, -- Details of meals/thalis ordered
    status ENUM('pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled') DEFAULT 'pending',
    orderType ENUM('on_demand', 'subscription') DEFAULT 'on_demand',
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (customerId) REFERENCES Users(id),
    FOREIGN KEY (messId) REFERENCES Messes(id)
);

-- Wallet Transactions
CREATE TABLE IF NOT EXISTS WalletTransactions (
    id VARCHAR(36) PRIMARY KEY,
    userId VARCHAR(36) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    type ENUM('credit', 'debit') NOT NULL,
    description VARCHAR(255),
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES Users(id) ON DELETE CASCADE
);

-- NEW TABLES FOR DYNAMIC CONTENT
CREATE TABLE IF NOT EXISTS PlanCategories (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS SubscriptionPlans (
    id VARCHAR(36) PRIMARY KEY,
    categoryId VARCHAR(36),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    mealsCount INT DEFAULT 0,
    benefits JSON, -- Array of strings
    isActive BOOLEAN DEFAULT TRUE,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (categoryId) REFERENCES PlanCategories(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS AppConfig (
    configKey VARCHAR(255) PRIMARY KEY,
    configValue TEXT,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- User delivery addresses (synced to backend)
CREATE TABLE IF NOT EXISTS Addresses (
    id VARCHAR(36) PRIMARY KEY,
    customerId VARCHAR(36) NOT NULL,
    label ENUM('Home', 'Work', 'Other') DEFAULT 'Home',
    addressLine VARCHAR(255) NOT NULL,
    area VARCHAR(255),
    city VARCHAR(100) NOT NULL,
    pincode VARCHAR(10) NOT NULL,
    isDefault BOOLEAN DEFAULT FALSE,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customerId) REFERENCES Users(id) ON DELETE CASCADE
);

-- Mess reviews and ratings
CREATE TABLE IF NOT EXISTS Reviews (
    id VARCHAR(36) PRIMARY KEY,
    orderId VARCHAR(36),
    customerId VARCHAR(36) NOT NULL,
    messId VARCHAR(36) NOT NULL,
    rating DECIMAL(2,1) NOT NULL,
    reviewText TEXT,
    foodQuality DECIMAL(2,1),
    deliveryTime DECIMAL(2,1),
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customerId) REFERENCES Users(id) ON DELETE CASCADE,
    FOREIGN KEY (messId) REFERENCES Messes(id) ON DELETE CASCADE,
    FOREIGN KEY (orderId) REFERENCES Orders(id) ON DELETE SET NULL
);

-- Schema completed

