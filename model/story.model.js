import mongoose from "mongoose";

const storySchema = new mongoose.Schema(
  {
    // Who posted the story
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    imageUrl: {
      type: String,
      required: true,
    },
    caption: {
      type: String,
      default: "",
    },
    // Array of users who have viewed the story
    viewers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  { timestamps: true }
);

// --- THE MAGIC HAPPENS HERE ---
// Create a TTL index on the `expiresAt` field. "Time-to-live" (TTL)
// MongoDB will automatically delete documents where `expiresAt` is past the current time.
// this below use upper 2 line are not currently in use.
// The `expireAfterSeconds: 0` tells MongoDB to delete the doc as soon as the time in `expiresAt` is reached.

// TTL Index on createdAt - MongoDB will delete documents 24 hours after creation
storySchema.index({ createdAt: 1 }, { expireAfterSeconds: 86400 }); // 86400 seconds = 24 hour

const storyModel = mongoose.model("Story", storySchema);
export default storyModel;
