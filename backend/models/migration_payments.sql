-- ============================================================
-- DIGIMESS — Payment & Settlement System Migration
-- Run this AFTER the base schema (schema.sql) is applied.
-- ============================================================

-- 1. LEDGER ACCOUNTS
-- Every financial entity gets a ledger account.
-- NO balance column — balance is derived from LedgerEntries.
CREATE TABLE IF NOT EXISTS LedgerAccounts (
    id VARCHAR(36) PRIMARY KEY,
    accountType ENUM(
        'CONSUMER_WALLET',
        'VENDOR_WALLET',
        'PLATFORM_ESCROW',
        'PLATFORM_REVENUE',
        'TAX_COLLECTED',
        'REFUND_RESERVE'
    ) NOT NULL,
    ownerId VARCHAR(36) DEFAULT NULL COMMENT 'UserId or MessId or NULL for platform accounts',
    ownerType ENUM('USER', 'MESS', 'PLATFORM') NOT NULL,
    currency VARCHAR(3) DEFAULT 'INR',
    isActive TINYINT(1) DEFAULT 1,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_account (accountType, ownerId)
);

-- 2. LEDGER TRANSACTIONS
-- Every financial event (payment, refund, settlement, etc.)
CREATE TABLE IF NOT EXISTS LedgerTransactions (
    id VARCHAR(36) PRIMARY KEY,
    type ENUM(
        'ORDER_PAYMENT',
        'COMMISSION',
        'VENDOR_SETTLEMENT',
        'REFUND',
        'WALLET_TOPUP',
        'WALLET_WITHDRAWAL',
        'CHARGEBACK',
        'ADJUSTMENT'
    ) NOT NULL,
    status ENUM('PENDING', 'COMPLETED', 'FAILED', 'REVERSED') DEFAULT 'PENDING',
    amount DECIMAL(10, 2) NOT NULL,
    referenceId VARCHAR(36) DEFAULT NULL COMMENT 'orderId, subscriptionId, etc.',
    referenceType VARCHAR(50) DEFAULT NULL COMMENT 'ORDER, SUBSCRIPTION, WALLET_TOPUP, etc.',
    gatewayTransactionId VARCHAR(255) DEFAULT NULL,
    idempotencyKey VARCHAR(255) DEFAULT NULL,
    metadata JSON DEFAULT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_idempotency (idempotencyKey)
);

-- 3. LEDGER ENTRIES
-- Every financial movement as debit+credit pairs.
-- For every transaction, SUM(debits) MUST equal SUM(credits).
CREATE TABLE IF NOT EXISTS LedgerEntries (
    id VARCHAR(36) PRIMARY KEY,
    transactionId VARCHAR(36) NOT NULL,
    accountId VARCHAR(36) NOT NULL,
    entryType ENUM('DEBIT', 'CREDIT') NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    narration VARCHAR(500) DEFAULT NULL,
    metadata JSON DEFAULT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    createdBy VARCHAR(36) DEFAULT NULL,
    FOREIGN KEY (transactionId) REFERENCES LedgerTransactions(id),
    FOREIGN KEY (accountId) REFERENCES LedgerAccounts(id),
    INDEX idx_account_created (accountId, createdAt),
    INDEX idx_transaction (transactionId)
);

-- 4. LEDGER BALANCE SNAPSHOTS
-- Periodic snapshots for read performance optimization.
CREATE TABLE IF NOT EXISTS LedgerBalanceSnapshots (
    id VARCHAR(36) PRIMARY KEY,
    accountId VARCHAR(36) NOT NULL,
    balance DECIMAL(10, 2) NOT NULL,
    snapshotAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    entryCount INT DEFAULT 0 COMMENT 'Number of entries included in this snapshot',
    FOREIGN KEY (accountId) REFERENCES LedgerAccounts(id),
    INDEX idx_account_snapshot (accountId, snapshotAt)
);

-- 5. SETTLEMENTS
CREATE TABLE IF NOT EXISTS Settlements (
    id VARCHAR(36) PRIMARY KEY,
    vendorId VARCHAR(36) NOT NULL,
    messId VARCHAR(36) NOT NULL,
    status ENUM('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'PARTIALLY_COMPLETED') DEFAULT 'PENDING',
    totalAmount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    commissionAmount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    netAmount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    settlementPeriod JSON DEFAULT NULL COMMENT '{"from": "2026-04-01", "to": "2026-04-07"}',
    orderIds JSON DEFAULT NULL,
    payoutId VARCHAR(255) DEFAULT NULL COMMENT 'RazorpayX payout reference',
    payoutStatus VARCHAR(50) DEFAULT NULL,
    failureReason TEXT DEFAULT NULL,
    retryCount INT DEFAULT 0,
    maxRetries INT DEFAULT 3,
    lastRetryAt DATETIME DEFAULT NULL,
    settledAt DATETIME DEFAULT NULL,
    initiatedBy ENUM('SYSTEM', 'ADMIN') DEFAULT 'SYSTEM',
    refundRecoveryAmount DECIMAL(10, 2) DEFAULT 0.00 COMMENT 'Deducted from this settlement for post-settlement refunds',
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (vendorId) REFERENCES Users(id),
    FOREIGN KEY (messId) REFERENCES Messes(id),
    INDEX idx_vendor_status (vendorId, status),
    INDEX idx_status (status)
);

-- 6. SETTLEMENT CONFIG
-- Per-vendor overrides; falls back to global AdminCharges if absent.
CREATE TABLE IF NOT EXISTS SettlementConfig (
    id VARCHAR(36) PRIMARY KEY,
    vendorId VARCHAR(36) NOT NULL UNIQUE,
    commissionType ENUM('fixed', 'percentage') DEFAULT 'percentage',
    commissionAmount DECIMAL(10, 2) DEFAULT 10.00 COMMENT 'e.g. 10 means 10%',
    settlementFrequency ENUM('daily', 'weekly', 'biweekly', 'monthly') DEFAULT 'weekly',
    holdPeriodDays INT DEFAULT 2 COMMENT 'Days after delivery before settlement eligible',
    minSettlementAmount DECIMAL(10, 2) DEFAULT 100.00,
    isActive TINYINT(1) DEFAULT 1,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (vendorId) REFERENCES Users(id)
);

-- 7. REFUNDS
CREATE TABLE IF NOT EXISTS Refunds (
    id VARCHAR(36) PRIMARY KEY,
    orderId VARCHAR(36) NOT NULL,
    transactionId VARCHAR(36) DEFAULT NULL COMMENT 'LedgerTransactions ref',
    type ENUM('FULL', 'PARTIAL') NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    reason TEXT DEFAULT NULL,
    status ENUM('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED') DEFAULT 'PENDING',
    refundMethod ENUM('ORIGINAL_PAYMENT', 'WALLET') DEFAULT 'WALLET',
    gatewayRefundId VARCHAR(255) DEFAULT NULL,
    initiatedBy VARCHAR(36) DEFAULT NULL COMMENT 'AdminUser who initiated',
    processedAt DATETIME DEFAULT NULL,
    metadata JSON DEFAULT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (orderId) REFERENCES Orders(id),
    FOREIGN KEY (transactionId) REFERENCES LedgerTransactions(id),
    INDEX idx_order (orderId),
    INDEX idx_status (status)
);

-- 8. RECONCILIATION REPORTS
CREATE TABLE IF NOT EXISTS ReconciliationReports (
    id VARCHAR(36) PRIMARY KEY,
    reportDate DATE NOT NULL,
    totalGateway DECIMAL(10, 2) DEFAULT 0.00,
    totalInternal DECIMAL(10, 2) DEFAULT 0.00,
    matchedCount INT DEFAULT 0,
    mismatchedCount INT DEFAULT 0,
    discrepancies JSON DEFAULT NULL,
    status ENUM('GENERATED', 'REVIEWED', 'CLOSED') DEFAULT 'GENERATED',
    reviewedBy VARCHAR(36) DEFAULT NULL COMMENT 'AdminUsers ref',
    notes TEXT DEFAULT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_report_date (reportDate)
);

-- 9. AUDIT LOGS
CREATE TABLE IF NOT EXISTS AuditLogs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    actorId VARCHAR(36) DEFAULT NULL,
    actorType ENUM('SYSTEM', 'ADMIN', 'USER', 'WEBHOOK') NOT NULL,
    action VARCHAR(100) NOT NULL,
    resourceType VARCHAR(50) DEFAULT NULL,
    resourceId VARCHAR(36) DEFAULT NULL,
    previousState JSON DEFAULT NULL,
    newState JSON DEFAULT NULL,
    ipAddress VARCHAR(45) DEFAULT NULL,
    userAgent VARCHAR(500) DEFAULT NULL,
    metadata JSON DEFAULT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_actor (actorId, actorType),
    INDEX idx_resource (resourceType, resourceId),
    INDEX idx_action (action),
    INDEX idx_created (createdAt)
);

-- 10. Extend PaymentSessions with gateway fields (safe for re-runs)
-- Using stored procedure to ignore duplicate column errors

DROP PROCEDURE IF EXISTS AddColumnIfNotExists;
DELIMITER //
CREATE PROCEDURE AddColumnIfNotExists()
BEGIN
  DECLARE CONTINUE HANDLER FOR 1060 BEGIN END;
  ALTER TABLE PaymentSessions ADD COLUMN gatewayPaymentId VARCHAR(255) DEFAULT NULL AFTER gatewayOrderId;
  ALTER TABLE PaymentSessions ADD COLUMN gatewaySignature VARCHAR(255) DEFAULT NULL AFTER gatewayPaymentId;
  ALTER TABLE PaymentSessions ADD COLUMN paymentMethod VARCHAR(50) DEFAULT NULL AFTER gatewaySignature;
  ALTER TABLE PaymentSessions ADD COLUMN referenceId VARCHAR(36) DEFAULT NULL AFTER paymentMethod;
  ALTER TABLE PaymentSessions ADD COLUMN referenceType VARCHAR(50) DEFAULT NULL AFTER referenceId;
  ALTER TABLE PaymentSessions ADD COLUMN metadata JSON DEFAULT NULL AFTER referenceType;
END //
DELIMITER ;
CALL AddColumnIfNotExists();
DROP PROCEDURE IF EXISTS AddColumnIfNotExists;

-- 11. Initialize platform-level ledger accounts
INSERT IGNORE INTO LedgerAccounts (id, accountType, ownerId, ownerType, currency)
VALUES
    (UUID(), 'PLATFORM_ESCROW', NULL, 'PLATFORM', 'INR'),
    (UUID(), 'PLATFORM_REVENUE', NULL, 'PLATFORM', 'INR'),
    (UUID(), 'TAX_COLLECTED', NULL, 'PLATFORM', 'INR'),
    (UUID(), 'REFUND_RESERVE', NULL, 'PLATFORM', 'INR');
