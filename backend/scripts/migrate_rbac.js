/**
 * RBAC Migration & Seed Script
 * 
 * Creates Roles, Permissions, RolePermissions, AdminUsers tables
 * Seeds default Super Admin role, all permissions, and migrates
 * the existing admin user from Users table into AdminUsers.
 * 
 * Safe to run multiple times (idempotent).
 */
require('dotenv').config();
const db = require('../config/db');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const DEFAULT_PERMISSIONS = [
  { module: 'dashboard', action: 'read', description: 'View dashboard statistics' },
  { module: 'users', action: 'read', description: 'View customer/vendor users' },
  { module: 'users', action: 'update', description: 'Edit customer/vendor users & wallets' },
  { module: 'messes', action: 'read', description: 'View messes' },
  { module: 'messes', action: 'update', description: 'Approve/toggle mess status' },
  { module: 'orders', action: 'read', description: 'View orders' },
  { module: 'subscriptions', action: 'read', description: 'View subscriptions' },
  { module: 'revenue', action: 'read', description: 'View revenue & transactions' },
  { module: 'settings', action: 'read', description: 'View app settings (FAQs, charges, coupons, config)' },
  { module: 'settings', action: 'update', description: 'Modify app settings' },
  { module: 'admins', action: 'read', description: 'View admin users' },
  { module: 'admins', action: 'create', description: 'Create admin users' },
  { module: 'admins', action: 'update', description: 'Edit admin users' },
  { module: 'admins', action: 'delete', description: 'Delete admin users' },
  { module: 'roles', action: 'read', description: 'View roles & permissions' },
  { module: 'roles', action: 'create', description: 'Create roles' },
  { module: 'roles', action: 'update', description: 'Edit roles & assign permissions' },
  { module: 'roles', action: 'delete', description: 'Delete roles' },
];

async function migrate() {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    console.log('🔧 Creating RBAC tables...');

    // 1. Create tables
    await connection.query(`
      CREATE TABLE IF NOT EXISTS Roles (
        id VARCHAR(36) PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE,
        description TEXT,
        isSuperAdmin TINYINT(1) DEFAULT 0,
        isActive TINYINT(1) DEFAULT 1,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS Permissions (
        id VARCHAR(36) PRIMARY KEY,
        module VARCHAR(100) NOT NULL,
        action VARCHAR(100) NOT NULL,
        slug VARCHAR(200) NOT NULL UNIQUE,
        description TEXT,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS RolePermissions (
        roleId VARCHAR(36) NOT NULL,
        permissionId VARCHAR(36) NOT NULL,
        PRIMARY KEY (roleId, permissionId),
        FOREIGN KEY (roleId) REFERENCES Roles(id) ON DELETE CASCADE,
        FOREIGN KEY (permissionId) REFERENCES Permissions(id) ON DELETE CASCADE
      )
    `);

    await connection.query(`
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
      )
    `);

    console.log('✅ Tables created');

    // 2. Seed Super Admin role
    const [existingRoles] = await connection.query('SELECT id FROM Roles WHERE name = ?', ['Super Admin']);
    let superAdminRoleId;
    if (existingRoles.length === 0) {
      superAdminRoleId = crypto.randomUUID();
      await connection.query(
        'INSERT INTO Roles (id, name, description, isSuperAdmin) VALUES (?, ?, ?, ?)',
        [superAdminRoleId, 'Super Admin', 'Full system access. Cannot be deleted.', 1]
      );
      console.log('✅ Super Admin role created');
    } else {
      superAdminRoleId = existingRoles[0].id;
      console.log('ℹ️  Super Admin role already exists');
    }

    // 3. Seed permissions
    console.log('🔧 Seeding permissions...');
    const permissionIds = [];
    for (const perm of DEFAULT_PERMISSIONS) {
      const slug = `${perm.module}:${perm.action}`;
      const [existing] = await connection.query('SELECT id FROM Permissions WHERE slug = ?', [slug]);
      if (existing.length === 0) {
        const id = crypto.randomUUID();
        await connection.query(
          'INSERT INTO Permissions (id, module, action, slug, description) VALUES (?, ?, ?, ?, ?)',
          [id, perm.module, perm.action, slug, perm.description]
        );
        permissionIds.push(id);
      } else {
        permissionIds.push(existing[0].id);
      }
    }
    console.log(`✅ ${DEFAULT_PERMISSIONS.length} permissions seeded`);

    // 4. Assign ALL permissions to Super Admin role
    for (const permId of permissionIds) {
      await connection.query(
        'INSERT IGNORE INTO RolePermissions (roleId, permissionId) VALUES (?, ?)',
        [superAdminRoleId, permId]
      );
    }
    console.log('✅ All permissions assigned to Super Admin');

    // 5. Migrate existing admin from Users table into AdminUsers
    const [existingAdmins] = await connection.query('SELECT id FROM AdminUsers LIMIT 1');
    if (existingAdmins.length === 0) {
      const [adminRows] = await connection.query(
        'SELECT id, name, email, password FROM Users WHERE role = "admin" AND email IS NOT NULL LIMIT 1'
      );
      if (adminRows.length > 0) {
        const admin = adminRows[0];
        await connection.query(
          'INSERT INTO AdminUsers (id, name, email, password, roleId) VALUES (?, ?, ?, ?, ?)',
          [admin.id, admin.name || 'System Admin', admin.email, admin.password, superAdminRoleId]
        );
        console.log(`✅ Migrated existing admin "${admin.email}" to AdminUsers table`);
      } else {
        // No existing admin — create a default one
        const hash = await bcrypt.hash('admin123', 10);
        await connection.query(
          'INSERT INTO AdminUsers (id, name, email, password, roleId) VALUES (?, ?, ?, ?, ?)',
          [crypto.randomUUID(), 'System Admin', 'admin@digimess.com', hash, superAdminRoleId]
        );
        console.log('✅ Created default admin: admin@digimess.com / admin123');
      }
    } else {
      console.log('ℹ️  AdminUsers already populated, skipping migration');
    }

    await connection.commit();
    console.log('\n🎉 RBAC migration complete!');
  } catch (err) {
    await connection.rollback();
    console.error('❌ Migration failed:', err.message);
    throw err;
  } finally {
    connection.release();
    process.exit(0);
  }
}

migrate();
