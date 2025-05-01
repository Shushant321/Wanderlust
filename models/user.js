const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const passportLocalMongoose = require("passport-local-mongoose");
const userSchema = new Schema({
  email: { type: String, required: true, unique: true },
isVerified: { type: Boolean, default: false },
emailToken: String,
emailTokenExpires: Date,


  googleId: String,
  resetPasswordToken: String,

  resetPasswordExpires: Date,
  wishlist: [
    {
      type: Schema.Types.ObjectId,
      ref: 'Listing'
    }
  ],
});

userSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("User", userSchema);