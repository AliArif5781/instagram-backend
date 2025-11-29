import followModel from "../model/follow.model.js";
import postModel from "../model/post.model.js";
import userModel from "../model/user.model.js";
import { asyncHandler } from "../utilities/asyncHandler.utilities.js";
import { errorHandler } from "../utilities/errorHandler.utilities.js";

export const createPost = asyncHandler(async (req, res, next) => {
  const { imageUrl, caption, mediaType } = req.body;

  if (!imageUrl || !caption || caption.trim().length === 0) {
    return next(new errorHandler("All fields are required", 400));
  }

  if (!mediaType || !["image", "video"].includes(mediaType)) {
    return next(new errorHandler("Invalid media type", 400));
  }

  const newPost = await postModel.create({
    imageUrl,
    caption: caption,
    mediaType,
    author: req.user._id,
  });

  const savedPost = await newPost.save();

  const populatedPost = await postModel
    .findById(savedPost._id)
    .populate("author", "username email")
    .exec();

  res.status(201).json({
    success: true,
    message: "Post created successfully",
    responseData: populatedPost,
  });
});

// each user post in his/her profile.
export const getAllPost = asyncHandler(async (req, res, next) => {
  const posts = await postModel
    .find({ author: req.user._id })
    .populate("author", "username  profileImage")
    .populate("comments.user", "username profileImage")
    .populate("likes", "username profileImage")
    .sort({ createdAt: -1 })
    .lean();

  if (!posts || posts.length === 0) {
    return res.status(200).json({
      success: true,
      count: 0,
      responseData: [],
      message: "No posts found",
    });
  }

  res.status(200).json({
    success: true,
    count: posts.length,
    responseData: posts,
  });
});

export const getSearchUserPost = asyncHandler(async (req, res, next) => {
  const { userId } = req.params;

  const posts = await postModel
    .find({ author: userId })
    .populate("author", "username email profileImage")
    .populate("comments.user", "username profileImage")
    .populate("likes", "username profileImage")
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: posts.length,
    responseData: posts,
  });
});

export const updateUserProfile = asyncHandler(async (req, res, next) => {
  const { fullName, username, bio, City, Country } = req.body;
  const userId = req.user._id;

  const user = await userModel.findById(userId);
  if (!user) {
    return next(new errorHandler("User not found", 404));
  }

  if (username && username !== user.username) {
    const existingUser = await userModel.findOne({ username });
    if (existingUser) {
      return next(new errorHandler("Username is already taken", 400));
    }
  }

  const updateFields = {};
  if (fullName !== undefined) updateFields.fullName = fullName;
  if (username !== undefined) updateFields.username = username;
  if (bio !== undefined) updateFields.bio = bio;
  if (City !== undefined) updateFields.City = City;
  if (Country !== undefined) updateFields.Country = Country;

  const updatedUser = await userModel
    .findByIdAndUpdate(
      userId,
      { $set: updateFields },
      { new: true, runValidators: true }
    )
    .select("-password -refreshToken");

  // console.log(updatedUser);

  res.status(200).json({
    success: true,
    message: "Profile updated successfully",
    responseData: updatedUser,
  });
});

export const getAllFollowerPost = asyncHandler(async (req, res, next) => {
  const userId = req.user._id;
  const cursor = req.query.cursor; // e.g., ?cursor=eyJpZCI6IjY3MWZjZjAwM...==

  if (!userId) {
    return next(errorHandler("Invalid User", 400));
  }

  // Step 1: Get who the user follows
  const following = await followModel
    .find({ follower: userId }) // Extracts only the following field (user IDs being followed)
    .select("following")
    .lean();

  const followingIds = following.map((f) => f.following);
  if (followingIds.length === 0) {
    return res.json({
      success: true,
      posts: [],
      nextCursor: null,
      hasMore: false,
    });
  }

  // Step 2: Build the query
  const query = { author: { $in: followingIds } };

  // Step 3: If cursor exists → get posts BEFORE that cursor
  if (cursor) {
    try {
      const decoded = JSON.parse(Buffer.from(cursor, "base64").toString());

      query.$or = [
        { createdAt: { $lt: decoded.createdAt } },
        { createdAt: decoded.createdAt, _id: { $lt: decoded._id } },
      ];
    } catch (err) {
      return next(errorHandler("Invalid cursor", 400));
    }
  }

  // Step 4: Get 4 posts (3 + 1 extra to check if more exist)
  const posts = await postModel
    .find(query)
    .sort({ createdAt: -1, _id: -1 }) // newest first
    .limit(4) // 3 + 1
    .populate("author", "username fullName profileImage")
    .lean();

  // Step 5: Separate the extra post
  const hasMore = posts.length === 4;
  const resultPosts = hasMore ? posts.slice(0, 3) : posts;

  // Step 6: Create next cursor from the LAST post we sent
  let nextCursor = null;
  if (hasMore) {
    const lastPost = resultPosts[2]; // 3rd post (index 2)
    nextCursor = Buffer.from(
      JSON.stringify({
        createdAt: lastPost.createdAt,
        _id: lastPost._id,
      })
    ).toString("base64");
  }

  // Final response
  res.status(200).json({
    success: true,
    posts: resultPosts,
    nextCursor,
    hasMore,
  });
});

export const getAllUsersPost = asyncHandler(async (req, res, next) => {
  // Get pagination params from query
  const limit = parseInt(req.query.limit) || 3; // Posts per page
  const cursor = req.query.cursor; // Last post ID from previous request

  // Build query
  const query = {};

  // If cursor exists, get posts older than this cursor
  if (cursor) {
    // If we know the last post user saw
    query._id = { $lt: cursor }; // Less than cursor (older posts)
    // Add a rule: "Get posts with ID LESS THAN the cursor"
    // This means: "Give me OLDER posts than what I already saw"
  }

  // Fetch posts
  const posts = await postModel
    .find(query)
    .sort({ _id: -1 }) // Newest first
    .limit(limit + 1) // Fetch one extra to check if more exist
    .populate("author", "username fullName profileImage") // Include user info
    .lean(); // Faster queries

  // Check if there are more posts
  /*
  Compare actual posts count with requested limit
  Example: If we requested 3 posts and got 4, then hasMore = true
   */
  const hasMore = posts.length > limit;

  // Remove the extra post if exists
  const postsToReturn = hasMore ? posts.slice(0, -1) : posts;

  // Get next cursor (last post ID)
  const nextCursor =
    postsToReturn.length > 0
      ? postsToReturn[postsToReturn.length - 1]._id
      : null;

  res.status(200).json({
    success: true,
    message: "Posts fetched successfully",
    data: {
      posts: postsToReturn,
      pagination: {
        nextCursor,
        hasMore,
        limit,
      },
    },
  });
});

export const getAllUsersPosts = asyncHandler(async (req, res, next) => {
  const limit = parseInt(req.query.limit) || 3;
  const cursor = req.query.cursor;
  const sinceId = req.query.sinceId; // For pull-to-refresh only
  /*
  [PostC, PostB, PostA]  ← You can see these.
  Where:
    PostC = newest post (at the top)
    PostA = oldest post (at the bottom)
    Q: What is "sinceId"?
   sinceId is the ID of the FIRST POST you currently see on screen. mean the first post

   In our example:
   sinceId = PostC._id (the topmost post's ID)

   When Do You Use sinceId?
  Scenario: You pull down to refresh to check for NEW posts.
  The app says:

  "Hey server, give me any NEW posts that appeared ABOVE PostC (my current top post)"
      query._id = { $gt: sinceId };
    Find posts with ID GREATER THAN sinceId 
    Give me posts that are NEWER than my current top post
   */

  const query = {};

  if (sinceId) {
    // Get NEWER posts (pull-to-refresh during session)
    query._id = { $gt: sinceId };
  } else if (cursor) {
    // Get OLDER posts (scroll down)
    query._id = { $lt: cursor };
  }
  // If neither sinceId nor cursor: Return latest posts (initial load)

  const posts = await postModel
    .find(query)
    .sort({ _id: -1 })
    .limit(limit + 1)
    .populate("author", "username fullName profileImage")
    .lean();

  const hasMore = posts.length > limit; // 4 > 3 = true
  const postsToReturn = hasMore ? posts.slice(0, -1) : posts; // ? = get the post except last one : posts

  //  posts.slice(0, -1) = take from index 0 to second-last

  // IMPORTANT: Return BOTH first and last post IDs
  const nextCursor =
    /*
  postsToReturn.length = 3  (NOT 4 anymore!)
  postsToReturn.length - 1 = 3 - 1 = 2
  postsToReturn[2] = PostB (the last post in our return array)
  nextCursor = PostB._id
   */
    postsToReturn.length > 0 // if postsToReturn mean post.length > 0, So we proceed to calculate the cursor.
      ? postsToReturn[postsToReturn.length - 1]._id // [postsToReturn.length - 1] =  5-1 = 4 (array positions start from 0), postsToReturn[4]._id
      : //Get the ID of the last posts
        // , postsToReturn[4] = posts5 (the last coach)
        // posts5._id = Let's say it's "p5"
        // So nextCursor = "C5"

        /*
        What Does This Mean?
         nextCursor is like saying:

         "I reached up to posts5"
         "Next time, start from AFTER posts5"
          "Give me coaches that come after posts5"
         */

        null;
  // if postsToReturn = []
  /*
        postsToReturn.length = 0

0 > 0? ❌ NO

So nextCursor = null (no cursor needed)
         */

  // const nextCursor = "If we have posts, take the ID of the LAST post, otherwise use null";
  // "nextCursor is the ID of the very last post in your current list, so you know where to continue from next time."
  // It's like putting a bookmark on the last page you read, so you know where to start next time!

  const firstPostId = postsToReturn.length > 0 ? postsToReturn[0]._id : null;
  // postsToReturn[0]._id mean first post we see on posts reel section

  res.status(200).json({
    success: true,
    data: {
      posts: postsToReturn,
      pagination: {
        nextCursor, // For loading older posts
        firstPostId, // For pull-to-refresh
        hasMore,
        limit,
      },
    },
  });
});
