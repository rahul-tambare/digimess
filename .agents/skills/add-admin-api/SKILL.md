---
name: add-admin-api
description: Step-by-step guide to add a new admin-only backend endpoint to Digimess
---

# Add a New Admin API Endpoint

All admin routes live under `/api/admin/*` and are **automatically protected**
by the `auth` + `isAdmin` middleware applied in `adminRoutes.js` via
`router.use()`. You never need to add auth middleware per-route.

---

## 1. Choose Where to Put the Logic

| Complexity | Where |
|-----------|-------|
| Simple (1-2 queries, no business logic) | Add method directly to `backend/controllers/adminController.js` |
| Complex (own domain: coupons, plans, reviews) | Create a dedicated `backend/controllers/myFeatureController.js` |

---

## 2. Write the Controller Method

### Read endpoint (list with pagination + search)

```javascript
// backend/controllers/adminController.js  (or a new file)
exports.getMyResources = async (req, res) => {
  try {
    const page   = parseInt(req.query.page) || 1;
    const limit  = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const search = req.query.search || '';

    let where = 'WHERE 1=1';
    const params = [];

    if (search) {
      where += ' AND (name LIKE ? OR email LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    const [[{ total }]] = await db.query(
      `SELECT COUNT(*) AS total FROM MyTable ${where}`, params
    );
    const [rows] = await db.query(
      `SELECT * FROM MyTable ${where} ORDER BY createdAt DESC LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    res.json({ data: rows, total, page, limit });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};
```

### Read endpoint (single item with JOINs)

```javascript
exports.getMyResourceById = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT r.*, u.name AS ownerName, u.phone AS ownerPhone
       FROM MyTable r
       LEFT JOIN Users u ON r.userId = u.id
       WHERE r.id = ?`,
      [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};
```

### Write endpoint (with transaction)

Use transactions whenever you modify **more than one table** or need atomicity:

```javascript
exports.myWriteAction = async (req, res) => {
  const connection = await db.getConnection();
  try {
    const { name, amount } = req.body;
    if (!name) return res.status(400).json({ error: 'name is required' });

    await connection.beginTransaction();

    const id = require('crypto').randomUUID();
    await connection.query(
      'INSERT INTO MyTable (id, name) VALUES (?, ?)', [id, name]
    );
    await connection.query(
      'INSERT INTO RelatedTable (id, myTableId, amount) VALUES (?, ?, ?)',
      [require('crypto').randomUUID(), id, amount]
    );

    await connection.commit();
    res.status(201).json({ message: 'Created', id });
  } catch (err) {
    await connection.rollback();
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  } finally {
    connection.release();
  }
};
```

### Toggle / Patch endpoint (approve, suspend, change role)

```javascript
exports.toggleStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    if (typeof isActive !== 'number' || ![0, 1].includes(isActive)) {
      return res.status(400).json({ error: 'isActive must be 0 or 1' });
    }

    const [result] = await db.query(
      'UPDATE MyTable SET isActive = ? WHERE id = ?', [isActive, id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Not found' });

    res.json({ message: `Status updated to ${isActive ? 'active' : 'inactive'}` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};
```

---

## 3. Register the Route

Add routes to `backend/routes/adminRoutes.js`:

```javascript
// If using adminController directly:
router.get('/my-resource', adminController.getMyResources);
router.get('/my-resource/:id', adminController.getMyResourceById);
router.post('/my-resource', adminController.myWriteAction);
router.patch('/my-resource/:id/status', adminController.toggleStatus);

// If using a dedicated controller:
const myFeatureController = require('../controllers/myFeatureController');
router.get('/my-feature', myFeatureController.getAll);
router.post('/my-feature', myFeatureController.create);
router.put('/my-feature/:id', myFeatureController.update);
router.delete('/my-feature/:id', myFeatureController.remove);
```

> **Do NOT** add `auth` or `requireRole` middleware here — `adminRoutes.js`
> already applies `router.use(auth, adminController.isAdmin)` at the top.

---

## 4. Add Input Validation (recommended)

For endpoints that accept a body, add a Joi schema:

```javascript
// backend/validators/myResourceValidator.js
const Joi = require('joi');

exports.create = Joi.object({
  name: Joi.string().min(1).max(255).required(),
  amount: Joi.number().positive().required(),
});
```

Then use the `validate` middleware inline:

```javascript
const validate = require('../middlewares/validate');
const schema = require('../validators/myResourceValidator');

router.post('/my-resource', validate(schema.create), adminController.myWriteAction);
```

---

## 5. Update Admin Panel Frontend

Add the API wrapper in `admin/src/api/`:

```javascript
// admin/src/api/myResource.js
import client from './client';
export const getAll  = (params) => client.get('/admin/my-resource', { params });
export const getById = (id) => client.get(`/admin/my-resource/${id}`);
export const create  = (data) => client.post('/admin/my-resource', data);
export const update  = (id, data) => client.put(`/admin/my-resource/${id}`, data);
export const remove  = (id) => client.delete(`/admin/my-resource/${id}`);
```

Then follow the `add-admin-page` skill to wire up the page.

---

## Response Format Conventions

| Endpoint Type | Response Shape |
|---------------|----------------|
| **List**      | `{ data: [...], total, page, limit }` |
| **Single**    | `{ id, name, ... }` (flat object) |
| **Create**    | `{ message: 'Created', id }` — status `201` |
| **Update / Patch** | `{ message: 'Updated' }` — status `200` |
| **Delete**    | `{ message: 'Deleted' }` — status `200` |
| **Error**     | `{ error: 'Human-readable message' }` — status `4xx/5xx` |

---

## Common Pitfalls

| Mistake | Fix |
|---------|-----|
| Adding `auth` middleware to individual admin routes | Already applied by `router.use()` in `adminRoutes.js` |
| Using `req.body` without validation on write endpoints | Add Joi schema + `validate()` middleware |
| Returning all rows without pagination | Always accept `page` & `limit` query params on list endpoints |
| JOINing with `userId` when schema uses `customerId` or `vendorId` | Check `schema.sql` for the actual column name |
| Forgetting `connection.release()` after transactions | Always use `try/catch/finally` with `connection.release()` in `finally` |

---

## Checklist

- [ ] Controller method added to `adminController.js` or new controller file
- [ ] Route added to `adminRoutes.js` (no extra auth needed)
- [ ] Joi validator added for write endpoints
- [ ] List endpoints support `page`, `limit`, `search` query params
- [ ] Single-item endpoints return `404` when not found
- [ ] Write endpoints use transactions when touching multiple tables
- [ ] Admin panel API module created in `admin/src/api/`
- [ ] Tested with `curl -H "Authorization: Bearer <token>"` or admin UI
