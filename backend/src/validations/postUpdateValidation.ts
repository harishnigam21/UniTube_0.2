import { NextFunction, Request, Response } from "express";
import fs from "fs";

const postUpdateValidation = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { category, tags, description, details } = req.body;
  const files = req.files;

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

  // 1. Thumbnail Check
  // Only validate if 'files' exists (Multer populated it)
  if (files && "thumbnail" in files) {
    if (!files["thumbnail"]?.[0]) {
      return sendError("Invalid file field. Please upload to 'thumbnail'.");
    }
  }

  // 2. Category (Optional: only validate if provided)
  if (category !== undefined) {
    if (typeof category !== "string" || category.trim().length < 2) {
      return sendError("Category must be at least 2 characters.");
    }
  }

  // 3. Tags (Optional: only validate if provided)
  if (tags !== undefined) {
    if (typeof tags !== "string") {
      return sendError("Tags must be a comma-separated string.");
    }
    const tagArray = tags
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t !== "");

    if (tagArray.length === 0) {
      return sendError(
        "If providing tags, at least one valid tag is required.",
      );
    }
    // Update req.body with the cleaned array so the controller can use it directly
    req.body.tags = tagArray;
  }

  // 4. Description (Optional)
  if (description !== undefined) {
    if (typeof description !== "string") {
      return sendError("Description must be a string.");
    }
  }

  // 5. Details (Parsing required!)
  // Since FormData stringifies objects, 'details' is a string here.
  if (details !== undefined) {
    try {
      const parsedDetails = JSON.parse(details);
      if (
        typeof parsedDetails !== "object" ||
        Array.isArray(parsedDetails) ||
        parsedDetails === null
      ) {
        throw new Error();
      }
      // Put the parsed object back into req.body for the database logic
      req.body.details = parsedDetails;
    } catch (err) {
      return sendError("Details must be a valid JSON object.");
    }
  }
  console.log("Post Update Validation Passed");
  next();
};

export default postUpdateValidation;
