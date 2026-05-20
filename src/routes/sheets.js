const express = require('express');
const axios = require('axios');
const router = express.Router();
const auth = require('../middleware/auth');

// This acts as a proxy to hide the Apps Script URL from the client
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbydE8Mw77TYC_e9vMYxWEXTLZvZQRfstl3eNgp3G1bCHyNw-hScNVpCuUx_6VPevDwIZw/exec";

router.get('/', auth, async (req, res) => {
  try {
    const response = await axios.get(APPS_SCRIPT_URL);
    res.json(response.data);
  } catch (error) {
    console.error("Error fetching from Apps Script proxy:", error.message);
    res.status(500).json({ error: "Failed to fetch data from remote script source" });
  }
});

module.exports = router;
