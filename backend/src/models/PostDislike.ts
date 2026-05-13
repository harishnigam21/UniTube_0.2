import mongoose from "mongoose";
const postDislikeSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
    },
    post_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "posts",
      required: true,
    },
  },
  { timestamps: true },
);
postDislikeSchema.index({ user_id: 1, post_id: 1 }, { unique: true });
export default mongoose.model("dislikes", postDislikeSchema);
