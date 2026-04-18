/**
 * Permission-checking middleware for admin routes.
 * 
 * Usage:
 *   router.get('/users', requirePermission('users:read'), handler)
 *   router.post('/config', requirePermission('settings:update'), handler)
 * 
 * Super admins bypass all permission checks.
 */
module.exports = (...requiredPermissions) => {
  return (req, res, next) => {
    if (!req.admin) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Super admin bypasses all permission checks
    if (req.admin.isSuperAdmin) {
      return next();
    }

    const hasAll = requiredPermissions.every(p => req.admin.permissions.includes(p));
    if (!hasAll) {
      return res.status(403).json({
        error: 'Forbidden: insufficient permissions',
        required: requiredPermissions,
      });
    }

    next();
  };
};
