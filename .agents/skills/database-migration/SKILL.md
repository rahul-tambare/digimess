---
name: database-migration
description: Step-by-step guide to modify the Digimess database schema safely
---

# Database Schema Migration

Follow these steps to add or alter tables in the Digimess MySQL database.

## 1. Update the Schema File

Edit `backend/models/schema.sql` to add the new table or modify an existing one.

### For a New Table

```sql
CREATE TABLE IF NOT EXISTS MyTable (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    someField TEXT,
    isActive TINYINT(1) DEFAULT 1,
    isDeleted TINYINT(1) DEFAULT 0,
    deletedAt DATETIME DEFAULT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (relatedId) REFERENCES OtherTable(id) ON DELETE CASCADE
);
```

### Conventions

- Primary key: `id VARCHAR(36)` (UUID)
- Always include: `createdAt`, `updatedAt`
- Soft-delete tables include: `isDeleted TINYINT(1) DEFAULT 0`, `deletedAt DATETIME DEFAULT NULL`
- Foreign keys: use `ON DELETE CASCADE` or `ON DELETE SET NULL` as appropriate
- ENUM values: use for fixed sets (e.g., status, type)
- JSON columns: for arrays/objects (e.g., `items JSON`, `images JSON`)

## 2. Run the Init Script

For local development:

```bash
cd backend && npm run db:init
```

This runs `backend/scripts/init_db.js` which creates tables from the schema.

## 3. For Existing Tables (ALTER)

If modifying an existing table, the schema.sql alone won't apply changes to existing tables (it uses `CREATE TABLE IF NOT EXISTS`). You need to:

1. Update `schema.sql` to reflect the final desired state
2. Run the ALTER TABLE manually or add it to a migration script:

```sql
-- Run manually against the database
ALTER TABLE ExistingTable ADD COLUMN newColumn VARCHAR(255) DEFAULT NULL;
```

Or create a script:

```javascript
// backend/scripts/migrate_add_column.js
const db = require('../config/db');

async function migrate() {
  try {
    await db.query('ALTER TABLE ExistingTable ADD COLUMN newColumn VARCHAR(255) DEFAULT NULL');
    console.log('Migration complete');
  } catch (e) {
    if (e.code === 'ER_DUP_FIELDNAME') {
      console.log('Column already exists, skipping');
    } else {
      throw e;
    }
  }
  process.exit(0);
}

migrate();
```

## 4. Update Controllers

Update or create controllers to use the new schema. Remember:
- Use `crypto.randomUUID()` for new IDs
- Use parameterized queries: `db.query('SELECT * FROM MyTable WHERE id = ?', [id])`
- Check `isDeleted = 0` in SELECT queries

## 5. Update Frontend

If the schema change affects existing API responses, update the frontend type definitions and components accordingly.

## Checklist

- [ ] `backend/models/schema.sql` updated with final desired schema
- [ ] ALTER TABLE run for existing tables (if needed)
- [ ] `backend/scripts/init_db.js` run for new tables
- [ ] Controllers updated to use new columns/tables
- [ ] Frontend types updated if API responses changed
- [ ] Tested locally with real database
