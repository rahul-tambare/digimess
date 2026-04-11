const db = require('../config/db');

exports.getFAQs = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM FAQs WHERE isActive = 1 ORDER BY displayOrder ASC, createdAt DESC');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error retrieving FAQs' });
  }
};

exports.getAllFAQs = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM FAQs ORDER BY displayOrder ASC, createdAt DESC');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error retrieving FAQs' });
  }
};

exports.createFAQ = async (req, res) => {
  const { question, answer, category, displayOrder } = req.body;
  try {
    const [result] = await db.query(
      'INSERT INTO FAQs (question, answer, category, displayOrder) VALUES (?, ?, ?, ?)',
      [question, answer, category, displayOrder || 0]
    );
    res.status(201).json({ id: result.insertId, message: 'FAQ created successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error creating FAQ' });
  }
};

exports.updateFAQ = async (req, res) => {
  const { id } = req.params;
  const { question, answer, category, displayOrder, isActive } = req.body;
  try {
    await db.query(
      'UPDATE FAQs SET question = ?, answer = ?, category = ?, displayOrder = ?, isActive = ? WHERE id = ?',
      [question, answer, category, displayOrder, isActive, id]
    );
    res.json({ message: 'FAQ updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error updating FAQ' });
  }
};

exports.deleteFAQ = async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('DELETE FROM FAQs WHERE id = ?', [id]);
    res.json({ message: 'FAQ deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error deleting FAQ' });
  }
};
