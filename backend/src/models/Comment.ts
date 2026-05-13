import mongoose from "mongoose";
const commentSchema = new mongoose.Schema(
  {
    post_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "posts",
      required: true,
    },
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
    },
    parent_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "comments",
      default: null,
    },
    commentText: {
      type: String,
      required: true,
    },
    likes: {
      type: Number,
      default: 0,
    },
    dislikes: {
      type: Number,
      default: 0,
    },
    postedAt: {
      type: String,
      required: true,
    },
  },
  { timestamps: true },
);
commentSchema.index({ post_id: 1, createdAt: 1 });
export default mongoose.model("comments", commentSchema);
