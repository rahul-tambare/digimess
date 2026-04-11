const db = require('../config/db');

exports.getCharges = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM AdminCharges WHERE isActive = 1');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error retrieving charges' });
  }
};

exports.getAllCharges = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM AdminCharges');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error retrieving charges' });
  }
};

exports.createCharge = async (req, res) => {
  const { name, type, amount, appliesTo } = req.body;
  try {
    const [result] = await db.query(
      'INSERT INTO AdminCharges (name, type, amount, appliesTo) VALUES (?, ?, ?, ?)',
      [name, type, amount, appliesTo || 'order']
    );
    res.status(201).json({ id: result.insertId, message: 'Charge created successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error creating charge' });
  }
};

exports.updateCharge = async (req, res) => {
  const { id } = req.params;
  const { name, type, amount, appliesTo, isActive } = req.body;
  try {
    await db.query(
      'UPDATE AdminCharges SET name = ?, type = ?, amount = ?, appliesTo = ?, isActive = ? WHERE id = ?',
      [name, type, amount, appliesTo, isActive, id]
    );
    res.json({ message: 'Charge updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error updating charge' });
  }
};

exports.deleteCharge = async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('DELETE FROM AdminCharges WHERE id = ?', [id]);
    res.json({ message: 'Charge deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error deleting charge' });
  }
};
