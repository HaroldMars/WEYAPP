import { verifyToken } from "../utils/jwt.js";
import User from "../models/User.js";

/**
 * Protects a route - requires a valid JWT, either from the httpOnly cookie
 * or an Authorization: Bearer <token> header (useful for non-browser clients).
 */
export const protect = async (req, res, next) => {
  try {
    let token = req.cookies?.token;

    if (!token && req.headers.authorization?.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({ message: "Not authenticated. Please log in." });
    }

    const decoded = verifyToken(token);
    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return res.status(401).json({ message: "User no longer exists." });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Session expired or invalid. Please log in again." });
  }
};
