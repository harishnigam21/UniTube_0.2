import { NextFunction, Response } from "express";
import User from "../models/User";
import jwt from "jsonwebtoken";
import envVariables from "../envConfig";
import { AuthRequest } from "../types/AuthRequest";
//This middleware checks request by accessing their token attached at req header, using jwt.verify it will verify and return result as per token validation. If token validates user can move forward otherwise unauthorized.
const jwtVerifier = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const header = req.headers["authorization"];
    if (!header) {
      return res
        .status(401)
        .json({ message: "Looks Like you have not login yet" });
    }
    const token = header.split(" ")[1]; // bearer token...
    if (!token) {
      return res.status(403).json({ message: "Invalid token format" });
    }
    console.log("1.1 Verifying Token...");
    const decoded = jwt.verify(
      token,
      envVariables.ACCESS_TOKEN_KEY as string,
    ) as { id: string };
    console.log("1.2 Token Verified Successfully");
    console.log("2.1 Checking User Existence...");
    const UserExist = await User.findById(decoded.id).lean();
    if (!UserExist) {
      console.error("2.2 User no longer exists");
      return res.status(404).json({ message: "User no longer exists" });
    }
    console.log("2.2 User Existence passed");
    req.user = UserExist;
    next();
  } catch (err) {
    //All kind of jwt error is handled
    if (err instanceof jwt.TokenExpiredError) {
      return res
        .status(421)
        .send({ error: "Auth token expired. Please refresh." });
    }
    if (err instanceof jwt.JsonWebTokenError) {
      if (err.message === "invalid signature") {
        return res
          .status(403)
          .send({ error: "Security alert: Invalid signature." });
      }
      return res.status(400).send({ error: "Token is malformed or invalid." });
    }
    if (err instanceof jwt.NotBeforeError) {
      return res
        .status(403)
        .send({ error: "Token not active yet. Check your system clock." });
    }
    console.error("Verifier Side Error : ", err);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};
export default jwtVerifier;
