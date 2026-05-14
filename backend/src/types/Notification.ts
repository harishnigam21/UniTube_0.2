import mongoose from "mongoose";

export interface commonNotify {
  id: mongoose.Types.ObjectId;
  message: string;
  createdAt: NativeDate;
  link: string | null;
  type: string;
  channelBanner: string | null;
}
