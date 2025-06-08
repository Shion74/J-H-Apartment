const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const { testConnection } = require('./config/database');
const { scheduleBillingCycles } = require('./utils/scheduler');
const { startContractExpiryScheduler } = require('./services/contractService');

// Import routes
const authRoutes = require('./routes/authRoutes');
const tenantRoutes = require('./routes/tenantRoutes');
const roomRoutes = require('./routes/roomRoutes');
const branchRoutes = require('./routes/branchRoutes');
const billRoutes = require('./routes/billRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const settingRoutes = require('./routes/settingRoutes');
const receiptRoutes = require('./routes/receiptRoutes');
const depositRoutes = require('./routes/depositRoutes');
const contractRoutes = require('./routes/contractRoutes');

// Load environment variables
dotenv.config();

// Initialize express app
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Serve receipt files
app.use('/receipts', express.static(path.join(__dirname, 'public/receipts')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/tenants', tenantRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/branches', branchRoutes);
app.use('/api/bills', billRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/settings', settingRoutes);
app.use('/api/receipts', receiptRoutes);
app.use('/api/deposits', depositRoutes);
app.use('/api/contracts', contractRoutes);

// Frontend Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'login.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'login.html'));
});

app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'dashboard.html'));
});

app.get('/tenants', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'tenants.html'));
});

app.get('/rooms', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'rooms.html'));
});

app.get('/billing', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'billing.html'));
});

app.get('/settings', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'settings.html'));
});

// Start server
const startServer = async () => {
  try {
    const connected = await testConnection();
    
    if (!connected) {
      console.error('Unable to connect to the database. Please make sure MySQL is running.');
      process.exit(1);
    }
    
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      
      // Start the billing cycle scheduler
      scheduleBillingCycles();
      
      // Start the contract expiry scheduler
      startContractExpiryScheduler();
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer(); 