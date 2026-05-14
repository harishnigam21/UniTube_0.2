import mongoose from "mongoose";
const NotificationSchema = new mongoose.Schema(
  {
    from: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "channels",
      required: true,
    },
    to: [
      {
        _id: false,
        id: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "users",
          required: true,
        },
        status: {
          type: Boolean,
          default: false,
        },
      },
    ],
    type: { type: String, required: true },
    message: { type: String, required: true },
    link: { type: String || null, default: null },
  },
  { timestamps: true },
);
export default mongoose.model("notifications", NotificationSchema);
