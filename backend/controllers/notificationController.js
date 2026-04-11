const db = require('../config/db');
const { Expo } = require('expo-server-sdk');

// Create a new Expo SDK client
let expo = new Expo();

exports.registerDevice = async (req, res) => {
  const { fcmToken, deviceType } = req.body;
  const userId = req.user.id;
  try {
    const [existing] = await db.query('SELECT id FROM DeviceRegistration WHERE userId = ? AND fcmToken = ?', [userId, fcmToken]);
    if (existing.length > 0) {
      await db.query('UPDATE DeviceRegistration SET lastUsed = NOW() WHERE id = ?', [existing[0].id]);
    } else {
      await db.query(
        'INSERT INTO DeviceRegistration (userId, fcmToken, deviceType, lastUsed) VALUES (?, ?, ?, NOW())',
        [userId, fcmToken, deviceType]
      );
    }
    res.json({ message: 'Device registered successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error registering device' });
  }
};

exports.getNotificationLogs = async (req, res) => {
  const userId = req.user.id;
  try {
    const [logs] = await db.query('SELECT * FROM NotificationLogs WHERE userId = ? ORDER BY createdAt DESC LIMIT 50', [userId]);
    res.json(logs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error retrieving notification logs' });
  }
};

// Utility function to send notifications and log them to DB
exports.sendPushNotification = async (userId, title, body, data = {}) => {
  try {
    // 1. Log to database
    await db.query(
      'INSERT INTO NotificationLogs (userId, title, body, data) VALUES (?, ?, ?, ?)',
      [userId, title, body, JSON.stringify(data)]
    );

    // 2. Fetch user's registered devices
    const [devices] = await db.query('SELECT fcmToken FROM DeviceRegistration WHERE userId = ?', [userId]);
    if (devices.length === 0) return; // No devices registered

    const messages = [];
    for (const device of devices) {
      const pushToken = device.fcmToken;
      if (!Expo.isExpoPushToken(pushToken)) {
        console.error(`Push token ${pushToken} is not a valid Expo push token`);
        continue;
      }
      messages.push({
        to: pushToken,
        sound: 'default',
        title,
        body,
        data,
      });
    }

    // 3. Send chunks via Expo
    const chunks = expo.chunkPushNotifications(messages);
    for (const chunk of chunks) {
      try {
        await expo.sendPushNotificationsAsync(chunk);
      } catch (error) {
        console.error('Error sending push chunk:', error);
      }
    }
  } catch (err) {
    console.error('Failed to send push notification:', err);
  }
};
