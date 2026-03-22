const db = require('../config/db');

// GET /api/config
exports.getAppConfig = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT configKey, configValue FROM AppConfig');
    const config = {};
    rows.forEach(row => {
      config[row.configKey] = row.configValue;
    });
    res.json(config);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// GET /api/plans
exports.getSubscriptionPlans = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT p.*, c.name as categoryName 
      FROM SubscriptionPlans p
      LEFT JOIN PlanCategories c ON p.categoryId = c.id
      WHERE p.isActive = TRUE
    `);
    
    // Group by category
    const categories = {};
    rows.forEach(plan => {
      const catName = plan.categoryName || 'Other';
      if (!categories[catName]) {
        categories[catName] = [];
      }
      // Parse benefits JSON if it's a string
      if (typeof plan.benefits === 'string') {
        try {
          plan.benefits = JSON.parse(plan.benefits);
        } catch (e) {
          plan.benefits = [];
        }
      }
      categories[catName].push(plan);
    });
    
    res.json(categories);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Internal server error' });
  }
};
