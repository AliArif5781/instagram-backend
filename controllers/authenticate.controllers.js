import userModel from "../model/user.model.js";
import { errorHandler } from "../utilities/errorHandler.utilities.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { asyncHandler } from "../utilities/asyncHandler.utilities.js";

export const signup = asyncHandler(async (req, res, next) => {
  const { fullName, username, email, password, profileImage } = req.body;

  if (!fullName || !username || !email || !password) {
    return next(new errorHandler("All fields are required", 400));
  }

  const existingUser = await userModel.findOne({
    $or: [{ email }, { username }],
  });

  if (existingUser) {
    const field = existingUser.email === email ? "Email" : "Username";
    return next(new errorHandler(`Invalid Credentials`, 400));
  }

  const hashPassword = await bcrypt.hash(password, 10);

  const newUser = await userModel.create({
    username,
    fullName,
    email,
    password: hashPassword,
    profileImage,
  });

  const tokenData = {
    _id: newUser._id,
  };

  const token = jwt.sign({ id: tokenData }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES,
  });

  // Set cookie with various options for security
  res.cookie("token", token, {
    httpOnly: true, // Prevents client-side JS from reading the cookie
    //   secure: process.env.NODE_ENV === "production", // HTTPS only in production
    secure: true,
    sameSite: "strict", // CSRF protection
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
  });

  // Remove password from response
  const userResponse = {
    id: newUser._id,
    username: newUser.username,
    fullName: newUser.fullName,
    email: newUser.email,
    role: newUser.role,
    profileImage: newUser.profileImage,
  };

  res.status(201).json({
    success: true,
    message: "User created successfully",
    responseData: userResponse,
  });
});

export const login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new errorHandler("All fields are required", 400));
  }

  // Fix: Include password field for comparison
  const existingUser = await userModel.findOne({ email }).select("+password");

  if (!existingUser) {
    return next(new errorHandler("Wrong Credentials", 400));
  }

  const isMatch = await bcrypt.compare(password, existingUser.password);
  if (!isMatch) {
    return next(new errorHandler("Invalid Password", 400));
  }

  const token = jwt.sign(
    {
      id: existingUser._id,
      role: existingUser.role,
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES }
  );

  res.cookie("token", token, {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  const userResponse = {
    id: existingUser._id,
    username: existingUser.username,
    fullName: existingUser.fullName,
    email: existingUser.email,
    role: existingUser.role,
    profileImage: existingUser.profileImage,
  };

  res.status(200).json({
    success: true,
    message: "Login successful",
    responseData: userResponse,
  });
});

export const logout = asyncHandler(async (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: true,
    sameSite: "none",
  });

  return res.status(200).json({
    success: true,
    message: "Logged out successfully",
  });
});

export const getProfile = asyncHandler(async (req, res, next) => {
  const user = req.user;

  res.status(200).json({
    success: true,
    responseData: user,
  });
});

export const getOtherUsers = asyncHandler(async (req, res, next) => {
  const otherUsers = await userModel
    .find({ _id: { $ne: req.user._id } })
    .select(" email fullName  profileImage username");

  res.status(200).json({
    success: true,
    responseData: otherUsers,
  });
});

export const searchUsers = async (req, res) => {
  try {
    const { query } = req.params;

    if (!query || query.trim() === "") {
      return res.status(400).json({ message: "Search query required" });
    }

    // Search by username or fullName (case-insensitive)
    const users = await userModel
      .find({
        $or: [
          { username: { $regex: query, $options: "i" } },
          { fullName: { $regex: query, $options: "i" } },
        ],
      })
      .select("username fullName profileImage _id") // send only public data
      .limit(20);

    res.status(200).json({
      message: "Users found successfully",
      responseData: users,
      count: users.length,
    });
  } catch (error) {
    console.error("Search error:", error);
    res.status(500).json({ message: "Server error while searching users" });
  }
};

export const getUserById = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await userModel
      .findById(userId)
      .select(
        "username fullName profileImage followersCount followingCount bio email createdAt"
      );

    if (!user) {
      return res.status(404).json({
        message: "User not found",
        responseData: null,
      });
    }

    res.status(200).json({
      message: "User found successfully",
      responseData: user,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
      responseData: null,
    });
  }
};
