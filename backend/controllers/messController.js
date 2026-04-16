const db = require('../config/db');

// GET /api/messes  — list all open messes with optional search
exports.getAllMesses = async (req, res) => {
  try {
    const search = req.query.search ? `%${req.query.search}%` : '%';
    const { userLat, userLng } = req.query;

    let selectClause = `SELECT m.*, ma.line1, ma.line2, ma.city, ma.state, ma.pincode, ma.latitude, ma.longitude`;
    let orderClause = `ORDER BY m.rating DESC`;

    if (userLat && userLng) {
      const lat = parseFloat(userLat);
      const lng = parseFloat(userLng);
      selectClause += `, (6371 * acos(cos(radians(${lat})) * cos(radians(ma.latitude)) * cos(radians(ma.longitude) - radians(${lng})) + sin(radians(${lat})) * sin(radians(ma.latitude)))) AS distanceKm`;
      orderClause = `ORDER BY distanceKm ASC, m.rating DESC`;
    }

    const [rows] = await db.query(
      `${selectClause}
       FROM Messes m LEFT JOIN MessAddresses ma ON m.id = ma.messId
       WHERE m.isOpen = 1 AND m.isApproved = 1 AND m.isActive = 1 AND m.businessStatus = 1 AND m.isDeleted = 0
       AND (m.name LIKE ? OR m.description LIKE ? OR ma.city LIKE ?)
       ${orderClause}`,
      [search, search, search]
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
    const { userLat, userLng } = req.query;
    let selectClause = `SELECT m.*, ma.line1, ma.line2, ma.city, ma.state, ma.pincode, ma.latitude, ma.longitude`;

    if (userLat && userLng) {
      const lat = parseFloat(userLat);
      const lng = parseFloat(userLng);
      selectClause += `, (6371 * acos(cos(radians(${lat})) * cos(radians(ma.latitude)) * cos(radians(ma.longitude) - radians(${lng})) + sin(radians(${lat})) * sin(radians(ma.latitude)))) AS distanceKm`;
    }

    const [mess] = await db.query(
      `${selectClause}
       FROM Messes m LEFT JOIN MessAddresses ma ON m.id = ma.messId
       WHERE m.id = ? AND m.isDeleted = 0`,
      [req.params.id]
    );
    if (!mess[0]) return res.status(404).json({ error: 'Mess not found' });
    const [menu] = await db.query('SELECT * FROM Menus WHERE messId = ? AND isAvailable = 1', [req.params.id]);
    res.json({ ...mess[0], menu });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// POST /api/messes/register — Full vendor mess registration (all fields from oldcode)
exports.registerMess = async (req, res) => {
  try {
    const {
      name, description, messType, category,
      autoConfirm, deliveryAvailable, dineIn, takeAway,
      lunchStartTime, lunchEndTime, dinnerStartTime, dinnerEndTime,
      cuisines, offer1, offer2, offer3,
      deliveryCharge, invoiceFrequency, capacity, deliveryRadius,
      images,
      // Address fields
      line1, line2, city, state, pincode, latitude, longitude
    } = req.body;
    const vendorId = req.user.id;

    // Enforce single mess per provider
    const [existingMess] = await db.query('SELECT id FROM Messes WHERE vendorId = ? AND isDeleted = 0', [vendorId]);
    if (existingMess.length > 0) {
      return res.status(400).json({ error: 'Vendor already has a registered mess' });
    }

    const messId = require('crypto').randomUUID();

    // Insert Mess
    await db.query(
      `INSERT INTO Messes (
        id, vendorId, name, description, messType, category,
        autoConfirm, deliveryAvailable, dineIn, takeAway,
        lunchStartTime, lunchEndTime, dinnerStartTime, dinnerEndTime,
        cuisines, offer1, offer2, offer3,
        deliveryCharge, invoiceFrequency, capacity, deliveryRadius,
        images, businessStatus, isApproved, isOpen
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, TRUE, FALSE, FALSE)`,
      [
        messId, req.user.id, name, description, messType, category,
        autoConfirm || false, deliveryAvailable || false, dineIn || false, takeAway || false,
        lunchStartTime || null, lunchEndTime || null, dinnerStartTime || null, dinnerEndTime || null,
        cuisines, offer1, offer2, offer3,
        deliveryCharge || 0, invoiceFrequency, capacity, deliveryRadius || 5.00,
        JSON.stringify(images || [])
      ]
    );

    // Insert Address if provided
    if (line1 && city && state && pincode) {
      const addrId = require('crypto').randomUUID();
      await db.query(
        `INSERT INTO MessAddresses (id, messId, line1, line2, city, state, pincode, latitude, longitude)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [addrId, messId, line1, line2, city, state, pincode, latitude, longitude]
      );
    }

    res.status(201).json({ message: 'Mess registered successfully', id: messId });
  } catch (e) {
    console.error('Error registering mess:', e);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// GET /api/messes/provider/my-messes (For Providers)
exports.getMyMesses = async (req, res) => {
  try {
    const [messes] = await db.query(
      `SELECT m.*, ma.line1, ma.line2, ma.city, ma.state, ma.pincode, ma.latitude, ma.longitude
       FROM Messes m LEFT JOIN MessAddresses ma ON m.id = ma.messId
       WHERE m.vendorId = ? AND m.isDeleted = 0`,
      [req.user.id]
    );
    res.json(messes);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// PUT /api/messes/:id/settings — Update mess operational settings
exports.updateMessSettings = async (req, res) => {
  try {
    const messId = req.params.id;

    // Verify ownership
    const [messCheck] = await db.query('SELECT id FROM Messes WHERE id = ? AND vendorId = ?', [messId, req.user.id]);
    if (messCheck.length === 0) {
      return res.status(403).json({ error: 'Unauthorized to update this mess' });
    }

    const {
      name, description, messType, category,
      autoConfirm, deliveryAvailable, dineIn, takeAway,
      lunchStartTime, lunchEndTime, dinnerStartTime, dinnerEndTime,
      businessStatus, cuisines, offer1, offer2, offer3,
      deliveryCharge, invoiceFrequency, capacity, deliveryRadius,
      images, isOpen
    } = req.body;

    await db.query(
      `UPDATE Messes SET
        name = COALESCE(?, name), description = COALESCE(?, description),
        messType = COALESCE(?, messType), category = COALESCE(?, category),
        autoConfirm = COALESCE(?, autoConfirm), deliveryAvailable = COALESCE(?, deliveryAvailable),
        dineIn = COALESCE(?, dineIn), takeAway = COALESCE(?, takeAway),
        lunchStartTime = COALESCE(?, lunchStartTime), lunchEndTime = COALESCE(?, lunchEndTime),
        dinnerStartTime = COALESCE(?, dinnerStartTime), dinnerEndTime = COALESCE(?, dinnerEndTime),
        businessStatus = COALESCE(?, businessStatus), cuisines = COALESCE(?, cuisines),
        offer1 = COALESCE(?, offer1), offer2 = COALESCE(?, offer2), offer3 = COALESCE(?, offer3),
        deliveryCharge = COALESCE(?, deliveryCharge), invoiceFrequency = COALESCE(?, invoiceFrequency),
        capacity = COALESCE(?, capacity), deliveryRadius = COALESCE(?, deliveryRadius),
        images = COALESCE(?, images), isOpen = COALESCE(?, isOpen)
       WHERE id = ?`,
      [
        name, description, messType, category,
        autoConfirm, deliveryAvailable, dineIn, takeAway,
        lunchStartTime || null, lunchEndTime || null, dinnerStartTime || null, dinnerEndTime || null,
        businessStatus, cuisines, offer1, offer2, offer3,
        deliveryCharge, invoiceFrequency, capacity, deliveryRadius,
        images ? JSON.stringify(images) : null, isOpen,
        messId
      ]
    );

    res.json({ message: 'Mess settings updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// PUT /api/messes/:id — Basic update (backward compatible)
exports.updateMess = async (req, res) => {
  try {
    const messId = req.params.id;
    const { name, description, address, images, isOpen } = req.body;

    // Verify ownership
    const [messCheck] = await db.query('SELECT id FROM Messes WHERE id = ? AND vendorId = ?', [messId, req.user.id]);
    if (messCheck.length === 0) {
      return res.status(403).json({ error: 'Unauthorized to update this mess' });
    }

    await db.query(
      `UPDATE Messes SET 
        name = COALESCE(?, name),
        description = COALESCE(?, description),
        address = COALESCE(?, address),
        images = COALESCE(?, images),
        isOpen = COALESCE(?, isOpen)
       WHERE id = ?`,
       [name, description, address, images ? JSON.stringify(images) : null, isOpen !== undefined ? isOpen : null, messId]
    );

    res.json({ message: 'Mess updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
