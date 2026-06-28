import User from "../models/User.js";
import { resolveUploadedFileUrl } from "../middleware/upload.js";

// Escapes characters that have special meaning in regular expressions so user-typed
// search text (e.g. a phone number starting with "+") is treated as a literal string.
const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// ---------- GET /api/users ----------
// List all users except the logged-in one - used for the "add user to chat" list
export const listUsers = async (req, res) => {
  try {
    const { search } = req.query;

    const query = { _id: { $ne: req.user._id } };
    if (search) {
      const safeSearch = escapeRegex(search.trim());
      query.$or = [
        { name: { $regex: safeSearch, $options: "i" } },
        { nickname: { $regex: safeSearch, $options: "i" } },
        { email: { $regex: safeSearch, $options: "i" } },
        { phone: { $regex: safeSearch, $options: "i" } },
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
// Public profile view - includes friendship status relative to the viewer
export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const isSelf = String(user._id) === String(req.user._id);
    const isFriend = req.user.friends.some((f) => String(f) === String(user._id));

    let friendRequestStatus = "none"; // none | sent | received | friends
    if (isFriend) {
      friendRequestStatus = "friends";
    } else if (!isSelf) {
      const FriendRequest = (await import("../models/FriendRequest.js")).default;
      const pending = await FriendRequest.findOne({
        $or: [
          { sender: req.user._id, recipient: user._id },
          { sender: user._id, recipient: req.user._id },
        ],
        status: "pending",
      });
      if (pending) {
        friendRequestStatus =
          String(pending.sender) === String(req.user._id) ? "sent" : "received";
      }
    }

    return res.status(200).json({
      user: user.toSafeJSON(),
      isSelf,
      friendRequestStatus,
    });
  } catch (err) {
    console.error("[users:getById]", err);
    return res.status(500).json({ message: "Something went wrong fetching this user." });
  }
};

// ---------- PUT /api/users/me ----------
// Update profile: name, phone, bio
export const updateProfile = async (req, res) => {
  try {
    const { name, nickname, phone, bio } = req.body;

    if (name !== undefined) req.user.name = name.trim();
    if (nickname !== undefined) req.user.nickname = nickname.trim().slice(0, 30);
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
