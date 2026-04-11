const redisClient = require('../config/redis');
const db = require('../config/db');
const jwt = require('jsonwebtoken');

// Helper to generate a 6 digit OTP
const generateOTP = () => '111111'; // Hardcoded for testing

exports.sendOTP = async (req, res) => {
    try {
        const { phone } = req.body;
        if (!phone) return res.status(400).json({ error: 'Phone number is required' });

        // Generate OTP
        const otp = generateOTP(); 

        // Save OTP to Redis with an expiration of 5 minutes (300 seconds)
        await redisClient.setEx(`otp:${phone}`, 300, otp);

        // TODO: In production, integrate an SMS gateway here to send `otp` to `phone`
        console.log(`[DEV ONLY] OTP for ${phone} is ${otp}`);

        res.status(200).json({ message: 'OTP sent successfully' });
    } catch (error) {
        console.error('Error sending OTP:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.verifyOTP = async (req, res) => {
    try {
        const { phone, otp } = req.body;
        if (!phone || !otp) return res.status(400).json({ error: 'Phone and OTP are required' });

        // Master OTP bypass for testing
        if (otp === '111111') {
          console.log(`[DEBUG] Master OTP used for ${phone}`);
        } else {
          // Retrieve OTP from Redis
          const cachedOTP = await redisClient.get(`otp:${phone}`);

          if (!cachedOTP || cachedOTP !== otp) {
              return res.status(400).json({ error: 'Invalid or expired OTP' });
          }
          // OTP is valid. Delete it to prevent reuse
          await redisClient.del(`otp:${phone}`);
        }

        // Check if user exists in the database
        const [rows] = await db.query('SELECT * FROM Users WHERE phone = ?', [phone]);
        let user = rows[0];

        // If user doesn't exist, create one
        if (!user) {
            const uuid = require('crypto').randomUUID();
            await db.query(
                `INSERT INTO Users (id, phone, isVerified, walletBalance) VALUES (?, ?, ?, ?)`,
                [uuid, phone, true, 1000.00] // Gift 1000 for testing
            );
            const [newRows] = await db.query('SELECT * FROM Users WHERE id = ?', [uuid]);
            user = newRows[0];
        }

        // Generate JWT
        const token = jwt.sign(
            { id: user.id, phone: user.phone, role: user.role },
            process.env.JWT_SECRET || 'supersecretjwtkey_digital_mess',
            { expiresIn: '7d' }
        );

        res.status(200).json({
            message: 'OTP verified successfully',
            token,
            user: {
                id: user.id,
                phone: user.phone,
                name: user.name,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Error verifying OTP:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

const bcrypt = require('bcryptjs');

exports.adminLogin = async (req, res) => {
    try {
        const { email, password } = req.body;
        
        const [rows] = await db.query('SELECT * FROM Users WHERE email = ? AND role = "admin"', [email]);
        let adminUser = rows[0];

        // For first-time setup: if no admin exists, we'll create one with hashed 'admin123'
        if (!adminUser) {
            const uuid = require('crypto').randomUUID();
            const hashedPassword = await bcrypt.hash('admin123', 10);
            await db.query(
                `INSERT INTO Users (id, phone, name, email, password, role, isVerified) VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [uuid, '0000000000', 'System Admin', email, hashedPassword, 'admin', true]
            );
            const [newRows] = await db.query('SELECT * FROM Users WHERE id = ?', [uuid]);
            adminUser = newRows[0];
        }

        // Compare password if adminUser has a password field
        const isMatch = await bcrypt.compare(password, adminUser.password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { id: adminUser.id, phone: adminUser.phone, role: adminUser.role },
            process.env.JWT_SECRET || 'supersecretjwtkey_digital_mess',
            { expiresIn: '7d' }
        );

        res.status(200).json({
            message: 'Admin login successful',
            token,
            user: {
                id: adminUser.id,
                email: adminUser.email,
                name: adminUser.name,
                role: adminUser.role
            }
        });

    } catch (err) {
        console.error('Admin login error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};
