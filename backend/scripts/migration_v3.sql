-- Digimess Version 3.0 Migration Script (Standard MySQL)
SET FOREIGN_KEY_CHECKS = 0;

-- 1. Create Stored Procedure for Safe Column Addition
DROP PROCEDURE IF EXISTS AddColumnIfNotExists;
DELIMITER //
CREATE PROCEDURE AddColumnIfNotExists(
    IN tableName VARCHAR(64),
    IN colName VARCHAR(64),
    IN colDef VARCHAR(255)
)
BEGIN
    IF NOT EXISTS (
        SELECT * FROM information_schema.columns 
        WHERE table_schema = DATABASE() 
        AND table_name = tableName 
        AND column_name = colName
    ) THEN
        SET @sql = CONCAT('ALTER TABLE ', tableName, ' ADD COLUMN ', colName, ' ', colDef);
        PREPARE stmt FROM @sql;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
    END IF;
END //
DELIMITER ;

-- 2. Add Audit Columns
CALL AddColumnIfNotExists('Users', 'isActive', 'TINYINT(1) DEFAULT 1');
CALL AddColumnIfNotExists('Users', 'isDeleted', 'TINYINT(1) DEFAULT 0');
CALL AddColumnIfNotExists('Users', 'deletedAt', 'DATETIME DEFAULT NULL');
CALL AddColumnIfNotExists('Users', 'updatedAt', 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP');

CALL AddColumnIfNotExists('Messes', 'isActive', 'TINYINT(1) DEFAULT 1');
CALL AddColumnIfNotExists('Messes', 'isDeleted', 'TINYINT(1) DEFAULT 0');
CALL AddColumnIfNotExists('Messes', 'deletedAt', 'DATETIME DEFAULT NULL');
CALL AddColumnIfNotExists('Messes', 'capacity', 'INT DEFAULT NULL');
CALL AddColumnIfNotExists('Messes', 'deliveryRadius', 'DECIMAL(10,2) DEFAULT 5.00');

CALL AddColumnIfNotExists('Orders', 'isDeleted', 'TINYINT(1) DEFAULT 0');
CALL AddColumnIfNotExists('Orders', 'deletedAt', 'DATETIME DEFAULT NULL');

-- 3. Create NEW tables
CREATE TABLE IF NOT EXISTS FAQs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  category VARCHAR(100) DEFAULT 'general',
  displayOrder INT DEFAULT 0,
  isActive TINYINT(1) DEFAULT 1,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS AdminCharges (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  type ENUM('fixed', 'percentage') NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  appliesTo ENUM('order', 'recharge', 'all') DEFAULT 'order',
  isActive TINYINT(1) DEFAULT 1,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS OrderDetails (
  id VARCHAR(36) PRIMARY KEY,
  orderId VARCHAR(36) NOT NULL,
  itemName VARCHAR(255) NOT NULL,
  quantity INT DEFAULT 1,
  price DECIMAL(10,2) NOT NULL,
  FOREIGN KEY (orderId) REFERENCES Orders(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS DeviceRegistration (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId VARCHAR(36) NOT NULL,
  fcmToken TEXT NOT NULL,
  deviceType ENUM('android', 'ios', 'web') NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  lastUsed DATETIME DEFAULT NULL,
  FOREIGN KEY (userId) REFERENCES Users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. Initial Data
INSERT IGNORE INTO FAQs (question, answer, category, displayOrder) VALUES
('How do I place an order?', 'Select a mess and choose a meal or subscription, then pay via wallet.', 'orders', 1),
('How to recharge wallet?', 'Go to Profile > Wallet > Recharge to add balance.', 'wallet', 2);

INSERT IGNORE INTO AdminCharges (name, type, amount, appliesTo) VALUES
('Platform Commission', 'percentage', 10.00, 'order'),
('Service Fee', 'fixed', 5.00, 'recharge');

SET FOREIGN_KEY_CHECKS = 1;
