import dotenv from "dotenv";
dotenv.config();

import http from "http";
import app from "./app.js";
import { connectDB } from "./config/db.js";
import { initSocket } from "./sockets/index.js";

const PORT = process.env.PORT || 5000;

const start = async () => {
  await connectDB();

  const httpServer = http.createServer(app);
  initSocket(httpServer);

  httpServer.listen(PORT, () => {
    console.log(`[server] Running on http://localhost:${PORT}`);
    console.log(`[server] Environment: ${process.env.NODE_ENV || "development"}`);
  });
};

start();
