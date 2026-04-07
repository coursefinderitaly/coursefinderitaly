require('dns').setServers(['8.8.8.8']);
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const next = require('next');

const dev = process.env.NODE_ENV !== 'production';
const nextApp = next({ dev, dir: __dirname });
const handle = nextApp.getRequestHandler();

const PORT = process.env.PORT || 5000;

nextApp.prepare().then(async () => {
  const app = express();

  // CORS Configuration
  app.use(cors({
    origin: [process.env.FRONTEND_URL || 'http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175', 'http://localhost:5176'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'x-csrf-protected', 'x-auth-token']
  }));

  // Security Middleware
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "https://res.cloudinary.com"],
        connectSrc: [
          "'self'",
          process.env.FRONTEND_URL || 'http://localhost:5173',
          'http://localhost:5174', 'http://localhost:5175', 'http://localhost:5176',
          "https://script.google.com"
        ],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: [],
      },
    },
  }));

  app.use(express.json({ limit: '50mb' }));
  app.use(cookieParser());

  // Custom CSRF Protection Middleware
  app.use((req, res, next) => {
    const mutatingMethods = ['POST', 'PUT', 'DELETE', 'PATCH'];
    if (mutatingMethods.includes(req.method)) {
      if (req.headers['x-csrf-protected'] !== '1') {
        return res.status(403).json({ error: 'CSRF Violation: Protected header missing' });
      }
    }
    next();
  });

  // Custom NoSQL Injection Prevention Middleware
  app.use((req, res, next) => {
    const sanitize = (obj) => {
      if (obj instanceof Object) {
        for (let key in obj) {
          if (/^\$/.test(key)) {
            delete obj[key];
          } else {
            sanitize(obj[key]);
          }
        }
      }
    };
    if (req.body) sanitize(req.body);
    if (req.params) sanitize(req.params);
    if (req.headers) sanitize(req.headers);
    next();
  });

  // Rate Limiting for auth routes
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: { error: 'Too many requests from this IP, please try again later' }
  });
  app.use('/api/auth/login', authLimiter);
  app.use('/api/auth/partner-request', authLimiter);

  // Connect to MongoDB
  if (!process.env.MONGO_URI) {
    console.error("FATAL ERROR: MONGO_URI is completely undefined.");
  }

  try {
    await mongoose.connect(process.env.MONGO_URI || '', { serverSelectionTimeoutMS: 5000 });
    console.log('Connected to database');
    
    // Auto-seed Initial Admin User
    try {
      const User = require('./src/models/User');
      const bcrypt = require('bcrypt');
      const adminExists = await User.findOne({ email: 'admin@example.com' });
      if (!adminExists) {
        const hashedPassword = await bcrypt.hash('Admin@123', 10);
        await User.create({
          firstName: 'System',
          lastName: 'Admin',
          phone: '0000000000',
          email: 'admin@example.com',
          password: hashedPassword,
          role: 'admin'
        });
        console.log('--- SYSTEM ADMIN CREATED AUTOMATICALLY ---');
      }
    } catch (adminErr) {
      console.log('Admin seeding skipped:', adminErr.message);
    }

    try {
      await mongoose.connection.collection('users').dropIndex('username_1');
      console.log('Stale username index dropped.');
    } catch (e) { /* index may not exist */ }
  } catch (err) {
    console.log('Database connection error:', err);
  }

  // Route setup — these are your original CommonJS Express routers
  app.use('/api/auth', require('./src/routes/auth'));
  app.use('/api/erp', require('./src/routes/erp'));
  app.use('/api/upload', require('./src/routes/upload'));
  app.use('/api/send-student-docs', require('./src/routes/studentDocs'));
  app.use('/api/admin', require('./src/routes/admin'));
  app.use('/api/sheets', require('./src/routes/sheets'));

  // Serve static React Frontend builds
  app.use(express.static(path.join(__dirname, '../React/dist')));

  // SPA Catch-all: Route all non-API requests to the React index.html
  app.get(/^\/(?!api).*/, (req, res) => {
    res.sendFile(path.join(__dirname, '../React/dist/index.html'));
  });

  // Start server
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}).catch(err => {
  console.error('Failed to start Next.js server:', err);
  process.exit(1);
});
