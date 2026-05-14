import mongoose from "mongoose";
const NotificationSchema = new mongoose.Schema(
  {
    from: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
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
    message: { type: String, required: true },
  },
  { timestamps: true },
);
export default mongoose.model("notifications", NotificationSchema);
