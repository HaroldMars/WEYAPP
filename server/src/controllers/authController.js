import crypto from "crypto";
import validator from "validator";
import User from "../models/User.js";
import { signToken, setAuthCookie, clearAuthCookie } from "../utils/jwt.js";
import { sendVerificationEmail, sendPasswordResetEmail } from "../utils/email.js";

const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";

// ---------- helpers ----------
const createToken = () => crypto.randomBytes(32).toString("hex");

// ---------- POST /api/auth/register ----------
export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email and password are all required." });
    }
    if (!validator.isEmail(email)) {
      return res.status(400).json({ message: "Please provide a valid email address." });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters." });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ message: "An account with this email already exists." });
    }

    const verificationToken = createToken();
    const verificationTokenExpires = Date.now() + 24 * 60 * 60 * 1000; // 24h

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      verificationToken,
      verificationTokenExpires,
    });

    const verifyUrl = `${CLIENT_URL}/verify-email/${verificationToken}`;
    await sendVerificationEmail(user.email, user.name, verifyUrl);

    return res.status(201).json({
      message: "Account created. Please check your email to verify your account.",
    });
  } catch (err) {
    console.error("[auth:register]", err);
    return res.status(500).json({ message: "Something went wrong creating your account." });
  }
};

// ---------- GET /api/auth/verify-email/:token ----------
export const verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;

    const user = await User.findOne({
      verificationToken: token,
      verificationTokenExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: "Verification link is invalid or has expired." });
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpires = undefined;
    await user.save();

    return res.status(200).json({ message: "Email verified successfully. You can now log in." });
  } catch (err) {
    console.error("[auth:verifyEmail]", err);
    return res.status(500).json({ message: "Something went wrong verifying your email." });
  }
};

// ---------- POST /api/auth/resend-verification ----------
export const resendVerification = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: email?.toLowerCase() });

    if (!user) {
      return res.status(404).json({ message: "No account found with this email." });
    }
    if (user.isVerified) {
      return res.status(400).json({ message: "This account is already verified." });
    }

    const verificationToken = createToken();
    user.verificationToken = verificationToken;
    user.verificationTokenExpires = Date.now() + 24 * 60 * 60 * 1000;
    await user.save();

    const verifyUrl = `${CLIENT_URL}/verify-email/${verificationToken}`;
    await sendVerificationEmail(user.email, user.name, verifyUrl);

    return res.status(200).json({ message: "Verification email resent. Please check your inbox." });
  } catch (err) {
    console.error("[auth:resendVerification]", err);
    return res.status(500).json({ message: "Something went wrong resending the verification email." });
  }
};

// ---------- POST /api/auth/login ----------
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required." });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select("+password");
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    if (!user.isVerified) {
      return res.status(403).json({
        message: "Please verify your email before logging in.",
        unverified: true,
      });
    }

    user.isOnline = true;
    await user.save();

    const token = signToken(user._id);
    setAuthCookie(res, token);

    return res.status(200).json({
      message: "Logged in successfully.",
      user: user.toSafeJSON(),
      token, // also returned in body for non-cookie clients (e.g. mobile)
    });
  } catch (err) {
    console.error("[auth:login]", err);
    return res.status(500).json({ message: "Something went wrong logging you in." });
  }
};

// ---------- POST /api/auth/logout ----------
export const logout = async (req, res) => {
  try {
    if (req.user) {
      req.user.isOnline = false;
      req.user.lastSeen = new Date();
      await req.user.save();
    }
    clearAuthCookie(res);
    return res.status(200).json({ message: "Logged out successfully." });
  } catch (err) {
    console.error("[auth:logout]", err);
    return res.status(500).json({ message: "Something went wrong logging you out." });
  }
};

// ---------- GET /api/auth/me ----------
export const getMe = async (req, res) => {
  return res.status(200).json({ user: req.user.toSafeJSON() });
};

// ---------- POST /api/auth/forgot-password ----------
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: email?.toLowerCase() });

    // Always respond the same way whether or not the email exists, to avoid leaking
    // which emails are registered.
    const genericMessage = "If an account with that email exists, a reset link has been sent.";

    if (!user) {
      return res.status(200).json({ message: genericMessage });
    }

    const resetToken = createToken();
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 60 * 60 * 1000; // 1 hour
    await user.save();

    const resetUrl = `${CLIENT_URL}/reset-password/${resetToken}`;
    await sendPasswordResetEmail(user.email, user.name, resetUrl);

    return res.status(200).json({ message: genericMessage });
  } catch (err) {
    console.error("[auth:forgotPassword]", err);
    return res.status(500).json({ message: "Something went wrong processing your request." });
  }
};

// ---------- POST /api/auth/reset-password/:token ----------
export const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password || password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters." });
    }

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: "Reset link is invalid or has expired." });
    }

    user.password = password; // pre-save hook will hash it
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    return res.status(200).json({ message: "Password reset successfully. You can now log in." });
  } catch (err) {
    console.error("[auth:resetPassword]", err);
    return res.status(500).json({ message: "Something went wrong resetting your password." });
  }
};
