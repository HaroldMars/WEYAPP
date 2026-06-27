import express from "express";
import {
  sendFriendRequest,
  listIncomingRequests,
  acceptFriendRequest,
  declineFriendRequest,
  listFriends,
} from "../controllers/friendController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.use(protect);

router.get("/", listFriends);
router.get("/requests", listIncomingRequests);
router.post("/request", sendFriendRequest);
router.post("/requests/:id/accept", acceptFriendRequest);
router.post("/requests/:id/decline", declineFriendRequest);

export default router;
