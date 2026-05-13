import mongoose from "mongoose";
const commentDislikeSchema = new mongoose.Schema(
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
commentDislikeSchema.index({ user_id: 1, comment_id: 1 }, { unique: true });
export default mongoose.model("commentDislikes", commentDislikeSchema);
