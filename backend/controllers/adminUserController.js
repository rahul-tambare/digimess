/**
 * Admin User Management Controller
 */
const db = require('../config/db');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

exports.getAdminUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const search = req.query.search || '';

    let where = 'WHERE 1=1';
    const params = [];

    if (search) {
      where += ' AND (a.name LIKE ? OR a.email LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    const [[{ total }]] = await db.query(
      `SELECT COUNT(*) AS total FROM AdminUsers a ${where}`, params
    );

    const [rows] = await db.query(`
      SELECT a.id, a.name, a.email, a.isActive, a.lastLoginAt, a.createdAt,
             r.id AS roleId, r.name AS roleName, r.isSuperAdmin
      FROM AdminUsers a
      JOIN Roles r ON a.roleId = r.id
      ${where}
      ORDER BY a.createdAt DESC
      LIMIT ? OFFSET ?
    `, [...params, limit, offset]);

    res.json({
      data: rows,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error retrieving admin users' });
  }
};

exports.getAdminUserById = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT a.id, a.name, a.email, a.isActive, a.lastLoginAt, a.createdAt, a.updatedAt,
             r.id AS roleId, r.name AS roleName, r.isSuperAdmin
      FROM AdminUsers a
      JOIN Roles r ON a.roleId = r.id
      WHERE a.id = ?
    `, [req.params.id]);

    if (rows.length === 0) return res.status(404).json({ error: 'Admin user not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error retrieving admin user' });
  }
};

exports.createAdminUser = async (req, res) => {
  try {
    const { name, email, password, roleId } = req.body;

    if (!name || !email || !password || !roleId) {
      return res.status(400).json({ error: 'name, email, password, and roleId are required' });
    }

    // Validate email uniqueness
    const [existing] = await db.query('SELECT id FROM AdminUsers WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(409).json({ error: 'An admin with this email already exists' });
    }

    // Validate role exists
    const [roleRows] = await db.query('SELECT id FROM Roles WHERE id = ? AND isActive = 1', [roleId]);
    if (roleRows.length === 0) {
      return res.status(400).json({ error: 'Invalid or inactive role' });
    }

    const hash = await bcrypt.hash(password, 12);
    const id = crypto.randomUUID();

    await db.query(
      'INSERT INTO AdminUsers (id, name, email, password, roleId) VALUES (?, ?, ?, ?, ?)',
      [id, name.trim(), email.trim().toLowerCase(), hash, roleId]
    );

    res.status(201).json({ message: 'Admin user created', id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error creating admin user' });
  }
};

exports.updateAdminUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, roleId, isActive } = req.body;

    const [rows] = await db.query('SELECT * FROM AdminUsers WHERE id = ?', [id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Admin user not found' });

    // If changing email, check uniqueness
    if (email && email.trim().toLowerCase() !== rows[0].email) {
      const [dup] = await db.query('SELECT id FROM AdminUsers WHERE email = ? AND id != ?', [email.trim().toLowerCase(), id]);
      if (dup.length > 0) {
        return res.status(409).json({ error: 'An admin with this email already exists' });
      }
    }

    // If changing role, validate it
    if (roleId) {
      const [roleRows] = await db.query('SELECT id FROM Roles WHERE id = ? AND isActive = 1', [roleId]);
      if (roleRows.length === 0) {
        return res.status(400).json({ error: 'Invalid or inactive role' });
      }
    }

    // Prevent deactivating the last super admin
    if (isActive === false || isActive === 0) {
      const [adminRole] = await db.query(`
        SELECT r.isSuperAdmin FROM AdminUsers a
        JOIN Roles r ON a.roleId = r.id
        WHERE a.id = ?
      `, [id]);
      if (adminRole[0]?.isSuperAdmin) {
        const [[{ count }]] = await db.query(`
          SELECT COUNT(*) as count FROM AdminUsers a
          JOIN Roles r ON a.roleId = r.id
          WHERE r.isSuperAdmin = 1 AND a.isActive = 1 AND a.id != ?
        `, [id]);
        if (count === 0) {
          return res.status(403).json({ error: 'Cannot deactivate the last active super admin' });
        }
      }
    }

    const updates = [];
    const params = [];

    if (name !== undefined) { updates.push('name = ?'); params.push(name.trim()); }
    if (email !== undefined) { updates.push('email = ?'); params.push(email.trim().toLowerCase()); }
    if (roleId !== undefined) { updates.push('roleId = ?'); params.push(roleId); }
    if (isActive !== undefined) { updates.push('isActive = ?'); params.push(isActive ? 1 : 0); }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    params.push(id);
    await db.query(`UPDATE AdminUsers SET ${updates.join(', ')} WHERE id = ?`, params);

    res.json({ message: 'Admin user updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error updating admin user' });
  }
};

exports.deleteAdminUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Prevent self-delete
    if (req.admin.id === id) {
      return res.status(403).json({ error: 'You cannot delete your own account' });
    }

    const [rows] = await db.query(`
      SELECT a.*, r.isSuperAdmin FROM AdminUsers a
      JOIN Roles r ON a.roleId = r.id
      WHERE a.id = ?
    `, [id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Admin user not found' });

    // Prevent deleting the last super admin
    if (rows[0].isSuperAdmin) {
      const [[{ count }]] = await db.query(`
        SELECT COUNT(*) as count FROM AdminUsers a
        JOIN Roles r ON a.roleId = r.id
        WHERE r.isSuperAdmin = 1 AND a.id != ?
      `, [id]);
      if (count === 0) {
        return res.status(403).json({ error: 'Cannot delete the last super admin' });
      }
    }

    await db.query('DELETE FROM AdminUsers WHERE id = ?', [id]);
    res.json({ message: 'Admin user deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error deleting admin user' });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { password } = req.body;

    if (!password || password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const [rows] = await db.query('SELECT id FROM AdminUsers WHERE id = ?', [id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Admin user not found' });

    const hash = await bcrypt.hash(password, 12);
    await db.query('UPDATE AdminUsers SET password = ? WHERE id = ?', [hash, id]);

    res.json({ message: 'Password reset successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error resetting password' });
  }
};
