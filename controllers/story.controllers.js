import followModel from "../model/follow.model.js";
import storyModel from "../model/story.model.js";
import postModel from "../model/post.model.js";
import { asyncHandler } from "../utilities/asyncHandler.utilities.js";
import { errorHandler } from "../utilities/errorHandler.utilities.js";

export const Story = asyncHandler(async (req, res, next) => {
  const userId = req.user._id;

  const { imageUrl, caption } = req.body;

  if (!imageUrl || !caption) {
    return next(errorHandler("All field are required", 400));
  }

  const newStory = await storyModel.create({
    user: userId,
    imageUrl,
    caption,
    viewers: [],
  });
  // console.log(`✅ Story created at: ${new Date()}`);
  // console.log(`📝 Story ID: ${newStory._id}`);
  // console.log(
  //   `⏰ Will expire at: ${new Date(newStory.createdAt.getTime() + 30000)}`
  // );

  await newStory.populate("user", "username fullName profileImage");

  res.status(201).json({
    success: true,
    message: "Story add successfully",
    responseData: newStory,
  });
});

export const getStories = asyncHandler(async (req, res, next) => {
  const userId = req.user._id;
  // console.log(userId, "followerID");

  const following = await followModel
    .find({ follower: userId })
    .select("following");

  const followingIds = following.map((follow) => follow.following);

  const storyUsersId = [userId, ...followingIds];

  const stories = await storyModel
    .find({
      user: { $in: storyUsersId },
    })
    .populate("user", "username fullName profileImage")
    .sort({ createdAt: -1 });

  // Sort stories: logged-in user's stories first, then others
  // Step 1: Check if stories belong to current user
  // - Checks if story "a" belongs to logged-in user
  // - Checks if story "b" belongs to logged-in user

  const sortedStories = stories.sort((a, b) => {
    const aIsCurrentUser = a.user._id.toString() === userId.toString();
    const bIsCurrentUser = b.user._id.toString() === userId.toString();

    // Step 2: Priority 1 - Current User's Stories First
    if (aIsCurrentUser && !bIsCurrentUser) return -1; // a comes first
    /*
    Scenario: a is current user's story, b is NOT current user's story
    Result: a comes before b ✅ (current user story first)
     */
    if (!aIsCurrentUser && bIsCurrentUser) return 1; // b comes first
    /*
    Scenario: a is NOT current user's story, b IS current user's story
    Result: b comes before a ✅ (current user story first)
     */
    return new Date(b.createdAt) - new Date(a.createdAt); // both same user type, sort by date
    /*
    Scenario: Both stories are from same type of user (both current user OR both other users)
    Logic: b.createdAt - a.createdAt = newer stories first (descending order)
     */
  });

  res.status(200).json({
    success: true,
    responseData: sortedStories,
  });
});
