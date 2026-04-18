/**
 * Admin Authentication Middleware
 * 
 * Verifies JWT, loads admin user from AdminUsers table,
 * attaches role + permissions to req.admin.
 */
const jwt = require('jsonwebtoken');
const db = require('../config/db');

module.exports = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: missing token' });
  }

  const token = authHeader.split(' ')[1];
  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  try {
    // Load admin user with role info
    const [rows] = await db.query(
      `SELECT a.id, a.name, a.email, a.isActive,
              r.id AS roleId, r.name AS roleName, r.isSuperAdmin
       FROM AdminUsers a
       JOIN Roles r ON a.roleId = r.id
       WHERE a.id = ?`,
      [decoded.id]
    );

    if (rows.length === 0 || !rows[0].isActive) {
      return res.status(401).json({ error: 'Admin account not found or disabled' });
    }

    const admin = rows[0];

    // Load permissions for this role
    const [permRows] = await db.query(
      `SELECT p.slug
       FROM RolePermissions rp
       JOIN Permissions p ON rp.permissionId = p.id
       WHERE rp.roleId = ?`,
      [admin.roleId]
    );

    req.admin = {
      id: admin.id,
      name: admin.name,
      email: admin.email,
      role: {
        id: admin.roleId,
        name: admin.roleName,
      },
      isSuperAdmin: !!admin.isSuperAdmin,
      permissions: permRows.map(r => r.slug),
    };

    next();
  } catch (err) {
    console.error('AdminAuth middleware error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};
