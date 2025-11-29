import { Server } from "socket.io";
import http from "http";
import express from "express";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URI || "http://localhost:5173",
    // credentials: true,
  },
});

const userSocketMap = {};

io.on("connection", (socket) => {
  const userId = socket.handshake.query.userId;

  console.log("🔌 New connection attempt");
  console.log("User ID:", userId);
  console.log("Socket ID:", socket.id);

  if (!userId || userId === "undefined") {
    console.log("❌ No valid userId provided");
    return;
  }

  // Store user's socket ID
  userSocketMap[userId] = socket.id;
  console.log("✅ User connected:", userId, "Socket ID:", socket.id);
  console.log("📊 Current online users:", Object.keys(userSocketMap));

  // Emit updated online users list to ALL connected clients
  io.emit("onlineUsers", Object.keys(userSocketMap));

  // Handle disconnect
  socket.on("disconnect", () => {
    console.log("❌ User disconnected:", userId, "Socket ID:", socket.id);
    delete userSocketMap[userId];
    console.log("📊 Remaining online users:", Object.keys(userSocketMap));
    io.emit("onlineUsers", Object.keys(userSocketMap));
  });
});

export const getSocketId = (userId) => {
  return userSocketMap[userId];
};

export { io, app, server };
