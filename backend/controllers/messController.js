const db = require('../config/db');

// GET /api/messes  — list all open messes with optional search
exports.getAllMesses = async (req, res) => {
  try {
    const { userLat, userLng, search, type, diet, delivery, distance, price, mealTime, page = 1, limit = 10 } = req.query;
    const offset = (Math.max(1, parseInt(page)) - 1) * parseInt(limit);
    const parsedLimit = parseInt(limit);

    let selectClause = `SELECT m.*, ma.line1, ma.line2, ma.city, ma.state, ma.pincode, ma.latitude, ma.longitude`;
    let orderClause = `ORDER BY m.rating DESC`;
    
    const queryParams = [];

    // Base WHERE (only include messes with at least one active thali or menu item)
    let whereClause = `WHERE m.isOpen = 1 AND m.isApproved = 1 AND m.isActive = 1 AND m.businessStatus = 1 AND m.isDeleted = 0 
      AND (
        EXISTS (SELECT 1 FROM Thalis t WHERE t.messId = m.id AND t.isAvailable = 1 AND t.isSubscriptionThali = 0) OR 
        EXISTS (SELECT 1 FROM Menus mu WHERE mu.messId = m.id AND mu.isAvailable = 1) OR
        EXISTS (SELECT 1 FROM Thalis t2 WHERE t2.messId = m.id AND t2.isAvailable = 1)
      )`;

    if (search) {
      whereClause += ` AND (m.name LIKE ? OR m.description LIKE ? OR m.cuisines LIKE ? OR m.category LIKE ? OR ma.city LIKE ?)`;
      const searchParam = `%${search}%`;
      queryParams.push(searchParam, searchParam, searchParam, searchParam, searchParam);
    }

    if (type) {
      if (type.toLowerCase() === 'veg only' || type.toLowerCase() === 'veg') {
        whereClause += ` AND m.messType = 'Veg'`;
      } else if (type.toLowerCase() === 'non-veg') {
        whereClause += ` AND m.messType = 'Non-Veg'`;
      } else if (type.toLowerCase() === 'both') {
        whereClause += ` AND m.messType = 'Both'`;
      }
    }

    if (delivery) {
      if (delivery === 'Home Delivery') {
        whereClause += ` AND m.deliveryAvailable = 1`;
      } else if (delivery === 'Self Pickup') {
        whereClause += ` AND m.takeAway = 1`;
      } else if (delivery === 'Dine-in') {
        whereClause += ` AND m.dineIn = 1`;
      }
    }

    if (diet) {
      whereClause += ` AND m.cuisines LIKE ?`;
      queryParams.push(`%${diet}%`);
    }

    if (price) {
      if (price === 'Under ₹100') {
        whereClause += ` AND EXISTS (SELECT 1 FROM Thalis t WHERE t.messId = m.id AND t.price < 100)`;
      } else if (price === '₹100 - ₹200') {
        whereClause += ` AND EXISTS (SELECT 1 FROM Thalis t WHERE t.messId = m.id AND t.price BETWEEN 100 AND 200)`;
      } else if (price === '₹200+') {
        whereClause += ` AND EXISTS (SELECT 1 FROM Thalis t WHERE t.messId = m.id AND t.price > 200)`;
      }
    }

    if (mealTime) {
      if (mealTime === 'breakfast') {
        whereClause += ` AND (m.category LIKE '%Breakfast%' OR m.cuisines LIKE '%Breakfast%' OR m.messType = 'Veg' OR EXISTS (SELECT 1 FROM Thalis t WHERE t.messId = m.id AND t.mealTime = 'Breakfast'))`;
      } else if (mealTime === 'lunch') {
        whereClause += ` AND (m.lunchStartTime IS NOT NULL OR m.category LIKE '%Thali%' OR EXISTS (SELECT 1 FROM Thalis t WHERE t.messId = m.id AND (t.mealTime = 'Lunch' OR t.mealTime = 'All Day')))`;
      } else if (mealTime === 'dinner') {
        whereClause += ` AND (m.dinnerStartTime IS NOT NULL OR m.category LIKE '%Thali%' OR EXISTS (SELECT 1 FROM Thalis t WHERE t.messId = m.id AND (t.mealTime = 'Dinner' OR t.mealTime = 'All Day')))`;
      }
    }

    let havingClause = ``;

    if (userLat && userLng) {
      const lat = parseFloat(userLat);
      const lng = parseFloat(userLng);
      selectClause += `, (CASE 
          WHEN ma.latitude IS NOT NULL AND ma.latitude != 0 
          THEN (6371 * acos(cos(radians(${lat})) * cos(radians(ma.latitude)) * cos(radians(ma.longitude) - radians(${lng})) + sin(radians(${lat})) * sin(radians(ma.latitude)))) 
          ELSE NULL 
        END) AS distanceKm`;
      
      orderClause = `ORDER BY distanceKm ASC, m.rating DESC`;

      if (distance) {
        let maxDist = 5; // default
        if (distance.includes('1 km')) maxDist = 1;
        if (distance.includes('2 km')) maxDist = 2;
        if (distance.includes('5 km')) maxDist = 5;
        
        havingClause = `HAVING distanceKm <= ? OR distanceKm IS NULL`;
        queryParams.push(maxDist);
      }
    }

    const finalQuery = `
      ${selectClause}
      FROM Messes m LEFT JOIN MessAddresses ma ON m.id = ma.messId
      ${whereClause}
      ${havingClause}
      ${orderClause}
      LIMIT ? OFFSET ?
    `;

    queryParams.push(parsedLimit, offset);

    const [rows] = await db.query(finalQuery, queryParams);
    
    // Send array, length tells client if there's more.
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
      selectClause += `, (CASE 
          WHEN ma.latitude IS NOT NULL AND ma.latitude != 0 
          THEN (6371 * acos(cos(radians(${lat})) * cos(radians(ma.latitude)) * cos(radians(ma.longitude) - radians(${lng})) + sin(radians(${lat})) * sin(radians(ma.latitude)))) 
          ELSE NULL 
        END) AS distanceKm`;
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
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, TRUE, TRUE, TRUE)`,
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
