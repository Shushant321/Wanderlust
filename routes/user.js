const express = require('express');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const router = express.Router();
const User = require("../models/user.js");
const wrapAsync = require('../utils/wrapAsync.js');
const passport = require("passport");
const { saveRedirectUrl } = require('../middleware.js');
const userController = require('../controllers/user.js');


// Signup
router.get("/signup", userController.renderSignupForm);
router.post("/signup", wrapAsync(userController.signup));

// Login
router.route("/login")
    .get(userController.renderLoginForm)
    .post(
        saveRedirectUrl,
        passport.authenticate("local", {
            failureFlash: true,
            failureRedirect: "/login",
        }),
        async (req, res, next) => {
            // Email verification check
            if (!req.user.isVerified) {
                req.logout(() => {});
                req.flash('error', 'Please verify your email before logging in.');
                return res.redirect('/login');
            }
            // Agar verified hai, normal login flow
            req.flash("success", "Welcome back!");
            res.redirect("/listings");
        }
    );


// Logout (only one route)
router.get("/logout", userController.logout);

// Google login
router.get('/auth/google',
    passport.authenticate('google', { scope: ['profile', 'email'] })
);
router.get('/auth/google/callback',
    passport.authenticate('google', { failureRedirect: '/login' }),
    (req, res) => {
      res.redirect('/listings');
    }
);

// Forgot password form
router.get('/forgot', (req, res) => {
  res.render('users/forgot');
});

// Forgot password POST
router.post('/forgot', wrapAsync(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) {
    req.flash('error', 'No account with that email found.');
    return res.redirect('/forgot');
  }
  const token = crypto.randomBytes(32).toString('hex');
  user.resetPasswordToken = token;
  user.resetPasswordExpires = Date.now() + 3600000;
  await user.save();

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL,
      pass: process.env.EMAIL_PASS
    }
  });

  const resetURL = `http://${req.headers.host}/reset/${token}`;
  const mailOptions = {
    to: user.email,
    from: process.env.EMAIL,
    subject: 'Wanderlust Password Reset',
    html: `<p>You requested a password reset for your Wanderlust account.</p>
           <p>Click <a href="${resetURL}">here</a> to reset your password.</p>
           <p>This link will expire in 1 hour.</p>`
  };
  await transporter.sendMail(mailOptions);

  req.flash('success', 'Password reset link sent to your email.');
  res.redirect('/login');
}));

// Show reset password form
router.get('/reset/:token', wrapAsync(async (req, res) => {
  const user = await User.findOne({
    resetPasswordToken: req.params.token,
    resetPasswordExpires: { $gt: Date.now() }
  });
  if (!user) {
    req.flash('error', 'Password reset token is invalid or has expired.');
    return res.redirect('/forgot');
  }
  res.render('users/reset', { token: req.params.token });
}));

// Handle reset password POST
router.post('/reset/:token', wrapAsync(async (req, res) => {
  const user = await User.findOne({
    resetPasswordToken: req.params.token,
    resetPasswordExpires: { $gt: Date.now() }
  });
  if (!user) {
    req.flash('error', 'Password reset token is invalid or has expired.');
    return res.redirect('/forgot');
  }
  if (req.body.password !== req.body.confirm) {
    req.flash('error', 'Passwords do not match.');
    return res.redirect('back');
  }
  // If using passport-local-mongoose:
  user.setPassword(req.body.password, async function(err) {
    if (err) {
      req.flash('error', 'Something went wrong.');
      return res.redirect('/forgot');
    }
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();
    req.flash('success', 'Password has been reset! You can now log in.');
    res.redirect('/login');
  });
}));
router.get('/verify-email', async (req, res) => {
  const { token, email } = req.query;
  const user = await User.findOne({
    email,
    emailToken: token,
    emailTokenExpires: { $gt: Date.now() }
  });
  if (!user) {
    req.flash('error', 'Verification link is invalid or has expired.');
    return res.redirect('/signup');
  }
  user.isVerified = true;
  user.emailToken = undefined;
  user.emailTokenExpires = undefined;
  await user.save();
  req.flash('success', 'Your email has been verified! You can now log in.');
  res.redirect('/login');
});


module.exports = router;
