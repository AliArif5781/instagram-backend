import followModel from "../model/follow.model.js";
import userModel from "../model/user.model.js";
import { asyncHandler } from "../utilities/asyncHandler.utilities.js";
import { errorHandler } from "../utilities/errorHandler.utilities.js";

export const followUser = async (req, res) => {
  try {
    const { userId } = req.params; // This is the user whose profile you are currently viewing.
    const followerId = req.user._id; // This is YOUR user ID (the one who is logged in).

    if (userId === followerId.toString()) {
      return res.status(400).json({ message: "You cannot follow yourself" });
    }

    // Check if already following
    const existingFollow = await followModel.findOne({
      follower: followerId,
      following: userId,
    });

    if (existingFollow) {
      return res.status(400).json({ message: "Already following this user" });
    }

    // Create follow relationship
    const follow = new followModel({
      // uska follower ma mariId and mari following ma uskiID.
      follower: followerId,
      following: userId,
    });

    await follow.save();

    // Update follower count
    await userModel.findByIdAndUpdate(userId, { $inc: { followersCount: 1 } });
    await userModel.findByIdAndUpdate(followerId, {
      $inc: { followingCount: 1 },
    });

    res.status(200).json({
      message: "User followed successfully",
      responseData: follow,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Unfollow a user
export const unfollowUser = asyncHandler(async (req, res, next) => {
  const { userId } = req.params;
  const followerId = req.user._id;

  console.log("🔍 Unfollow - Looking for follow relationship:");
  console.log("Follower:", followerId);
  console.log("Following:", userId);

  const follow = await followModel.findOneAndDelete({
    follower: followerId,
    following: userId,
  });

  if (!follow) {
    return next(errorHandler("Not following this user", 400));
  }

  await userModel.findByIdAndUpdate(userId, { $inc: { followersCount: -1 } });
  await userModel.findByIdAndUpdate(followerId, {
    $inc: { followingCount: -1 },
  });

  res.status(200).json({
    message: "User unfollowed successfully",
  });
});

export const getFollowers = asyncHandler(async (req, res, next) => {
  const { userId } = req.params;

  const followers = await followModel
    .find({ following: userId })
    .populate("follower", "username fullName profileImage email")
    .sort({ createdAt: -1 });

  // Transform the data to return user profiles directly
  const followerProfiles = followers.map((follow) => ({
    _id: follow.follower._id,
    username: follow.follower.username,
    fullName: follow.follower.fullName,
    profileImage: follow.follower.profileImage,
    email: follow.follower.email,
    followedAt: follow.createdAt,
  }));

  res.status(200).json({
    success: true,
    message: "Followers fetched successfully",
    count: followerProfiles.length,
    responseData: followerProfiles,
  });
});

export const getFollowing = asyncHandler(async (req, res, next) => {
  const { userId } = req.params;

  const following = await followModel
    .find({ follower: userId })
    .populate("following", "username fullName profileImage email")
    .sort({ createdAt: -1 });

  // Transform the data to return user profiles directly
  const followingProfiles = following.map((follow) => ({
    _id: follow.following._id,
    username: follow.following.username,
    fullName: follow.following.fullName,
    profileImage: follow.following.profileImage,
    email: follow.following.email,
    followedAt: follow.createdAt,
  }));

  res.status(200).json({
    success: true,
    message: "Following users fetched successfully",
    count: followingProfiles.length,
    responseData: followingProfiles,
  });
});

export const getFollowStatus = asyncHandler(async (req, res, next) => {
  const { userId } = req.params; // The user we're checking if current user follows
  const followerId = req.user._id; // Current logged-in user

  const existingFollow = await followModel.findOne({
    follower: followerId,
    following: userId,
  });

  res.status(200).json({
    message: "Follow status fetched successfully",
    responseData: {
      isFollowing: !!existingFollow, // Convert to boolean
    },
  });
});

// New controller to get follow counts and basic info
export const getFollowStats = asyncHandler(async (req, res, next) => {
  const { userId } = req.params;

  const followersCount = await followModel.countDocuments({
    following: userId,
  });
  const followingCount = await followModel.countDocuments({ follower: userId });

  res.status(200).json({
    success: true,
    message: "Follow stats fetched successfully",
    responseData: {
      followersCount,
      followingCount,
    },
  });
});

export const suggestedForYou = asyncHandler(async (req, res, next) => {
  // This means: "Find all records where I am the FOLLOWER" = "People that I follow"
  // jinko mana follow kiya hova ha.
  const userIFollow = await followModel
    .find({
      follower: req.user._id,
    })
    .select("following");

  // Get the IDs of people you follow
  //  jinko mana follow kiya unki following id mean , jinko mara dost na follow kr raka ha.
  const followingIds = userIFollow.map((item) => item.following._id);

  // This gives you all the follow relationships where your friends are the followers.

  const whoTheyFollow = await followModel
    .find({
      // $in means "match any of these values"
      follower: { $in: followingIds },
    })
    .populate("following", "username fullName profileImage");

  res.status(200).json({
    success: true,
    responseData: whoTheyFollow,
  });
});
