const User = require("../models/user");
const crypto = require('crypto');
const nodemailer = require('nodemailer');

module.exports.renderSignupForm = (req, res) => {
  res.render("users/signup.ejs" , { page: 'signup' });
};

module.exports.signup = async (req, res, next) => {
    const token = crypto.randomBytes(32).toString('hex');
    try {
      const { username, email, password } = req.body;
  
      // ...your existing email and password validation...
  
      // 1. Generate a token (JWT or random string)
      const emailToken = crypto.randomBytes(32).toString('hex');
      const emailTokenExpires = Date.now() + 3600000; // 1 hour
  
      // 2. Create user with isVerified: false
      const user = new User({
        username,
        email,
        isVerified: false,
        emailToken,
        emailTokenExpires
      });
      const registeredUser = await User.register(user, password);
  
      // 3. Send verification email
      const verifyURL = `http://${req.headers.host}/verify-email?token=${emailToken}&email=${email}`;
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: 'faltuusekailiye123@gmail.com',
          pass: 'bduw ydti jjqc sfna' 
        }
      });
      await transporter.sendMail({
        from: 'faltuusekailiye123@gmail.com',
        to: email,
        subject: 'Verify your Wanderlust account',
        html: `<h3>Welcome to Wanderlust!</h3>
          <p>Click the link below to verify your email:</p>
          <a href="${verifyURL}">${verifyURL}</a>
          <p>This link will expire in 1 hour.</p>`
      });
  
      req.flash('success', 'Registration successful! Please check your email to verify your account.');
      res.redirect('/login');
    } catch (e) {
      req.flash("error", e.message);
      res.redirect("/signup");
    }
  };
  

module.exports.renderLoginForm = (req, res) => {
  res.render("users/login.ejs" , { page: 'login' });
};

module.exports.login = async (req, res) => {
  req.flash("success", "Welcome back!");
  let redirectUrl = req.session.redirectUrl || "/listings";
  res.redirect(redirectUrl);
};

module.exports.logout = (req, res) => {
  req.logout((err) => {
    if (err) return next(err);
    req.flash("success", "Goodbye!");
    res.redirect("/listings");
  });
};
