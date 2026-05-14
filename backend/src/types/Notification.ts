import mongoose from "mongoose";

export interface commonNotify {
  notificationID: mongoose.Types.ObjectId;
  message: string;
  createdAt: NativeDate;
  link: string;
}
