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
        const otp = process.env.NODE_ENV === 'development' ? '123456' : generateOTP(); // For testing, static OTP in dev

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

        // Retrieve OTP from Redis
        const cachedOTP = await redisClient.get(`otp:${phone}`);

        if (!cachedOTP || cachedOTP !== otp) {
            return res.status(400).json({ error: 'Invalid or expired OTP' });
        }

        // OTP is valid. Delete it to prevent reuse
        await redisClient.del(`otp:${phone}`);

        // Check if user exists in the database
        const [rows] = await db.query('SELECT * FROM Users WHERE phone = ?', [phone]);
        let user = rows[0];

        // If user doesn't exist, create one
        if (!user) {
            const uuid = require('crypto').randomUUID();
            await db.query(
                `INSERT INTO Users (id, phone, isVerified) VALUES (?, ?, ?)`,
                [uuid, phone, true]
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
