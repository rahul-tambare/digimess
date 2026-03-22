const db = require('../config/db');

// GET /api/messes  — list all open messes with optional search
exports.getAllMesses = async (req, res) => {
  try {
    const search = req.query.search ? `%${req.query.search}%` : '%';
    const [rows] = await db.query(
      'SELECT * FROM Messes WHERE isOpen = 1 AND name LIKE ? ORDER BY rating DESC',
      [search]
    );
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// GET /api/messes/:id
exports.getMessById = async (req, res) => {
  try {
    const [mess] = await db.query('SELECT * FROM Messes WHERE id = ?', [req.params.id]);
    if (!mess[0]) return res.status(404).json({ error: 'Mess not found' });
    const [menu] = await db.query('SELECT * FROM Menus WHERE messId = ? AND isAvailable = 1', [req.params.id]);
    res.json({ ...mess[0], menu });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// POST /api/messes  — create (vendors only)
exports.createMess = async (req, res) => {
  try {
    const { name, description, address, images } = req.body;
    const id = require('crypto').randomUUID();
    await db.query(
      'INSERT INTO Messes (id, vendorId, name, description, address, images) VALUES (?, ?, ?, ?, ?, ?)',
      [id, req.user.id, name, description, address, JSON.stringify(images || [])]
    );
    res.status(201).json({ message: 'Mess created', id });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Internal server error' });
  }
};
