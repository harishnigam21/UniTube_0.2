import { NextFunction, Request, Response } from "express";

const channelUpdateValidation = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { channelName, channelBanner, channelPicture, description } = req.body;

  // Helper to send response and stop execution immediately
  const sendError = (error: unknown) => {
    return res.status(422).json({ success: false, message: error });
  };

  // 1. Channel Name Check (Optional update)
  if (channelName !== undefined) {
    if (typeof channelName !== "string" || channelName.trim().length < 4) {
      return sendError(
        "Channel name must be a string and at least 4 characters long.",
      );
    }
  }

  // URL Regex for Banner and Picture
  const urlRegex = /^(https?:\/\/.*\.(?:png|jpg|jpeg|gif|webp))$/i;

  // 2. Channel Banner Check (Optional update)
  if (channelBanner) {
    if (channelBanner.trim().length === 0) {
      return sendError("Channel banner cannot be empty.");
    }
    if (!urlRegex.test(channelBanner)) {
      return sendError(
        "Invalid channelBanner URL. Must be a valid image link.",
      );
    }
  }

  // 3. Channel Picture Check (Optional update)
  if (channelPicture) {
    if (channelPicture.trim().length === 0) {
      return sendError("Channel banner cannot be empty.");
    }
    if (!urlRegex.test(channelPicture)) {
      return sendError(
        "Invalid channelPicture URL. Must be a valid image link.",
      );
    }
  }

  // 4. Description Check (Optional update)
  if (description !== undefined) {
    if (typeof description !== "string") {
      return sendError("Description must be a string.");
    }
  }

  // If all checks pass
  console.log("Channel Update Validation Successful");
  next();
};

export default channelUpdateValidation;
