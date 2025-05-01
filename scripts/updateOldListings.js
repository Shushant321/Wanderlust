// scripts/updateOldListings.js
const mongoose = require('mongoose');
const Listing = require('../models/listing');
const { geocodeAddress } = require('../utils/geocode');

const MONGO_URL = 'mongodb://127.0.0.1:27017/wanderlust';

async function updateListings() {
  await mongoose.connect(MONGO_URL);
  const listings = await Listing.find({ $or: [ { lat: { $exists: false } }, { lng: { $exists: false } } ] });

  for (let listing of listings) {
    const address = listing.location + ", " + listing.country;
    const coords = await geocodeAddress(address);
    if (coords) {
      listing.lat = coords.lat;
      listing.lng = coords.lng;
      await listing.save();
      console.log(`Updated: ${listing.title}`);
    } else {
      console.log(`Could not geocode: ${listing.title}`);
    }
  }
  mongoose.disconnect();
}

updateListings();
