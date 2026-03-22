require('dotenv').config();
const db = require('./config/db');
const { v4: uuidv4 } = require('uuid');

async function seed() {
  console.log('Seeding Database...');
  
  // Create a dummy vendor user
  const vendorId = uuidv4();
  await db.query(`INSERT IGNORE INTO Users (id, phone, name, email, role) VALUES (?, '9999999999', 'Vendor Master', 'vendor@digimess.com', 'vendor')`, [vendorId]);

  // Seed Messes
  const messes = [
    { id: uuidv4(), vendorId, name: "Mother's Grace Mess", description: "Authentic home-style cooking", address: "123 Food Street", rating: 4.8, images: ['https://lh3.googleusercontent.com/aida-public/AB6AXuARse548jnqIF3gWSn50MekIIBJ-8BwSJ1HBTJ90o_7XoMgvTYJ55WDWaYRzvGQbDBb2KpEBMh0HnRTied_3QRpkUfHhzSIpL-piq0aNV3h_W0y7ESL_iPinl4t1TAGiL4XbKh_nkFVdNztcpe7fVeC3jzmM53ZpRx3fXooimZE2qg-U58_kzb22c_hXCCqLUnNLEuEMvW7DYQ-5SoDjZtXH9sMp5I1flqhdZNad093r1F_Jqhavk62a1F5UsIzDs8w4uMhyhMNz3s'] },
    { id: uuidv4(), vendorId, name: "Sahyadri Kitchen", description: "Maharashtrian", address: "45 Pune Rd", rating: 4.6, images: ['https://lh3.googleusercontent.com/aida-public/AB6AXuDqxcSf_4KTxeFl1-nCqttGqZKhRy8MT-wYZGAIvJ3xNv-Ym1Q2wMWyiy-j8ltfR51ZddLBFsiuhpIKUuywT9v7N-p2OYHn9IMrliotqEH6H_-9RY9evG9_ZPNogR2k5z1DHzBBHzhxaBIPdfYPzxlLmv6tNtOswrr7cWfAdPgc2T0lVJiWBAXTVU094c2aKYvoWLdp7TjhtN93cSIPXcCa__3VloMZdjP2zNPOyAe9jipDmieg2VeQyQ4bJUmzeLhPi_sDkwrdKXw'] },
    { id: uuidv4(), vendorId, name: "The Royal Tiffin", description: "Multicuisine", address: "78 King St", rating: 4.9, images: ['https://lh3.googleusercontent.com/aida-public/AB6AXuBo6NWplYNo3nlje6HtSMvB6DOR6wmbhNt8AHghW7lj3G03DAQAs2dVGAnMkQ5ywOefZd10l2-jEEJdKBu_nZ2ZceZ4EdwJOWtJg1RfJwwDffUGEBHGxxZXqCfwUvV3UjPCfvH26cMCHehNWmxhV7wdE5pM5PbZFOSgW8RyfwKfzloi1RAvtkCM1_ff0glpaO9_CJafivPJj76ZQFAc2h-HxaUm8O6HL9EsafLuUIM0BIzvYKLUV_6Xz1MT1feE0TIKI2EPRIfETuo'] },
  ];

  for (const m of messes) {
    await db.query(`INSERT IGNORE INTO Messes (id, vendorId, name, description, address, rating, images) VALUES (?, ?, ?, ?, ?, ?, ?)`, 
      [m.id, m.vendorId, m.name, m.description, m.address, m.rating, JSON.stringify(m.images)]);
      
    // Seed Menu Items for each mess
    await db.query(`INSERT IGNORE INTO Menus (id, messId, itemName, itemDescription, price) VALUES (?, ?, 'Standard Thali', '2 Roti, Rice, Dal, Sabzi', 120.00)`, [uuidv4(), m.id]);
    await db.query(`INSERT IGNORE INTO Menus (id, messId, itemName, itemDescription, price) VALUES (?, ?, 'Premium Thali', '3 Roti, Rice, Dal, Paneer Sabzi, Sweet', 150.00)`, [uuidv4(), m.id]);
  }

  // Seed Plan Categories
  const catStdId = uuidv4();
  const catPrmId = uuidv4();
  await db.query('INSERT IGNORE INTO PlanCategories (id, name) VALUES (?, ?)', [catStdId, 'Standard']);
  await db.query('INSERT IGNORE INTO PlanCategories (id, name) VALUES (?, ?)', [catPrmId, 'Premium']);

  // Seed Subscription Plans
  await db.query(`INSERT IGNORE INTO SubscriptionPlans (id, categoryId, name, description, price, mealsCount, benefits) VALUES (?, ?, ?, ?, ?, ?, ?)`, 
    [uuidv4(), catStdId, 'Standard Monthly', 'Exclusive to Annapurna', 3400.00, 26, JSON.stringify(["✓ 26 Lunch or Dinner Thalis", "✓ Priority delivery (Sub-30 mins)", "✓ Cancel or Pause anytime"])]);
  
  await db.query(`INSERT IGNORE INTO SubscriptionPlans (id, categoryId, name, description, price, mealsCount, benefits) VALUES (?, ?, ?, ?, ?, ?, ?)`, 
    [uuidv4(), catPrmId, 'Flexible Bundle', 'Mix & match with other kitchens', 4200.00, 30, JSON.stringify(["✓ Mix & match with other kitchens", "✓ Exclusive to Annapurna", "✓ Weekly treats"])]);

  // Seed App Config
  const configs = [
    { key: 'heroTitle', val: 'Monthly Subscription' },
    { key: 'heroSubtitle', val: 'Get unlimited access to premium home-cooked meals starting at just ₹199/month. Save 40% on daily dining.' },
    { key: 'currencySymbol', val: '₹' },
    { key: 'heroImage', val: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBqAqgZ1KKpVBjNKgGyrpc36_z2qrJ1CTimpnFwSG_mI0aS70qYteToXy6NLZXdCVVOXsjwv-VdRL8WV-z8aO4VJN3tGVjug9lOU8CYMse1pB4h_grrPDydpJFplDDTBxSZJMMPAf8TLSZdBkGEZzasdQM8_V9AcnzLIagFJw4uatBd_G5BF-q_dpBFfCmW-ueXeLhEHaTlYHHz1k_-bCNajtWtWEwo2cZn358gdp7QZFsV512yKnBdWpPyizH1UwaCo2WKeXKRyn0' }
  ];

  for (const c of configs) {
    await db.query('INSERT INTO AppConfig (configKey, configValue) VALUES (?, ?) ON DUPLICATE KEY UPDATE configValue = ?', [c.key, c.val, c.val]);
  }
  
  console.log('Seed completed!');
  process.exit();
}

seed().catch(err => {
  console.error(err);
  process.exit(1);
});
