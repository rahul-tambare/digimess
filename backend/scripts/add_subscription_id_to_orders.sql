-- Migration: Add subscriptionId to Orders table for subscription order tracking
-- Run this against your database to add the new column

ALTER TABLE Orders ADD COLUMN subscriptionId VARCHAR(36) DEFAULT NULL AFTER specialNote;
ALTER TABLE Orders ADD CONSTRAINT fk_orders_subscription FOREIGN KEY (subscriptionId) REFERENCES Subscriptions(id) ON DELETE SET NULL;
