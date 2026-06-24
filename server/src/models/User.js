import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: 2,
      maxlength: 50,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: 6,
      select: false,
    },
    avatar: {
      type: String,
      default: "",
    },
    phone: {
      type: String,
      default: "",
      trim: true,
    },
    bio: {
      type: String,
      default: "",
      maxlength: 200,
      trim: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    verificationToken: String,
    verificationTokenExpires: Date,
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    isOnline: {
      type: Boolean,
      default: false,
    },
    lastSeen: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

userSchema.index({ name: "text", email: "text" });

// Hash password before saving, only if it was modified
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Shape returned to the client - never leak sensitive fields
userSchema.methods.toSafeJSON = function () {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    avatar: this.avatar,
    phone: this.phone,
    bio: this.bio,
    isVerified: this.isVerified,
    isOnline: this.isOnline,
    lastSeen: this.lastSeen,
    createdAt: this.createdAt,
  };
};

const User = mongoose.model("User", userSchema);

export default User;
