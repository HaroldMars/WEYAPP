import { createContext, useContext, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { useAuth } from "./AuthContext.jsx";
import { API_URL } from "../api/client.js";

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [socket, setSocket] = useState(null);
  const [onlineUserIds, setOnlineUserIds] = useState(new Set());
  const socketRef = useRef(null);

  useEffect(() => {
    if (!isAuthenticated) {
      socketRef.current?.disconnect();
      socketRef.current = null;
      setSocket(null);
      return;
    }

    const token = localStorage.getItem("token");
    const newSocket = io(API_URL, {
      withCredentials: true,
      auth: token ? { token } : {},
    });

    newSocket.on("user:online", ({ userId }) => {
      setOnlineUserIds((prev) => new Set(prev).add(userId));
    });

    newSocket.on("user:offline", ({ userId }) => {
      setOnlineUserIds((prev) => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
    });

    newSocket.on("connect_error", (err) => {
      console.warn("[socket] connection error:", err.message);
    });

    socketRef.current = newSocket;
    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
      socketRef.current = null;
    };
  }, [isAuthenticated]);

  const isUserOnline = (userId) => onlineUserIds.has(String(userId));

  return (
    <SocketContext.Provider value={{ socket, isUserOnline }}>{children}</SocketContext.Provider>
  );
};

export const useSocket = () => {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error("useSocket must be used within a SocketProvider");
  return ctx;
};
