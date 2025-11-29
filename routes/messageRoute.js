import express from "express";
import { isAuthenticated } from "../middlewares/auth.middlewares.js";
import {
  getMessages,
  sendMessage,
} from "../controllers/message.controllers.js";

export const messageRoute = express.Router();

messageRoute.post("/send/:receiverId", isAuthenticated, sendMessage);
messageRoute.get("/getMessage/:receiverId", isAuthenticated, getMessages);
