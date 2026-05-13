import mongoose from "mongoose";
const channelSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
    },
    channelName: {
      type: String,
      required: true,
    },
    channelHandler: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    channelBanner: { type: String },
    channelPicture: { type: String, required: true },
    description: { type: String, default: "Description not provided" },
    subscribers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users",
      },
    ],
  },
  { timestamps: true },
);
channelSchema.index({ channelHandler: 1 }, { unique: true });
channelSchema.index({ createdAt: -1 });

export default mongoose.model("channels", channelSchema);
