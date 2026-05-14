import { NextFunction, Request, Response } from "express";
import mongoose from "mongoose";
// This middleware simply checks the id is valid or not & id is there or not in params.
const Validate = (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;
  if (!id || typeof id != "string") {
    return res.status(422).json({ message: "Missing product ID" });
  }
  //mongoose.Types.ObjectId.isValid(id), provide by mongoose to validate id
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(417).json({
      success: false,
      message: "Invalid product ID format",
    });
  }
  console.log("Mongoose ID Verified");
  next();
};
export default Validate;
