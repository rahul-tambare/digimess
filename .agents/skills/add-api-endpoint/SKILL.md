---
name: add-api-endpoint
description: Step-by-step guide to add a new REST API endpoint to the Digimess backend
---

# Add a New REST API Endpoint

Follow these steps to add a new API endpoint end-to-end.

## 1. Define the Joi Validator (if needed)

Create or update a file in `backend/validators/`:

```javascript
// backend/validators/myResourceValidator.js
const Joi = require('joi');

exports.create = Joi.object({
  name: Joi.string().required(),
  // ... other fields
});
```

## 2. Create the Controller

Create a file in `backend/controllers/`:

```javascript
// backend/controllers/myResourceController.js
const db = require('../config/db');

exports.create = async (req, res) => {
  try {
    const { name } = req.body;
    const id = require('crypto').randomUUID();
    await db.query('INSERT INTO MyTable (id, name) VALUES (?, ?)', [id, name]);
    res.status(201).json({ message: 'Created', id });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.getAll = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM MyTable WHERE isDeleted = 0');
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Internal server error' });
  }
};
```

## 3. Create the Route File

Create a file in `backend/routes/`:

```javascript
// backend/routes/myResourceRoutes.js
const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const schema = require('../validators/myResourceValidator');
const controller = require('../controllers/myResourceController');

router.get('/', auth, controller.getAll);
router.post('/', auth, validate(schema.create), controller.create);

module.exports = router;
```

## 4. Register the Route in server.js

Add these two lines to `backend/server.js`:

```javascript
// In the "Routes" imports section:
const myResourceRoutes = require('./routes/myResourceRoutes');

// In the app.use() section:
app.use('/api/my-resource', myResourceRoutes);
```

## 5. Update Schema (if new table)

If this needs a new table, add the CREATE TABLE statement to `backend/models/schema.sql` and run the init script:

```bash
cd backend && npm run db:init
```

## 6. Update Frontend Service Layer

If provider or consumer apps need to call this endpoint, add it to the appropriate service file:

- **Provider**: `provider/src/services/api.ts`
- **Consumer**: Create or update a service file in `consumer/` (currently using direct fetch in stores)

## Checklist

- [ ] Validator created/updated in `validators/`
- [ ] Controller created in `controllers/`
- [ ] Route file created in `routes/`
- [ ] Route registered in `server.js`
- [ ] Schema updated if needed
- [ ] Frontend service updated if needed
- [ ] Tested with curl or frontend
