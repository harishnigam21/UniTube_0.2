import mongoose from "mongoose";
const userSchema = new mongoose.Schema(
  {
    firstname: {
      type: String,
      required: true,
    },
    middlename: {
      type: String,
    },
    lastname: {
      type: String,
      required: true,
    },
    pic: {
      type: String,
      default: null,
    },
    gender: {
      type: String,
      required: true,
    },
    dob: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
      unique: true,
      select: false,
    },
    refreshToken: {
      type: String,
      required: true,
      default: "Newly Registered User",
      select: false,
    },
    subscription: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "channels",
      },
    ],
    channels: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "channels",
        default: [],
      },
    ],
  },
  { timestamps: true },
);
export default mongoose.model("users", userSchema);
