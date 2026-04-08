const express = require('express');
const axios = require('axios');
const router = express.Router();
const auth = require('../middleware/auth');

const path = require('path');
const fs = require('fs');
const xlsx = require('xlsx');

router.get('/', auth, async (req, res) => {
  try {
    const filePath = path.join(__dirname, '../../courses.xlsx');
    
    // Check if file exists to prevent hard crashes
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "courses.xlsx file not found on server" });
    }

    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0]; 
    const sheetData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: "" });

    res.json(sheetData);
  } catch (error) {
    console.error("Error reading local Excel file:", error.message);
    res.status(500).json({ error: "Failed to parse local courses data" });
  }
});

module.exports = router;
