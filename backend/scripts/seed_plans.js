/**
 * Seed SubscriptionPlans and PlanCategories
 * Run: node scripts/seed_plans.js
 */
const db = require('../config/db');
const crypto = require('crypto');

async function seed() {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    // Ensure columns exist (migration)
    try {
      await connection.query('ALTER TABLE Subscriptions ADD COLUMN planId VARCHAR(36) DEFAULT NULL');
    } catch (e) { /* column may already exist */ }
    try {
      await connection.query('ALTER TABLE Subscriptions ADD COLUMN totalMeals INT NOT NULL DEFAULT 0');
    } catch (e) { /* column may already exist */ }

    // Clear existing plans (idempotent)
    await connection.query('DELETE FROM SubscriptionPlans');
    await connection.query('DELETE FROM PlanCategories');

    // Categories
    const catMeal = crypto.randomUUID();
    const catPro = crypto.randomUUID();

    await connection.query(
      'INSERT INTO PlanCategories (id, name) VALUES (?, ?), (?, ?)',
      [catMeal, 'Meal Plans', catPro, 'Pro Plans']
    );

    // Plans
    const plans = [
      {
        id: crypto.randomUUID(),
        categoryId: catMeal,
        name: 'Weekly Thali',
        description: 'Perfect for trying out a mess for a week.',
        price: 699,
        mealsCount: 7,
        benefits: JSON.stringify(['7 meals (1/day)', 'Free delivery', 'Veg & Non-veg options']),
      },
      {
        id: crypto.randomUUID(),
        categoryId: catMeal,
        name: 'Bi-Weekly Plan',
        description: 'Great value for two weeks of home-cooked meals.',
        price: 1249,
        mealsCount: 14,
        benefits: JSON.stringify(['14 meals (1/day)', 'Free delivery', 'Skip any day', 'Priority support']),
      },
      {
        id: crypto.randomUUID(),
        categoryId: catMeal,
        name: 'Monthly Full Board',
        description: 'Our most popular plan — a full month of meals.',
        price: 2499,
        mealsCount: 30,
        benefits: JSON.stringify(['30 meals (1/day)', 'Free delivery', 'Weekend specials', 'Priority support', '10% wallet bonus']),
      },
      {
        id: crypto.randomUUID(),
        categoryId: catPro,
        name: 'Monthly Pro (2x)',
        description: 'Two meals a day for the serious subscriber.',
        price: 3999,
        mealsCount: 60,
        benefits: JSON.stringify(['60 meals (2/day)', 'Free delivery', 'All cuisine access', 'VIP support', '15% savings']),
      },
    ];

    for (const p of plans) {
      await connection.query(
        'INSERT INTO SubscriptionPlans (id, categoryId, name, description, price, mealsCount, benefits) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [p.id, p.categoryId, p.name, p.description, p.price, p.mealsCount, p.benefits]
      );
    }

    await connection.commit();
    console.log('✅ Seeded PlanCategories and SubscriptionPlans successfully');
    console.log(`   ${plans.length} plans across 2 categories`);
  } catch (e) {
    await connection.rollback();
    console.error('Seeding failed:', e);
  } finally {
    connection.release();
    process.exit(0);
  }
}

seed();
