/**
 * Audit Logging Service for Digimess.
 * Logs all financial and administrative actions to the AuditLogs table.
 */

const db = require('../config/db');

/**
 * Log an auditable action.
 * @param {string|null} actorId - ID of the user/admin/webhook performing the action
 * @param {'SYSTEM'|'ADMIN'|'USER'|'WEBHOOK'} actorType
 * @param {string} action - e.g. 'payment.created', 'settlement.completed', 'bank_details.updated'
 * @param {string|null} resourceType - e.g. 'PAYMENT', 'SETTLEMENT', 'ORDER', 'BANK_DETAILS'
 * @param {string|null} resourceId
 * @param {object} [options={}]
 * @param {object} [options.previousState] - State before the action
 * @param {object} [options.newState] - State after the action
 * @param {object} [options.metadata] - Additional context
 * @param {object} [options.req] - Express request object (for IP and user agent)
 * @param {object} [options.connection] - MySQL connection (if inside a transaction)
 */
async function logAudit(actorId, actorType, action, resourceType, resourceId, options = {}) {
  try {
    const { previousState, newState, metadata, req, connection } = options;

    const ipAddress = req
      ? req.headers['x-forwarded-for'] || req.socket?.remoteAddress || null
      : null;
    const userAgent = req ? req.headers['user-agent'] || null : null;

    const query = `
      INSERT INTO AuditLogs (actorId, actorType, action, resourceType, resourceId, previousState, newState, ipAddress, userAgent, metadata)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      actorId || null,
      actorType,
      action,
      resourceType || null,
      resourceId || null,
      previousState ? JSON.stringify(previousState) : null,
      newState ? JSON.stringify(newState) : null,
      ipAddress,
      userAgent ? userAgent.substring(0, 500) : null,
      metadata ? JSON.stringify(metadata) : null,
    ];

    if (connection) {
      await connection.query(query, params);
    } else {
      await db.query(query, params);
    }
  } catch (error) {
    // Audit logging should never break the main flow
    console.error('[AuditService] Failed to log audit:', error.message);
  }
}

module.exports = { logAudit };
