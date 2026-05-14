import { NextFunction, Request, Response } from "express";
import fs from "fs";
const postValidation = (req: Request, res: Response, next: NextFunction) => {
  const { channel_id, title, type, category, tags, description, details } =
    req.body;
  const files = req.files;

  // Helper to send response and stop execution immediately
  const sendError = (error: unknown) => {
    if (req.files) {
      Object.values(req.files)
        .flat()
        .forEach((file) => {
          if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
        });
    }
    return res.status(422).json({ success: false, message: error });
  };

  // 1. Channel ID (MongoDB ObjectId format)
  const objectIdRegex = /^[0-9a-fA-F]{24}$/;
  if (!channel_id || !objectIdRegex.test(channel_id)) {
    return sendError("Invalid or missing channel_id");
  }

  // 2. Title
  if (!title || typeof title !== "string" || title.trim().length < 3) {
    return sendError("Title is required and must be at least 3 characters");
  }

  // 3. Type
  const allowedTypes = [
    "video",
    "short",
    "audio",
    "news",
    "podcast",
    "playlist",
  ];
  if (!type || !allowedTypes.includes(type.toLowerCase())) {
    return sendError(`Invalid type. Allowed types: ${allowedTypes.join(", ")}`);
  }

  // 4. Category
  if (!category || category.length < 2) {
    return sendError("Missing or Invalid Category");
  }

  // 5. Tags
  if (!tags || typeof tags !== "string") {
    return sendError("Tags must be provided");
  }
  // Split and clean the data
  const tagArray = tags
    .split(",")
    .map((t) => t.trim())
    .filter((t) => t !== "");
  //  Check if we actually have tags after cleaning
  if (tagArray.length === 0) {
    return sendError("At least one valid tag must be provided");
  }

  // 6. Thumbnail and Video URL
  if (!files || !("thumbnail" in files) || !files["thumbnail"]?.[0]) {
    return sendError("Thumbnail is required.");
  }
  if (!files || !("videoURL" in files) || !files["videoURL"]?.[0]) {
    return sendError("Video is required.");
  }

  // 7. Description (optional)
  if (description !== undefined && typeof description !== "string") {
    return sendError("Description must be a string");
  }

  // 8. Details (optional object for extra metadata)
  if (
    typeof JSON.parse(details) !== "object" ||
    Object.keys(JSON.parse(details)).length == 0
  ) {
    return sendError("Details is not valid or may it is empty");
  }

  // If it reaches here, everything is valid
  console.log("Post Validation Successful");
  next();
};

export default postValidation;
