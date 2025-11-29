import express from "express";
import { isAuthenticated } from "../middlewares/auth.middlewares.js";
import { getStories, Story } from "../controllers/story.controllers.js";
export const storyRoute = express.Router();

storyRoute.use(isAuthenticated);

storyRoute.post("/story", Story);
storyRoute.get("/userStory/getStory", getStories);
