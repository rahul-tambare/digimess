CREATE TABLE IF NOT EXISTS Users (
    id VARCHAR(36) PRIMARY KEY,
    phone VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(255),
    email VARCHAR(255) UNIQUE,
    password VARCHAR(255),
    gender VARCHAR(20) DEFAULT NULL,
    dateOfBirth DATE DEFAULT NULL,
    isVerified BOOLEAN DEFAULT FALSE,
    role ENUM('customer', 'vendor', 'admin') DEFAULT 'customer',
    walletBalance DECIMAL(10, 2) DEFAULT 0.00,
    isActive TINYINT(1) DEFAULT 1,
    isDeleted TINYINT(1) DEFAULT 0,
    deletedAt DATETIME DEFAULT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS Messes (
    id VARCHAR(36) PRIMARY KEY,
    vendorId VARCHAR(36),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    messType VARCHAR(50) DEFAULT NULL COMMENT 'Veg/Non-Veg/Both',
    category VARCHAR(100) DEFAULT NULL COMMENT 'Tiffin, Thali, etc.',
    autoConfirm BOOLEAN DEFAULT FALSE,
    deliveryAvailable BOOLEAN DEFAULT FALSE,
    dineIn BOOLEAN DEFAULT FALSE,
    takeAway BOOLEAN DEFAULT FALSE,
    lunchStartTime TIME DEFAULT NULL,
    lunchEndTime TIME DEFAULT NULL,
    dinnerStartTime TIME DEFAULT NULL,
    dinnerEndTime TIME DEFAULT NULL,
    businessStatus BOOLEAN DEFAULT TRUE,
    cuisines VARCHAR(255) DEFAULT NULL,
    offer1 VARCHAR(255) DEFAULT NULL,
    offer2 VARCHAR(255) DEFAULT NULL,
    offer3 VARCHAR(255) DEFAULT NULL,
    deliveryCharge DECIMAL(10,2) DEFAULT 0.00,
    invoiceFrequency VARCHAR(50) DEFAULT NULL,
    isApproved BOOLEAN DEFAULT FALSE,
    rating FLOAT DEFAULT 0.0,
    isOpen BOOLEAN DEFAULT TRUE,
    address TEXT,
    images JSON,
    isActive TINYINT(1) DEFAULT 1,
    isDeleted TINYINT(1) DEFAULT 0,
    deletedAt DATETIME DEFAULT NULL,
    capacity INT DEFAULT NULL,
    deliveryRadius DECIMAL(10,2) DEFAULT 5.00,
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
    planId VARCHAR(36) DEFAULT NULL, -- Which SubscriptionPlan was purchased
    allowedMesses JSON, -- Can be NULL, used for tracking which messes a bundle subscription is valid for
    type ENUM('single_mess', 'multi_mess') DEFAULT 'single_mess',
    startDate DATE NOT NULL,
    endDate DATE NOT NULL,
    pauseStartDate DATE DEFAULT NULL,
    pauseEndDate DATE DEFAULT NULL,
    mealsRemaining INT NOT NULL DEFAULT 0,
    totalMeals INT NOT NULL DEFAULT 0, -- Original total for refund calculation
    isActive BOOLEAN DEFAULT TRUE,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (customerId) REFERENCES Users(id) ON DELETE CASCADE,
    FOREIGN KEY (messId) REFERENCES Messes(id) ON DELETE SET NULL,
    FOREIGN KEY (planId) REFERENCES SubscriptionPlans(id) ON DELETE SET NULL
);

-- Orders
CREATE TABLE IF NOT EXISTS Orders (
    id VARCHAR(36) PRIMARY KEY,
    customerId VARCHAR(36) NOT NULL,
    messId VARCHAR(36) NOT NULL,
    totalAmount DECIMAL(10, 2) NOT NULL,
    items JSON, -- Details of meals/thalis ordered
    status ENUM('pending', 'accepted', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled', 'rejected') DEFAULT 'pending',
    orderType ENUM('on_demand', 'subscription') DEFAULT 'on_demand',
    deliveryType VARCHAR(50) DEFAULT NULL,
    deliveryAddress TEXT DEFAULT NULL,
    paymentMethod VARCHAR(50) DEFAULT NULL,
    specialNote TEXT DEFAULT NULL,
    subscriptionId VARCHAR(36) DEFAULT NULL,
    isDeleted TINYINT(1) DEFAULT 0,
    deletedAt DATETIME DEFAULT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (customerId) REFERENCES Users(id),
    FOREIGN KEY (messId) REFERENCES Messes(id),
    FOREIGN KEY (subscriptionId) REFERENCES Subscriptions(id) ON DELETE SET NULL
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

-- Push Notifications and Device Tokens
CREATE TABLE IF NOT EXISTS DeviceRegistration (
    id INT AUTO_INCREMENT PRIMARY KEY,
    userId VARCHAR(36) NOT NULL,
    fcmToken VARCHAR(255) NOT NULL,
    deviceType VARCHAR(50),
    lastUsed TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES Users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS NotificationLogs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    userId VARCHAR(36) NOT NULL,
    title VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    data JSON,
    isRead BOOLEAN DEFAULT FALSE,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES Users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS FAQs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  category VARCHAR(100) DEFAULT 'general',
  displayOrder INT DEFAULT 0,
  isActive TINYINT(1) DEFAULT 1,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS AdminCharges (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  type ENUM('fixed', 'percentage') NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  appliesTo ENUM('order', 'recharge', 'all') DEFAULT 'order',
  isActive TINYINT(1) DEFAULT 1,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS OrderDetails (
  id VARCHAR(36) PRIMARY KEY,
  orderId VARCHAR(36) NOT NULL,
  itemName VARCHAR(255) NOT NULL,
  quantity INT DEFAULT 1,
  price DECIMAL(10,2) NOT NULL,
  FOREIGN KEY (orderId) REFERENCES Orders(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS PaymentSessions (
  id VARCHAR(36) PRIMARY KEY,
  userId VARCHAR(36) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  type ENUM('order', 'recharge') NOT NULL,
  status ENUM('pending', 'success', 'failed') DEFAULT 'pending',
  gatewayOrderId VARCHAR(255),
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completedAt DATETIME DEFAULT NULL,
  FOREIGN KEY (userId) REFERENCES Users(id) ON DELETE CASCADE
);

-- Mess Provider Addresses (from oldcode TB_MSP_ADDRESS)
CREATE TABLE IF NOT EXISTS MessAddresses (
    id VARCHAR(36) PRIMARY KEY,
    messId VARCHAR(36) NOT NULL,
    line1 VARCHAR(255) NOT NULL,
    line2 VARCHAR(255) DEFAULT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    pincode VARCHAR(10) NOT NULL,
    latitude DECIMAL(10,7) DEFAULT NULL,
    longitude DECIMAL(10,7) DEFAULT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (messId) REFERENCES Messes(id) ON DELETE CASCADE
);

-- Vendor Bank Details (from oldcode TB_BANKDETAILS)
CREATE TABLE IF NOT EXISTS BankDetails (
    id VARCHAR(36) PRIMARY KEY,
    vendorId VARCHAR(36) NOT NULL,
    bankName VARCHAR(255) NOT NULL,
    accountNumber VARCHAR(50) NOT NULL,
    accountHolderName VARCHAR(255) NOT NULL,
    ifscCode VARCHAR(20) NOT NULL,
    upiId VARCHAR(100) DEFAULT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (vendorId) REFERENCES Users(id) ON DELETE CASCADE
);

-- Thali / Combo offerings per Mess
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
    subscriptionExtraCharge DECIMAL(10,2) DEFAULT 0.00,
    isAvailable BOOLEAN DEFAULT TRUE,
    isSpecial BOOLEAN DEFAULT FALSE,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (messId) REFERENCES Messes(id) ON DELETE CASCADE
);

-- Customer Favorite Messes
CREATE TABLE IF NOT EXISTS Favorites (
    id VARCHAR(36) PRIMARY KEY,
    customerId VARCHAR(36) NOT NULL,
    messId VARCHAR(36) NOT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_fav (customerId, messId),
    FOREIGN KEY (customerId) REFERENCES Users(id) ON DELETE CASCADE,
    FOREIGN KEY (messId) REFERENCES Messes(id) ON DELETE CASCADE
);

-- Discount Coupons
CREATE TABLE IF NOT EXISTS Coupons (
    id VARCHAR(36) PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    discountType ENUM('fixed', 'percentage') NOT NULL,
    discountValue DECIMAL(10,2) NOT NULL,
    minOrderAmount DECIMAL(10,2) DEFAULT 0.00,
    maxDiscount DECIMAL(10,2) DEFAULT NULL,
    validFrom DATE NOT NULL,
    validTo DATE NOT NULL,
    usageLimit INT DEFAULT NULL,
    usedCount INT DEFAULT 0,
    isActive BOOLEAN DEFAULT TRUE,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Subscription Meal Skips
CREATE TABLE IF NOT EXISTS SubscriptionSkips (
    id VARCHAR(36) PRIMARY KEY,
    subscriptionId VARCHAR(36) NOT NULL,
    skipDate DATE NOT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_skip (subscriptionId, skipDate),
    FOREIGN KEY (subscriptionId) REFERENCES Subscriptions(id) ON DELETE CASCADE
);

-- Order Status Change Timeline
CREATE TABLE IF NOT EXISTS OrderStatusTimeline (
    id INT AUTO_INCREMENT PRIMARY KEY,
    orderId VARCHAR(36) NOT NULL,
    status VARCHAR(50) NOT NULL,
    note TEXT DEFAULT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (orderId) REFERENCES Orders(id) ON DELETE CASCADE
);

-- RBAC: Roles
CREATE TABLE IF NOT EXISTS Roles (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    isSuperAdmin TINYINT(1) DEFAULT 0,
    isActive TINYINT(1) DEFAULT 1,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- RBAC: Permissions
CREATE TABLE IF NOT EXISTS Permissions (
    id VARCHAR(36) PRIMARY KEY,
    module VARCHAR(100) NOT NULL,
    action VARCHAR(100) NOT NULL,
    slug VARCHAR(200) NOT NULL UNIQUE,
    description TEXT,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- RBAC: Role ↔ Permission mapping
CREATE TABLE IF NOT EXISTS RolePermissions (
    roleId VARCHAR(36) NOT NULL,
    permissionId VARCHAR(36) NOT NULL,
    PRIMARY KEY (roleId, permissionId),
    FOREIGN KEY (roleId) REFERENCES Roles(id) ON DELETE CASCADE,
    FOREIGN KEY (permissionId) REFERENCES Permissions(id) ON DELETE CASCADE
);

-- RBAC: Admin Users (separate from customer/vendor Users)
CREATE TABLE IF NOT EXISTS AdminUsers (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    roleId VARCHAR(36) NOT NULL,
    isActive TINYINT(1) DEFAULT 1,
    lastLoginAt DATETIME DEFAULT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (roleId) REFERENCES Roles(id) ON DELETE RESTRICT
);

-- Schema completed
