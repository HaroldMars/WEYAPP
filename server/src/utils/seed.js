/**
 * Optional helper: creates a few pre-verified demo users so you can test
 * the chat app immediately without going through email verification.
 *
 * Run with: npm run seed
 */
import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import User from "../models/User.js";

const demoUsers = [
  { name: "Alice Johnson", email: "alice@demo.com", password: "password123" },
  { name: "Bob Smith", email: "bob@demo.com", password: "password123" },
  { name: "Carla Reyes", email: "carla@demo.com", password: "password123" },
];

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("[seed] Connected to MongoDB");

  for (const u of demoUsers) {
    const existing = await User.findOne({ email: u.email });
    if (existing) {
      console.log(`[seed] Skipping ${u.email} (already exists)`);
      continue;
    }
    await User.create({ ...u, isVerified: true });
    console.log(`[seed] Created ${u.email} / password: ${u.password}`);
  }

  console.log("[seed] Done.");
  await mongoose.disconnect();
  process.exit(0);
};

run().catch((err) => {
  console.error("[seed] Error:", err);
  process.exit(1);
});
