import express from "express";
import {
  getOtherUsers,
  getProfile,
  getUserById,
  login,
  logout,
  searchUsers,
  signup,
} from "../controllers/authenticate.controllers.js";
import { isAuthenticated } from "../middlewares/auth.middlewares.js";

export const authenticateRoute = express.Router();

authenticateRoute.post("/signup", signup);
authenticateRoute.post("/login", login);
authenticateRoute.post("/logout", logout);
authenticateRoute.get("/getProfile", isAuthenticated, getProfile);
authenticateRoute.get("/getOtherUsers", isAuthenticated, getOtherUsers);
authenticateRoute.get("/search/:query", isAuthenticated, searchUsers);
authenticateRoute.get("/:userId", isAuthenticated, getUserById);
