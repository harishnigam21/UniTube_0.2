import { NextFunction, Request, Response } from "express";
import fs from "fs";

const channelValidation = (req: Request, res: Response, next: NextFunction) => {
  const { channelName, channelHandler } = req.body;
  const files = req.files; // Multer puts files here, not in req.body

  // Helper to delete files if validation fails (prevents server clutter)
  const cleanupAndError = (error: unknown) => {
    if (req.files) {
      Object.values(req.files)
        .flat()
        .forEach((file) => {
          if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
        });
    }
    return res.status(422).json({ success: false, message: error });
  };

  // 1. Channel Name Check
  if (!channelName || channelName.trim().length < 4) {
    return cleanupAndError("Channel name must be at least 4 characters long.");
  }

  // 3. Channel Picture Check
  if (!files || !("channelPicture" in files) || !files["channelPicture"]?.[0]) {
    return cleanupAndError("Channel profile picture is required.");
  }

  // 5. Channel Handler Check
  const HANDLER_REGEX = /^@[a-z0-9._-]{3,30}$/;
  if (!channelHandler || !channelHandler.startsWith("@")) {
    return cleanupAndError("Handler must start with @");
  }
  if (!HANDLER_REGEX.test(channelHandler)) {
    return cleanupAndError("Handler contains invalid characters.");
  }

  console.log("Channel Validation Successful");
  next(); // Move to Controller
};

export default channelValidation;
