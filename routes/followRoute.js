import express from "express";

import { isAuthenticated } from "../middlewares/auth.middlewares.js";
import {
  followUser,
  getFollowers,
  getFollowing,
  getFollowStatus,
  suggestedForYou,
  unfollowUser,
} from "../controllers/follow.controllers.js";

export const followRoute = express.Router();

followRoute.post("/follow/:userId", isAuthenticated, followUser);
followRoute.delete("/unfollow/:userId", isAuthenticated, unfollowUser);
followRoute.get("/followers/:userId", isAuthenticated, getFollowers);
followRoute.get("/following/:userId", isAuthenticated, getFollowing);
followRoute.get("/follow-status/:userId", isAuthenticated, getFollowStatus);
followRoute.get("/follow/suggestedForyou", isAuthenticated, suggestedForYou);
