import express from "express";

import {
  createPost,
  getAllFollowerPost,
  getAllPost,
  getAllUsersPost,
  getAllUsersPosts,
  getSearchUserPost,
  updateUserProfile,
} from "../controllers/post.controllers.js";
import { isAuthenticated } from "../middlewares/auth.middlewares.js";

export const postRoute = express.Router();

postRoute.use(isAuthenticated);
postRoute.post("/createPost", createPost);
postRoute.get("/get-all-posts", getAllPost);
postRoute.get("/:userId/posts", getSearchUserPost);
postRoute.patch("/editUserProfile", updateUserProfile);
postRoute.get("/getFollowUserPost", getAllFollowerPost);
postRoute.get("/getAllUsersPosts", getAllUsersPost);
postRoute.get("/reels", getAllUsersPosts);
