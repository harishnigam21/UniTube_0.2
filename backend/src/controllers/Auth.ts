import Users from "../models/User.js";
import bcrypt from "bcrypt";
import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import envVariables from "../envConfig.js";
import { getServerError } from "../utils/serverError.js";

// login controller that takes will be taking email and password from body, check user availability if user exist then check for password using bcrypt because in DB password is encrypted and here in body it is plain text, after successful login it will generate two tokens access and refresh using jwt with user id payload, both will be provided to user access token direct with response and refresh with cookie, refresh have longer live time and access token have shorter time, refresh token helps to generate access token again, refresh is defer with access in terms of access time and also refresh token is stored in DB, so whenever access token expired refresh request will be send it wil check in DB for same refresh token and for valid user it i=will regenerate refresh token
export const LogIn = async (req: Request, res: Response) => {
  const { email } = req.body;
  try {
    const ExistingUser = await Users.findOne({ email })
      .select("+password +_id")
      .lean();
    if (!ExistingUser) {
      console.error("Non-Registered User trying to login : ", email);
      return res.status(404).json({ message: "You are not registered yet !" });
    }
    const comparePassword = await bcrypt.compare(
      req.body.password,
      ExistingUser.password,
    );
    if (!comparePassword) {
      console.error("Incorrect password received from : ", ExistingUser.email);
      return res
        .status(401)
        .json({ message: "Incorrect Password, Please try again" });
    }
    const access_token = jwt.sign(
      { id: ExistingUser._id },
      envVariables.ACCESS_TOKEN_KEY as string,
      { expiresIn: "1d" },
    );
    const refresh_token = jwt.sign(
      { id: ExistingUser._id },
      envVariables.REFRESH_TOKEN_KEY as string,
      { expiresIn: "7d" },
    );
    const updateRefreshToken = await Users.findByIdAndUpdate(
      ExistingUser._id,
      {
        $set: { refreshToken: refresh_token },
      },
      { new: true, runValidators: true },
    );
    res.cookie("jwt", refresh_token, {
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000,
    }); //TODO: add secure:true at production level
    console.log("Successfully Verified User : ", ExistingUser.email);
    return res.status(200).json({
      message: "Successfully Verified User",
      actk: access_token,
      user: updateRefreshToken,
    });
  } catch (error) {
    getServerError(res, error, "LogIn controller");
  }
};

//Register controller this will take all necessary field from body, check for user existence if not available then encrypt the password using bcrypt and store whole information in DB
export const Register = async (req: Request, res: Response) => {
  try {
    const {
      firstname,
      middlename,
      lastname,
      gender,
      dob,
      email,
      mobileno,
      password,
    } = req.body;
    const userExist = await Users.findOne({ email });

    if (userExist) {
      console.error(
        "Registered User trying to register again : ",
        userExist.email,
      );
      return res.status(403).json({ message: "Email ID already exist" });
    }
    const encryptedPassword = await bcrypt.hash(password, 5);
    const newUser = {
      firstname,
      middlename: middlename || "",
      lastname,
      gender,
      dob,
      email,
      mobileno,
      password: encryptedPassword,
    };
    const createUser = await Users.create(newUser);
    if (!createUser) {
      console.error("Failed to create new User");
      return res.status(503).json({ message: "Failed to create new User" });
    }
    console.log("Successfully Created User : ", email);
    return res
      .status(201)
      .json({ message: "User has been registered Successfully " });
  } catch (error) {
    getServerError(res, error, "Register Controller");
  }
};
//TODO: Not necessary now, priority-low
export const ForgotPassword = async (req: Request, res: Response) => {};

//This controller will handle the regeneartion of access token until refresh token is valid, if all thinks good, it will take refresh token from cookie, match refresh token in DB to find out user, if got valid user then verifying it using jwt, if verified regenerating access token for that user and sending it through response
export const handleRefresh = async (req: Request, res: Response) => {
  try {
    const cookies = req.cookies;
    if (!cookies?.jwt)
      return res.status(401).json({ message: "Cookie missing" });
    const findUser = await Users.findOne({ refreshToken: cookies.jwt })
      .select("+refreshToken +_id")
      .lean();
    if (!findUser) {
      res.clearCookie("jwt", { httpOnly: true, maxAge: 24 * 60 * 60 * 1000 });
      return res.status(403).json({ message: "Invalid payload" });
    }
    const { refreshToken, ...other } = findUser;
    jwt.verify(
      findUser.refreshToken,
      envVariables.REFRESH_TOKEN_KEY as string,
      (err: jwt.VerifyErrors | null, decoded: any) => {
        if (err || findUser._id != decoded.id)
          return res.status(403).json({ status: false });
        const access_token = jwt.sign(
          { id: decoded.id },
          envVariables.ACCESS_TOKEN_KEY as string,
          { expiresIn: "1d" },
        );
        return res.status(200).json({ acTk: access_token, userInfo: other });
      },
    );
  } catch (error) {
    getServerError(res, error, "handleRefresh controller");
  }
};

//This controller handles user logout, which will validated user, in both cases it will wipe out refresh token from cookie, so that further access token generation can be avoided
export const logOut = async (req: Request, res: Response) => {
  try {
    const cookies = req.cookies;
    if (!cookies?.jwt)
      return res.status(401).json({ message: "Cookie missing" });
    const findUser = await Users.findOne({ refreshToken: cookies.jwt })
      .select("+refreshToken +_id")
      .lean();
    if (!findUser) {
      res.clearCookie("jwt", { httpOnly: true, maxAge: 24 * 60 * 60 * 1000 }); //TODO:Add secure:true at production side
      return res.status(200).json({ status: true });
    }
    await Users.findOneAndUpdate(
      {
        refreshToken: findUser.refreshToken,
      },
      { $set: { refreshToken: "" } },
    );
    res.clearCookie("jwt", { httpOnly: true, maxAge: 24 * 60 * 60 * 1000 }); //TODO:Add secure:true at production side
    return res.status(200).json({ status: true });
  } catch (error) {
    getServerError(res, error, "logOut controller");
  }
};
