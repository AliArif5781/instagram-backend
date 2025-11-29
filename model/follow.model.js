// models/follow.model.js
import mongoose from "mongoose";

const followSchema = new mongoose.Schema(
  {
    follower: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    following: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate follows
followSchema.index({ follower: 1, following: 1 }, { unique: true });

/*
🚫 Prevents duplicate follows
Alice can only follow Bob once
Without this, Alice could follow Bob multiple times
 */
const followModel = mongoose.model("Follow", followSchema);
export default followModel;

/*
Creates a schema to store "who follows whom"

follower: The user who is doing the following (the one clicking "Follow")

following: The user who is being followed (the one receiving the follow)

The unique index prevents the same user from following another user multiple times

Example document: { follower: "user123", following: "user456" } means user123 follows user456
 */
