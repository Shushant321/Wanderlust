const Listing = require("../models/listing");
const { geocodeAddress } = require('../utils/geocode');

// INDEX
module.exports.index = async (req, res) => {
    const allListings = await Listing.find({});
    res.render("listings/index.ejs", { allListings , page: 'listings' });
};

// NEW
module.exports.newListing = (req, res) => {
    res.render("listings/new.ejs" , { page: 'listings' });
};

// SHOW
module.exports.showListing = async (req, res) => {
    let { id } = req.params;
    const listing = await Listing.findById(id)
        .populate({
            path: "reviews",
            populate: { path: "author" }
        })
        .populate("owner"); // populate the owner field  
    if (!listing) {
        req.flash("error", "Cannot find that listing!");
        return res.redirect("/listings");
    }
    res.render("listings/show.ejs", { listing , page: 'show'});
};

// CREATE (SIRF YEH EK HI HONA CHAHIYE)
module.exports.createListing = async (req, res) => {
    // 1. Address from form
    const address = req.body.listing.location + ", " + req.body.listing.country;

    // 2. Geocode
    const coords = await geocodeAddress(address);

    // 3. Listing create
    const newListing = new Listing(req.body.listing);
    newListing.owner = req.user._id;

    // 4. Geocoding result set karo
    if (coords) {
        newListing.lat = coords.lat;
        newListing.lng = coords.lng;
    }

    // 5. Image set karo agar file mili hai
    if (req.file) {
        newListing.image = { url: req.file.path, filename: req.file.filename };
    }

    await newListing.save();
    req.flash("success", "Successfully created a new listing!");
    res.redirect("/listings");
};

// EDIT
module.exports.editListing = async (req, res) => {
    let { id } = req.params;
    const listing = await Listing.findById(id);
    if (!listing) {
        req.flash("error", "Cannot find that listing!");
        return res.redirect("/listings");
    }
    res.render("listings/edit.ejs", { listing  , page: 'edit' });
};

// UPDATE
module.exports.updateListing = async (req, res) => {
    let listing = await Listing.findByIdAndUpdate(req.params.id, { ...req.body.listing });

    if (typeof req.file !== "undefined") {
        let url = req.file.path;
        let filename = req.file.filename;
        listing.image = { url, filename }; // update the image to the uploaded file
        await listing.save();  
    }

    req.flash("success", "Successfully updated the listing!");
    res.redirect(`/listings/${req.params.id}`);
};

// DELETE
module.exports.deleteListing = async (req, res) => {
    let { id } = req.params;
    let deletedListing = await Listing.findByIdAndDelete(id);
    console.log(deletedListing);
    req.flash("success", "Deleted listing!");
    res.redirect("/listings");
};

// controllers/listing.js
module.exports.index = async (req, res) => {
    const allListings = await Listing.find({}).populate('reviews');
    const listingsWithRating = allListings.map(listing => {
      let avgRating = 0;
      if (listing.reviews.length > 0) {
        const total = listing.reviews.reduce((sum, review) => sum + review.rating, 0);
        avgRating = (total / listing.reviews.length).toFixed(1);
      }
      return { ...listing._doc, avgRating };
    });
    res.render("listings/index.ejs", { allListings: listingsWithRating , page: 'listings' });
  };
  