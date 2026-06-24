import express from "express";
import {
  register,
  verifyEmail,
  resendVerification,
  login,
  logout,
  getMe,
  forgotPassword,
  resetPassword,
} from "../controllers/authController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.post("/register", register);
router.get("/verify-email/:token", verifyEmail);
router.post("/resend-verification", resendVerification);
router.post("/login", login);
router.post("/logout", protect, logout);
router.get("/me", protect, getMe);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);

export default router;
