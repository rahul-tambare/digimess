/**
 * RBAC Controller — Roles & Permissions management
 */
const db = require('../config/db');
const crypto = require('crypto');

// ─── ROLES ──────────────────────────────────────────────

exports.getRoles = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT r.*, 
        (SELECT COUNT(*) FROM RolePermissions WHERE roleId = r.id) as permissionCount,
        (SELECT COUNT(*) FROM AdminUsers WHERE roleId = r.id) as userCount
      FROM Roles r
      ORDER BY r.isSuperAdmin DESC, r.createdAt ASC
    `);
    res.json({ data: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error retrieving roles' });
  }
};

exports.getRoleById = async (req, res) => {
  try {
    const [roles] = await db.query('SELECT * FROM Roles WHERE id = ?', [req.params.id]);
    if (roles.length === 0) return res.status(404).json({ error: 'Role not found' });

    const [permissions] = await db.query(`
      SELECT p.* FROM RolePermissions rp
      JOIN Permissions p ON rp.permissionId = p.id
      WHERE rp.roleId = ?
      ORDER BY p.module, p.action
    `, [req.params.id]);

    res.json({ ...roles[0], permissions });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error retrieving role' });
  }
};

exports.createRole = async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Role name is required' });
    }

    // Check uniqueness
    const [existing] = await db.query('SELECT id FROM Roles WHERE name = ?', [name.trim()]);
    if (existing.length > 0) {
      return res.status(409).json({ error: 'A role with this name already exists' });
    }

    const id = crypto.randomUUID();
    await db.query(
      'INSERT INTO Roles (id, name, description) VALUES (?, ?, ?)',
      [id, name.trim(), description || null]
    );

    res.status(201).json({ message: 'Role created', id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error creating role' });
  }
};

exports.updateRole = async (req, res) => {
  try {
    const { name, description, isActive } = req.body;
    const { id } = req.params;

    const [rows] = await db.query('SELECT * FROM Roles WHERE id = ?', [id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Role not found' });
    if (rows[0].isSuperAdmin) {
      return res.status(403).json({ error: 'Cannot modify the Super Admin role' });
    }

    // Check name uniqueness if changing
    if (name && name.trim() !== rows[0].name) {
      const [dup] = await db.query('SELECT id FROM Roles WHERE name = ? AND id != ?', [name.trim(), id]);
      if (dup.length > 0) {
        return res.status(409).json({ error: 'A role with this name already exists' });
      }
    }

    await db.query(
      'UPDATE Roles SET name = COALESCE(?, name), description = COALESCE(?, description), isActive = COALESCE(?, isActive) WHERE id = ?',
      [name?.trim() || null, description !== undefined ? description : null, isActive !== undefined ? (isActive ? 1 : 0) : null, id]
    );

    res.json({ message: 'Role updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error updating role' });
  }
};

exports.deleteRole = async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await db.query('SELECT * FROM Roles WHERE id = ?', [id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Role not found' });
    if (rows[0].isSuperAdmin) {
      return res.status(403).json({ error: 'Cannot delete the Super Admin role' });
    }

    // Check for active admin users with this role
    const [[{ count }]] = await db.query('SELECT COUNT(*) as count FROM AdminUsers WHERE roleId = ?', [id]);
    if (count > 0) {
      return res.status(409).json({
        error: `Cannot delete role: ${count} admin user(s) still assigned to this role. Reassign them first.`
      });
    }

    await db.query('DELETE FROM Roles WHERE id = ?', [id]);
    res.json({ message: 'Role deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error deleting role' });
  }
};

// ─── PERMISSIONS ────────────────────────────────────────

exports.getPermissions = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM Permissions ORDER BY module, action');

    // Group by module for easy frontend consumption
    const grouped = {};
    for (const perm of rows) {
      if (!grouped[perm.module]) grouped[perm.module] = [];
      grouped[perm.module].push(perm);
    }

    res.json({ data: rows, grouped });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error retrieving permissions' });
  }
};

// ─── PERMISSION ASSIGNMENT ──────────────────────────────

exports.assignPermissions = async (req, res) => {
  const { id: roleId } = req.params;
  const { permissionIds } = req.body;
  const connection = await db.getConnection();

  try {
    // Validate role
    const [roles] = await connection.query('SELECT * FROM Roles WHERE id = ?', [roleId]);
    if (roles.length === 0) return res.status(404).json({ error: 'Role not found' });
    if (roles[0].isSuperAdmin) {
      return res.status(403).json({ error: 'Cannot modify Super Admin permissions' });
    }

    if (!Array.isArray(permissionIds)) {
      return res.status(400).json({ error: 'permissionIds must be an array' });
    }

    await connection.beginTransaction();

    // Replace all permissions for this role
    await connection.query('DELETE FROM RolePermissions WHERE roleId = ?', [roleId]);

    if (permissionIds.length > 0) {
      const values = permissionIds.map(pid => [roleId, pid]);
      await connection.query(
        'INSERT INTO RolePermissions (roleId, permissionId) VALUES ?',
        [values]
      );
    }

    await connection.commit();
    res.json({ message: 'Permissions updated', count: permissionIds.length });
  } catch (err) {
    await connection.rollback();
    console.error(err);
    res.status(500).json({ error: 'Server error assigning permissions' });
  } finally {
    connection.release();
  }
};
