import mongoose from "mongoose";
const postSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
    },
    channel_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "channels",
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    type: {
      //video,short,audio,news,podcast
      type: String,
      set: (v: string) => v.toLowerCase(),
      enum: [
        "video",
        "short",
        "audio",
        "news",
        "podcast",
        "playlist",
        "course",
      ],
      required: true,
    },
    category: {
      type: String,
      required: true,
    },

    tags: {
      type: [String],
      default: [],
    },
    thumbnail: {
      type: String,
      required: true,
    },
    videoURL: {
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
    views: { type: Number, default: 0 },
    postedAt: {
      type: String,
      required: true,
    },
    duration: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: "Description not provided",
    },
    details: {
      type: Map,
      of: String, // This means values will be strings
    },
  },
  { timestamps: true },
);
postSchema.index({ channel_id: 1, createdAt: -1 });
postSchema.index({ category: 1 });
postSchema.index({ tags: 1 });
postSchema.index({ category: 1, createdAt: -1 });
export default mongoose.model("posts", postSchema);
