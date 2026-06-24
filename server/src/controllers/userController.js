import User from "../models/User.js";
import { resolveUploadedFileUrl } from "../middleware/upload.js";

// ---------- GET /api/users ----------
// List all users except the logged-in one - used for the "add user to chat" list
export const listUsers = async (req, res) => {
  try {
    const { search } = req.query;

    const query = { _id: { $ne: req.user._id } };
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const users = await User.find(query).select("-password").limit(50);
    return res.status(200).json({ users: users.map((u) => u.toSafeJSON()) });
  } catch (err) {
    console.error("[users:list]", err);
    return res.status(500).json({ message: "Something went wrong fetching users." });
  }
};

// ---------- GET /api/users/:id ----------
export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }
    return res.status(200).json({ user: user.toSafeJSON() });
  } catch (err) {
    console.error("[users:getById]", err);
    return res.status(500).json({ message: "Something went wrong fetching this user." });
  }
};

// ---------- PUT /api/users/me ----------
// Update profile: name, phone, bio
export const updateProfile = async (req, res) => {
  try {
    const { name, phone, bio } = req.body;

    if (name !== undefined) req.user.name = name.trim();
    if (phone !== undefined) req.user.phone = phone.trim();
    if (bio !== undefined) req.user.bio = bio.trim().slice(0, 200);

    await req.user.save();

    return res.status(200).json({
      message: "Profile updated successfully.",
      user: req.user.toSafeJSON(),
    });
  } catch (err) {
    console.error("[users:updateProfile]", err);
    return res.status(500).json({ message: "Something went wrong updating your profile." });
  }
};

// ---------- POST /api/users/me/avatar ----------
export const updateAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No image file was provided." });
    }

    const url = await resolveUploadedFileUrl(req.file, "avatars");
    req.user.avatar = url;
    await req.user.save();

    return res.status(200).json({
      message: "Profile picture updated successfully.",
      user: req.user.toSafeJSON(),
    });
  } catch (err) {
    console.error("[users:updateAvatar]", err);
    return res.status(500).json({ message: "Something went wrong uploading your profile picture." });
  }
};
