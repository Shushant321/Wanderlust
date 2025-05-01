const express = require('express');
const router = express.Router();
const Listing = require('../models/listing');
const User = require('../models/user');
const { isLoggedIn } = require('../middleware'); // Your auth middleware

// Add to wishlist
router.post('/wishlist/:id', isLoggedIn, async (req, res) => {
  const user = await User.findById(req.user._id);
  const listingId = req.params.id;
  if (!user.wishlist.includes(listingId)) {
    user.wishlist.push(listingId);
    await user.save();
  }
  res.redirect('back');
});

// Remove from wishlist
router.delete('/wishlist/:id', isLoggedIn, async (req, res) => {
  const user = await User.findById(req.user._id);
  user.wishlist = user.wishlist.filter(id => id.toString() !== req.params.id);
  await user.save();
  res.redirect('back');
});

// Show wishlist
router.get('/wishlist', isLoggedIn, async (req, res) => {
  const user = await User.findById(req.user._id).populate('wishlist');
  res.render('listings/wishlist', { wishlist: user.wishlist });
});

module.exports = router;
