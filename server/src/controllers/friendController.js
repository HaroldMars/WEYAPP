import FriendRequest from "../models/FriendRequest.js";
import User from "../models/User.js";
import { getIO } from "../sockets/index.js";

// ---------- POST /api/friends/request ----------
// Send a friend request to another user
export const sendFriendRequest = async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ message: "userId is required." });
    }
    if (String(userId) === String(req.user._id)) {
      return res.status(400).json({ message: "You cannot send a friend request to yourself." });
    }

    const recipient = await User.findById(userId);
    if (!recipient) {
      return res.status(404).json({ message: "User not found." });
    }

    if (req.user.friends.some((f) => String(f) === String(userId))) {
      return res.status(409).json({ message: "You are already friends with this user." });
    }

    // Check both directions - maybe they already sent us one
    const existing = await FriendRequest.findOne({
      $or: [
        { sender: req.user._id, recipient: userId },
        { sender: userId, recipient: req.user._id },
      ],
      status: "pending",
    });

    if (existing) {
      if (String(existing.sender) === String(userId)) {
        return res.status(409).json({
          message: "This user already sent you a friend request. Check your requests to accept it.",
        });
      }
      return res.status(409).json({ message: "Friend request already sent." });
    }

    const request = await FriendRequest.create({
      sender: req.user._id,
      recipient: userId,
    });

    const io = getIO();
    if (io) {
      io.to(`user:${userId}`).emit("friend:request-received", {
        id: request._id,
        sender: req.user.toSafeJSON(),
        createdAt: request.createdAt,
      });
    }

    return res.status(201).json({ message: "Friend request sent.", requestId: request._id });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: "Friend request already sent." });
    }
    console.error("[friends:sendRequest]", err);
    return res.status(500).json({ message: "Something went wrong sending the friend request." });
  }
};

// ---------- GET /api/friends/requests ----------
// List pending friend requests sent TO the logged-in user
export const listIncomingRequests = async (req, res) => {
  try {
    const requests = await FriendRequest.find({
      recipient: req.user._id,
      status: "pending",
    }).populate("sender", "-password");

    return res.status(200).json({
      requests: requests.map((r) => ({
        id: r._id,
        sender: r.sender.toSafeJSON(),
        createdAt: r.createdAt,
      })),
    });
  } catch (err) {
    console.error("[friends:listIncoming]", err);
    return res.status(500).json({ message: "Something went wrong fetching friend requests." });
  }
};

// ---------- POST /api/friends/requests/:id/accept ----------
export const acceptFriendRequest = async (req, res) => {
  try {
    const { id } = req.params;

    const request = await FriendRequest.findById(id);
    if (!request || String(request.recipient) !== String(req.user._id)) {
      return res.status(404).json({ message: "Friend request not found." });
    }
    if (request.status !== "pending") {
      return res.status(400).json({ message: "This request has already been handled." });
    }

    request.status = "accepted";
    await request.save();

    // Add each other as friends (avoid duplicates)
    await User.findByIdAndUpdate(request.sender, { $addToSet: { friends: request.recipient } });
    await User.findByIdAndUpdate(request.recipient, { $addToSet: { friends: request.sender } });

    const io = getIO();
    if (io) {
      io.to(`user:${request.sender}`).emit("friend:request-accepted", {
        by: req.user.toSafeJSON(),
      });
    }

    return res.status(200).json({ message: "Friend request accepted." });
  } catch (err) {
    console.error("[friends:accept]", err);
    return res.status(500).json({ message: "Something went wrong accepting the friend request." });
  }
};

// ---------- POST /api/friends/requests/:id/decline ----------
export const declineFriendRequest = async (req, res) => {
  try {
    const { id } = req.params;

    const request = await FriendRequest.findById(id);
    if (!request || String(request.recipient) !== String(req.user._id)) {
      return res.status(404).json({ message: "Friend request not found." });
    }
    if (request.status !== "pending") {
      return res.status(400).json({ message: "This request has already been handled." });
    }

    request.status = "declined";
    await request.save();

    return res.status(200).json({ message: "Friend request declined." });
  } catch (err) {
    console.error("[friends:decline]", err);
    return res.status(500).json({ message: "Something went wrong declining the friend request." });
  }
};

// ---------- GET /api/friends ----------
// List the logged-in user's friends
export const listFriends = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate("friends", "-password");
    return res.status(200).json({ friends: user.friends.map((f) => f.toSafeJSON()) });
  } catch (err) {
    console.error("[friends:list]", err);
    return res.status(500).json({ message: "Something went wrong fetching your friends." });
  }
};
