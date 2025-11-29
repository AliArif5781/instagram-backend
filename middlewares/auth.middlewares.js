import { asyncHandler } from "../utilities/asyncHandler.utilities.js";
import { errorHandler } from "../utilities/errorHandler.utilities.js";
import jwt from "jsonwebtoken";
import userModel from "../model/user.model.js"; // Import User model

export const isAuthenticated = asyncHandler(async (req, res, next) => {
  // Fix: req.cookies (plural) not req.cookie
  const token =
    req.cookies?.token || req.headers["authorization"]?.replace("Bearer ", "");

  if (!token) {
    return next(new errorHandler("Please login to access this resource", 401));
  }

  // console.log("Token received:", token);
  const tokenData = jwt.verify(token, process.env.JWT_SECRET);
  // console.log("Decoded token:", tokenData);

  // Find user by ID from token
  const user = await userModel.findById(tokenData.id).select("-password");
  if (!user) {
    return next(new errorHandler("User not found", 404));
  }

  req.user = user; // Attach full user object
  next();
});
