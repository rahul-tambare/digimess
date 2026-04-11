require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

// Critical security check
if (!process.env.JWT_SECRET) {
  console.error('FATAL: JWT_SECRET is not defined in .env');
  process.exit(1);
}

const db = require('./config/db');
require('./config/redis');

const app = express();

app.use(helmet());
const allowedOrigins = [
  'https://rahultambare.click',
  'http://rahultambare.click',
  'https://www.rahultambare.click',
  'http://www.rahultambare.click',
  'https://admin.rahultambare.click',
  'http://admin.rahultambare.click',
  'http://localhost:5173', // for local testing
  'http://10.128.30.26:19006', // Expo web local IP
  'http://10.128.30.26:19000', // Expo native local IP
  'http://10.128.30.26:8081',  // Expo dev tools / new bundler
  'http://10.128.30.26:3000',  // React local IP
  'http://10.128.30.26:5173'   // Vite local IP
];

app.use(cors({
  origin: function (origin, callback) {
    // allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true
}));
app.use(express.json());
app.use(morgan('dev'));

// Rate limiting for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: { error: 'Too many requests, please try again later.' }
});

// Routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const messRoutes = require('./routes/messRoutes');
const menuRoutes = require('./routes/menuRoutes');
const orderRoutes = require('./routes/orderRoutes');
const walletRoutes = require('./routes/walletRoutes');
const configRoutes = require('./routes/configRoutes');
const adminRoutes = require('./routes/adminRoutes');
const addressRoutes = require('./routes/addressRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const invoiceRoutes = require('./routes/invoiceRoutes');

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/messes', messRoutes);
app.use('/api/menus', menuRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api', configRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/user/addresses', addressRoutes);
app.use('/api/orders/:id/review', reviewRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/invoices', invoiceRoutes);

// Health check
app.get('/', (req, res) => res.json({ status: 'Digi Mess API is running 🍱' }));

// Global error handling
const errorHandler = require('./middlewares/error');
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
