import express from "express";
import { listUsers, getUserById, updateProfile, updateAvatar } from "../controllers/userController.js";
import { protect } from "../middleware/auth.js";
import { uploadAvatar } from "../middleware/upload.js";

const router = express.Router();

router.use(protect);

router.get("/", listUsers);
router.get("/:id", getUserById);
router.put("/me", updateProfile);
router.post("/me/avatar", uploadAvatar.single("avatar"), updateAvatar);

export default router;
