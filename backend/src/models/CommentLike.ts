import mongoose from "mongoose";
const commentLikeSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
    },
    comment_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "comments",
      required: true,
    },
  },
  { timestamps: true }
);
commentLikeSchema.index({ user_id: 1, comment_id: 1 }, { unique: true });

export default mongoose.model("commentLikes", commentLikeSchema);
