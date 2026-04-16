-- Migration: Add vendor/provider registration fields
-- Based on oldcode handlers: manageMess, manageMSPSettings, manageMSPAddress, manageBankDetails

-- ============================
-- 1. Add missing columns to Messes table
-- ============================
ALTER TABLE Messes
  ADD COLUMN messType VARCHAR(50) DEFAULT NULL COMMENT 'Veg/Non-Veg/Both' AFTER description,
  ADD COLUMN category VARCHAR(100) DEFAULT NULL COMMENT 'Tiffin, Thali, etc.' AFTER messType,
  ADD COLUMN autoConfirm BOOLEAN DEFAULT FALSE COMMENT 'Auto-confirm orders' AFTER category,
  ADD COLUMN deliveryAvailable BOOLEAN DEFAULT FALSE COMMENT 'Offers delivery' AFTER autoConfirm,
  ADD COLUMN dineIn BOOLEAN DEFAULT FALSE COMMENT 'Allows dine-in' AFTER deliveryAvailable,
  ADD COLUMN takeAway BOOLEAN DEFAULT FALSE COMMENT 'Allows take-away' AFTER dineIn,
  ADD COLUMN lunchStartTime TIME DEFAULT NULL COMMENT 'Lunch window start' AFTER takeAway,
  ADD COLUMN lunchEndTime TIME DEFAULT NULL COMMENT 'Lunch window end' AFTER lunchStartTime,
  ADD COLUMN dinnerStartTime TIME DEFAULT NULL COMMENT 'Dinner window start' AFTER lunchEndTime,
  ADD COLUMN dinnerEndTime TIME DEFAULT NULL COMMENT 'Dinner window end' AFTER dinnerStartTime,
  ADD COLUMN businessStatus BOOLEAN DEFAULT TRUE COMMENT 'Currently operational' AFTER dinnerEndTime,
  ADD COLUMN cuisines VARCHAR(255) DEFAULT NULL COMMENT 'Comma-separated cuisines' AFTER businessStatus,
  ADD COLUMN offer1 VARCHAR(255) DEFAULT NULL COMMENT 'Promo offer 1' AFTER cuisines,
  ADD COLUMN offer2 VARCHAR(255) DEFAULT NULL COMMENT 'Promo offer 2' AFTER offer1,
  ADD COLUMN offer3 VARCHAR(255) DEFAULT NULL COMMENT 'Promo offer 3' AFTER offer2,
  ADD COLUMN deliveryCharge DECIMAL(10,2) DEFAULT 0.00 COMMENT 'Delivery fee' AFTER offer3,
  ADD COLUMN invoiceFrequency VARCHAR(50) DEFAULT NULL COMMENT 'Invoice cycle (weekly/monthly)' AFTER deliveryCharge,
  ADD COLUMN isApproved BOOLEAN DEFAULT FALSE COMMENT 'Admin approved flag' AFTER invoiceFrequency;

-- ============================
-- 2. Create MessAddresses table
-- ============================
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

-- ============================
-- 3. Create BankDetails table
-- ============================
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
