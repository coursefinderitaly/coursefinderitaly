const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Visitor = require('../models/Visitor');
const User = require('../models/User');
const auth = require('../middleware/auth');
const checkRole = require('../middleware/rbac');

// ─────────────────────────────────────────────
// PUBLIC: Track a new visitor (no auth needed)
// Called silently from the frontend on page load
// ─────────────────────────────────────────────
router.post('/track', async (req, res) => {
  try {
    const rawIp =
      req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
      req.headers['x-real-ip'] ||
      req.socket?.remoteAddress ||
      'unknown';

    // Strip IPv6 prefix if present (e.g. ::ffff:192.168.1.1)
    const ip = rawIp.replace(/^::ffff:/, '');

    const userAgent = req.headers['user-agent'] || '';
    const referrer = req.body?.referrer || 'Direct';
    const page = req.body?.page || '/';

    // ── Parse Browser
    let browser = 'Unknown';
    if (/Edg\//.test(userAgent)) browser = 'Edge';
    else if (/OPR\//.test(userAgent)) browser = 'Opera';
    else if (/Chrome\//.test(userAgent) && !/Chromium/.test(userAgent)) browser = 'Chrome';
    else if (/Firefox\//.test(userAgent)) browser = 'Firefox';
    else if (/Safari\//.test(userAgent) && !/Chrome/.test(userAgent)) browser = 'Safari';
    else if (/Trident\/|MSIE/.test(userAgent)) browser = 'Internet Explorer';
    else if (/Chromium/.test(userAgent)) browser = 'Chromium';

    // ── Parse OS
    let os = 'Unknown';
    if (/Windows NT 10/.test(userAgent)) os = 'Windows 10/11';
    else if (/Windows NT 6\.3/.test(userAgent)) os = 'Windows 8.1';
    else if (/Windows NT 6\.1/.test(userAgent)) os = 'Windows 7';
    else if (/Windows/.test(userAgent)) os = 'Windows';
    else if (/iPhone/.test(userAgent)) os = 'iOS (iPhone)';
    else if (/iPad/.test(userAgent)) os = 'iOS (iPad)';
    else if (/Android/.test(userAgent)) os = 'Android';
    else if (/Mac OS X/.test(userAgent)) os = 'macOS';
    else if (/Linux/.test(userAgent)) os = 'Linux';

    // ── Parse Device
    let device = 'Desktop';
    if (/Mobile/.test(userAgent)) {
      if (/iPhone/.test(userAgent)) {
        device = 'iPhone';
      } else if (/Android/.test(userAgent)) {
        const match = userAgent.match(/Android\s+[^;]+;\s+([^;)]+)/);
        device = match && match[1] ? match[1].trim() : 'Android Phone';
      } else {
        device = 'Mobile Device';
      }
    } else if (/Tablet|iPad/.test(userAgent)) {
      device = /iPad/.test(userAgent) ? 'iPad' : 'Tablet';
    } else {
      if (/Macintosh/.test(userAgent)) {
        device = 'Mac';
      } else if (/Windows NT/.test(userAgent)) {
        device = 'Windows PC';
      } else if (/Linux/.test(userAgent)) {
        device = 'Linux PC';
      } else {
        device = 'Desktop';
      }
    }

    // ── Geo lookup (ip-api.com — free, no API key needed)
    let country = 'Unknown', city = 'Unknown', regionName = '', isp = '';
    const isPrivate = /^(10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.|127\.|::1$|localhost)/.test(ip);
    
    // Skip recording local network visits (localhost and private IPv4/IPv6 addresses)
    if (isPrivate || ip === '127.0.0.1' || ip === '::1' || ip === 'localhost') {
      return res.status(200).json({ ok: true, message: 'Local network/development visits are not recorded.' });
    }

    if (!isPrivate && ip !== 'unknown') {
      try {
        const geoRes = await fetch(`http://ip-api.com/json/${ip}?fields=country,city,regionName,isp,status`);
        if (geoRes.ok) {
          const geo = await geoRes.json();
          if (geo.status === 'success') {
            country = geo.country || 'Unknown';
            city = geo.city || 'Unknown';
            regionName = geo.regionName || '';
            isp = geo.isp || '';
          }
        }
      } catch (geoErr) {
        // Geo lookup failed — proceed without location data
      }
    } else if (isPrivate) {
      country = 'Local Network';
      city = 'Localhost';
    }

    // ── Check if logged-in user is tracking
    let userId = null;
    let userName = '';
    let userRole = '';
    let userEmail = '';

    const token = (req.cookies && req.cookies.token) || req.header('x-auth-token') || req.header('Authorization')?.replace('Bearer ', '');
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded && decoded.id) {
          const user = await User.findById(decoded.id).lean();
          if (user) {
            userId = user._id;
            userName = `${user.firstName} ${user.lastName || ''}`.trim();
            userRole = user.role;
            userEmail = user.email;
          }
        }
      } catch (jwtErr) {
        // Invalid or expired token — ignore silently
      }
    }

    // Skip recording admin page views/analytics to keep logs focused on public visitors
    if (userRole === 'admin') {
      return res.status(200).json({ ok: true, message: 'Admin visits are not recorded.' });
    }

    await Visitor.create({
      ip,
      userAgent,
      browser,
      os,
      device,
      page,
      referrer,
      country,
      city,
      regionName,
      isp,
      user: userId,
      userName,
      userEmail,
      userRole
    });
    res.status(201).json({ ok: true });
  } catch (err) {
    console.error('[Visitor track error]', err.message);
    res.status(500).json({ ok: false });
  }
});

// ─────────────────────────────────────────────
// ADMIN: Get visitor logs (auth required)
// ─────────────────────────────────────────────
router.use(auth, checkRole(['admin']));

router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 100;
    const skip = (page - 1) * limit;
    const { date } = req.query;

    const query = {};
    if (date) {
      // Date format is YYYY-MM-DD
      const startOfTarget = new Date(`${date}T00:00:00`);
      const endOfTarget = new Date(`${date}T23:59:59.999`);
      query.createdAt = { $gte: startOfTarget, $lte: endOfTarget };
    }

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(startOfToday);
    startOfWeek.setDate(startOfToday.getDate() - startOfToday.getDay());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [visitors, total, todayCount, weekCount, monthCount] = await Promise.all([
      Visitor.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Visitor.countDocuments(query),
      Visitor.countDocuments({ createdAt: { $gte: startOfToday } }),
      Visitor.countDocuments({ createdAt: { $gte: startOfWeek } }),
      Visitor.countDocuments({ createdAt: { $gte: startOfMonth } }),
    ]);

    res.json({ visitors, total, todayCount, weekCount, monthCount, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    console.error('[Visitor fetch error]', err.message);
    res.status(500).json({ error: 'Failed to fetch visitor data' });
  }
});

// ADMIN: Delete all visitor logs
router.delete('/clear', async (req, res) => {
  try {
    await Visitor.deleteMany({});
    res.json({ message: 'All visitor logs cleared' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to clear visitor logs' });
  }
});

module.exports = router;
