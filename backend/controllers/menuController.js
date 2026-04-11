const db = require('../config/db');
const { v4: uuidv4 } = require('uuid');

// POST /api/menus - Add a new menu item
exports.addMenuItem = async (req, res) => {
  try {
    const { messId, itemName, itemDescription, price, isVeg, calories, category, images } = req.body;
    
    // Ensure the vendor owns this mess
    const [messCheck] = await db.query('SELECT id FROM Messes WHERE id = ? AND vendorId = ?', [messId, req.user.id]);
    if (messCheck.length === 0) {
      return res.status(403).json({ error: 'You are not authorized to add items to this mess.' });
    }

    const id = uuidv4();
    await db.query(
      'INSERT INTO Menus (id, messId, itemName, itemDescription, price, isVeg, calories, category, images) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [id, messId, itemName, itemDescription, price, typeof isVeg === 'boolean' ? isVeg : true, calories || null, category || null, JSON.stringify(images || [])]
    );

    res.status(201).json({ message: 'Menu item added successfully', id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// PUT /api/menus/:id - Update an existing menu item
exports.updateMenuItem = async (req, res) => {
  try {
    const { itemName, itemDescription, price, isAvailable, isVeg, calories, category, images } = req.body;
    const menuId = req.params.id;

    // Verify ownership
    const [menuCheck] = await db.query(
      'SELECT m.id FROM Menus m JOIN Messes ms ON m.messId = ms.id WHERE m.id = ? AND ms.vendorId = ?', 
      [menuId, req.user.id]
    );

    if (menuCheck.length === 0) {
      return res.status(403).json({ error: 'Unauthorized to modify this menu item.' });
    }

    await db.query(
      `UPDATE Menus SET 
        itemName = COALESCE(?, itemName),
        itemDescription = COALESCE(?, itemDescription),
        price = COALESCE(?, price),
        isAvailable = COALESCE(?, isAvailable),
        isVeg = COALESCE(?, isVeg),
        calories = COALESCE(?, calories),
        category = COALESCE(?, category),
        images = COALESCE(?, images)
       WHERE id = ?`,
       [
         itemName, 
         itemDescription, 
         price, 
         isAvailable !== undefined ? isAvailable : null, 
         isVeg !== undefined ? isVeg : null, 
         calories, 
         category, 
         images ? JSON.stringify(images) : null, 
         menuId
       ]
    );

    res.json({ message: 'Menu item updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// DELETE /api/menus/:id - Delete a menu item
exports.deleteMenuItem = async (req, res) => {
  try {
    const menuId = req.params.id;

    // Verify ownership
    const [menuCheck] = await db.query(
      'SELECT m.id FROM Menus m JOIN Messes ms ON m.messId = ms.id WHERE m.id = ? AND ms.vendorId = ?', 
      [menuId, req.user.id]
    );

    if (menuCheck.length === 0) {
      return res.status(403).json({ error: 'Unauthorized to delete this menu item.' });
    }

    await db.query('DELETE FROM Menus WHERE id = ?', [menuId]);
    res.json({ message: 'Menu item deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// GET /api/menus/mess/:messId - Get all menu items for a mess (with vendor auth viewing all, customer viewing only available)
exports.getMessMenu = async (req, res) => {
  try {
    const { messId } = req.params;
    let query = 'SELECT * FROM Menus WHERE messId = ?';
    
    // If user is a customer, only show available items (this route can be open if we want, or token-based)
    if (!req.user || req.user.role === 'customer') {
      query += ' AND isAvailable = 1';
    }

    const [menus] = await db.query(query, [messId]);
    res.json(menus);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
