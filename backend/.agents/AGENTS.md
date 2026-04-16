# Backend — Agent Instructions

## Tech Stack

- **Runtime**: Node.js with CommonJS (`require`)
- **Framework**: Express 5 (note: `app.use(errorHandler)` is the global error handler)
- **Database**: MySQL via `mysql2/promise` — connection pool in `config/db.js`
- **Cache**: Redis via `config/redis.js`
- **Auth**: JWT (`jsonwebtoken`) — middleware in `middlewares/auth.js`
- **Validation**: Joi schemas in `validators/` — middleware in `middlewares/validate.js`
- **Security**: CORS whitelist, rate limiting on auth routes
- **Logging**: Morgan (dev)

## File Organization

```
backend/
  config/        → db.js (MySQL pool), redis.js
  controllers/   → Business logic (one file per resource)
  middlewares/    → auth.js, validate.js, error.js
  models/        → schema.sql (single source of truth for DB schema)
  routes/        → Express routers (one file per resource)
  validators/    → Joi schema definitions
  scripts/       → DB init scripts
  server.js      → App entry point, middleware chain, route registration
```

## Controller Pattern

Every controller function follows this exact pattern:

```javascript
const db = require('../config/db');

exports.doSomething = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM TableName WHERE id = ?', [req.params.id]);
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Internal server error' });
  }
};
```

For transactions (multi-step writes):
```javascript
const connection = await db.getConnection();
try {
  await connection.beginTransaction();
  // ... queries using connection.query() ...
  await connection.commit();
  res.status(201).json({ message: 'Created', data });
} catch (e) {
  await connection.rollback();
  console.error(e);
  res.status(500).json({ error: 'Internal server error' });
} finally {
  connection.release();
}
```

## Route Pattern

```javascript
const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const schema = require('../validators/someValidator');
const controller = require('../controllers/someController');

router.get('/', auth, controller.getAll);
router.post('/', auth, validate(schema.create), controller.create);

module.exports = router;
```

## Validator Pattern

```javascript
const Joi = require('joi');

exports.create = Joi.object({
  name: Joi.string().required(),
  price: Joi.number().positive().required(),
});
```

## Rules

1. **Always use parameterized queries** — never concatenate user input into SQL strings.
2. **Always wrap in try/catch** — log `console.error(e)` and return `{ error }`.
3. **Use `req.user.id`** for the authenticated user's ID (set by auth middleware).
4. **Generate UUIDs** with `require('crypto').randomUUID()` for new records.
5. **Soft deletes** — set `isDeleted = 1, deletedAt = NOW()` instead of DELETE.
6. **Register new routes** in `server.js` after creating the route file.
7. **Check `isDeleted = 0`** in all SELECT queries for soft-delete tables.

## Environment Variables

- `DB_HOST`, `DB_USER`, `DB_PASS`, `DB_NAME`, `DB_SSL`
- `JWT_SECRET` (required — server exits without it)
- `PORT` (default 5000)
- `REDIS_URL`

## Running

```bash
cd backend && npm run dev     # nodemon, auto-restart on changes
cd backend && npm run db:init # init/reset database tables
```
