import { NextFunction, Request, Response } from "express";

const handlerValidation = (req: Request, res: Response, next: NextFunction) => {
  const channelHandler = req.params.handler as string;

  // Helper to send response and stop execution immediately
  const sendError = (error: unknown) => {
    return res.status(422).json({ success: false, message: error });
  };
  const HANDLER_REGEX = /^@[a-z0-9._-]{3,30}$/;
  if (!channelHandler.startsWith("@"))
    return sendError("Handler must start with @");
  if (channelHandler.length < 4)
    return sendError("Too short (min 3 chars after @)");
  if (channelHandler.length > 31)
    return sendError("Too long (max 30 chars after @)");
  if (!HANDLER_REGEX.test(channelHandler))
    return sendError(
      "Only letters, numbers, dots, hyphens, and underscores allowed",
    );
  // If all checks pass
  console.log("handler Validation Successful");
  next();
};

export default handlerValidation;
