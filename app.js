if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require("path");
const methodOverride = require("method-override");
const expressLayouts = require("express-ejs-layouts");
const ExpressError = require("./utils/ExpressError.js");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const flash = require("connect-flash");
const passport = require("passport");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require("./models/user.js");
const LocalStrategy = require("passport-local");

// ✅ FIXED: Correct environment variable name
const dburl = process.env.MONGODB_URI || "mongodb://localhost:27017/airbnb";

// Always define a default page variable for all EJS views
app.use((req, res, next) => {
  res.locals.page = undefined;
  next();
});

// ===== ROUTES =====
const listingRouter = require("./routes/listing.js");
const reviewsRouter = require("./routes/review.js");
const userRouter = require("./routes/user.js");
const searchRoutes = require('./routes/search.js');
const wishlistRoutes = require('./routes/wishlist');

// ===== DATABASE CONNECT ===== (Replace this entire section)
async function main() {
  console.log("🔍 Connecting to MongoDB with URL:", dburl ? "✅ SET" : "❌ MISSING");
  
  try {
    await mongoose.connect(dburl, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 60000,  // 1 minute timeout
      socketTimeoutMS: 60000,
      family: 4,
      maxPoolSize: 5,
      bufferMaxEntries: 0,
      connectTimeoutMS: 30000,
      ssl: true,
      tls: true,
      tlsAllowInvalidCertificates: true
    });
    console.log("✅ MongoDB Connected Successfully");
  } catch (error) {
    console.error("❌ MongoDB Connection FAILED:", error.message);
    process.exit(1); // Exit if DB fails
  }
}

// Call connection IMMEDIATELY after defining
main();

// ===== VIEW ENGINE & MIDDLEWARE =====
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.use(expressLayouts);
app.set("layout", "layout");
app.use(express.static("public"));

app.get('/', (req, res) => {
  res.redirect('/listings');
});

const store = new session.MemoryStore();
// const store = MongoStore.create({
//   mongoUrl: dburl,
//   secret: process.env.SESSION_SECRET,
//   touchAfter: 24 * 60 * 60,
//   mongooseConnection: mongoose.connection,  // ✅ Use existing mongoose connection
//   clientOptions: {
//     serverSelectionTimeoutMS: 30000,
//     socketTimeoutMS: 45000,
//     family: 4,
//     tls: true,
//     tlsAllowInvalidCertificates: true
//   }
// });


store.on("error", function (e) {
  console.log("Session Store Error", e);
});

const sessionOptions = {
  store,
  secret: process.env.SESSION_SECRET || 'fallback-secret',
  resave: false,
  saveUninitialized: true,
  cookie: {
    httpOnly: true,
    expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
    maxAge: 1000 * 60 * 60 * 24 * 7
  },
};

app.use(session(sessionOptions));
app.use(flash());

// ===== PASSPORT =====
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// ===== FLASH & USER LOCALS =====
app.use((req, res, next) => {
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  res.locals.currUser = req.user;
  next();
});

// ===== ROUTES MOUNTING (ORDER MATTERS!) =====
app.use('/', searchRoutes);
app.use('/listings', listingRouter);
app.use('/listings/:id/reviews', reviewsRouter);
app.use('/', userRouter);
app.use('/', wishlistRoutes);

// ===== GOOGLE AUTH =====
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: 'https://wanderlust-87b0.onrender.com/auth/google/callback'
},
async (accessToken, refreshToken, profile, done) => {
  let user = await User.findOne({ googleId: profile.id });
  if (!user) {
    user = await User.create({
      googleId: profile.id,
      username: profile.displayName,
      email: profile.emails[0].value
    });
  }
  return done(null, user);
}));

passport.serializeUser((user, done) => {
  done(null, user.id);
});
passport.deserializeUser(async (id, done) => {
  const user = await User.findById(id);
  done(null, user);
});

// ===== 404 & ERROR HANDLING =====
app.all("*", (req, res, next) => {
  next(new ExpressError("Page Not Found", 404));
});
app.use((err, req, res, next) => {
  let {statusCode=500, message = "Something went wrong"} = err;
  res.status(statusCode).render("error.ejs", { message });
});

// ===== SERVER START =====
app.listen(8080, () => {
  console.log("server is listening to port 8080");
});
