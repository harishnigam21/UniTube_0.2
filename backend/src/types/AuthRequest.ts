import { Request } from "express";
import mongoose from "mongoose";
export interface AuthRequest extends Request {
  user?: {
    firstname: string;
    middlename?: string | null;
    lastname: string;
    pic?: string | null;
    gender: string;
    dob: string;
    email: string;
    subscription: mongoose.Types.ObjectId[];
    channels: mongoose.Types.ObjectId[];
  };
}
