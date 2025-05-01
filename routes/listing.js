const express = require("express");
const router = express.Router();  
const wrapAsync = require("../utils/wrapAsync.js");
const Listing = require("../models/listing.js");
const {isOwner, isLoggedIn , validateListing} = require("../middleware.js");
const listingController = require("../controllers/listing.js");
const multer = require("multer");
const { storage } = require("../cloudConfig.js");
const upload = multer({ storage }); 

// Search bar - keep this FIRST
router.get('/search', wrapAsync(async (req, res) => {
  const { location, guests, price } = req.query;
  let query = {};
  if (location) query.location = { $regex: location, $options: 'i' };
  if (guests) query.maxGuests = { $gte: Number(guests) };
  if (price) query.price = { $lte: Number(price) };
  const listings = await Listing.find(query);
  res.render('listings/index', { allListings: listings  , page: 'listings'});
}));

// Index & Create
router.route("/")
  .get(wrapAsync(listingController.index))
  .post(isLoggedIn, upload.single("listing[image]"), validateListing, wrapAsync(listingController.createListing));

// New Route
router.get("/new", isLoggedIn, listingController.newListing);

// Edit Route
router.get("/:id/edit", isLoggedIn, isOwner, wrapAsync(listingController.editListing));

// Show, Update, Delete
router.route("/:id")
  .get(wrapAsync(listingController.showListing))
  .put(isLoggedIn, isOwner, upload.single("listing[image]"), validateListing, wrapAsync(listingController.updateListing))
  .delete(isLoggedIn, isOwner, wrapAsync(listingController.deleteListing));


module.exports = router;
