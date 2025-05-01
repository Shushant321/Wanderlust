// routes/search.js
const express = require('express');
const router = express.Router();
const Listing = require('../models/listing');

// Example: Suggest location or title matches (case-insensitive, starts with)
router.get('/suggest', async (req, res) => {
  const q = req.query.q || '';
  if (!q) return res.json([]);
  // You can search by location, title, or both
  const regex = new RegExp('^' + q, 'i');
  const suggestions = await Listing.find({
    $or: [
      { location: { $regex: regex } },
      { title: { $regex: regex } }
    ]
  })
  .limit(5)
  .select('location title -_id');
  // Return unique suggestions
  const results = [...new Set(suggestions.map(s => s.location || s.title))];
  res.json(results);
});

module.exports = router;
