import { getVideoDurationInSeconds } from "get-video-duration";
import Post from "../models/Post.js";
import mongoose from "mongoose";
import Channel from "../models/Channel.js";
import { getNextDate } from "../utils/getDate.js";
import formatDuration from "../utils/getTime.js";
import fs from "fs";
import path from "path";
import { Request, Response } from "express";
import { AuthRequest } from "../types/AuthRequest.js";
import { safeUnlink } from "../utils/safeUnlink.js";
import { getServerError } from "../utils/serverError.js";
import { io, userSockedIds } from "../socket.js";
import { commonNotify } from "../types/Notification.js";
import Notification from "../models/Notification.js";
import Comment from "../models/Comment.js";
import PostLike from "../models/PostLike.js";
import PostDislike from "../models/PostDislike.js";
import CommentLike from "../models/CommentLike.js";
import CommentDislike from "../models/CommentDislike.js";
//TODO: Add views functionality and video public, private property, for this you have to update model and then in controller

//This controller  provides the post based on id, which is provided in req.params, aggregation is used to join tables and take out mix fields that will be required.
export const getPost = async (req: AuthRequest, res: Response) => {
  const postId = new mongoose.Types.ObjectId(req.params.id as string);
  const userId = new mongoose.Types.ObjectId(req.user!.id);
  try {
    const result = await Post.aggregate([
      { $match: { _id: postId } },
      {
        $lookup: {
          from: "channels",
          localField: "channel_id",
          foreignField: "_id",
          as: "channel_id",
        },
      },
      { $unwind: "$channel_id" },
      {
        $lookup: {
          from: "users",
          localField: "user_id",
          foreignField: "_id",
          as: "user_id",
        },
      },
      { $unwind: "$user_id" },
      {
        $lookup: {
          from: "likes",
          let: { pId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$post_id", "$$pId"] },
                    { $eq: ["$user_id", userId] },
                  ],
                },
              },
            },
          ],
          as: "likeStatus",
        },
      },
      {
        $lookup: {
          from: "dislikes",
          let: { pId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$post_id", "$$pId"] },
                    { $eq: ["$user_id", userId] },
                  ],
                },
              },
            },
          ],
          as: "dislikeStatus",
        },
      },
      {
        $project: {
          title: 1,
          type: 1,
          category: 1,
          tags: 1,
          videoURL: 1,
          likes: 1,
          views: 1,
          description: 1,
          details: 1,
          thumbnail: 1,
          postedAt: 1,
          duration: 1,
          user_id: { firstname: 1, lastname: 1 },
          channel_id: {
            _id: 1,
            channelPicture: 1,
            channelName: 1,
            channelHandler: 1,
            subscribers: { $size: "$channel_id.subscribers" },
            isSubscribed: { $in: [userId, "$channel_id.subscribers"] },
          },
          isliked: { $gt: [{ $size: "$likeStatus" }, 0] },
          isDisLiked: { $gt: [{ $size: "$dislikeStatus" }, 0] },
        },
      },
    ]);
    const post = result[0];
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }
    console.log("Successfully fetched post");
    return res.status(200).json({
      message: "Successfully fetched post",
      data: post,
    });
  } catch (error) {
    getServerError(res, error, "getPost controller");
  }
};

//This controller initially fetch 5 posts based on optional queries depend on category and cursor, next 5 post will be fetch on loading or clicking load more button
export const getMorePost = async (req: AuthRequest, res: Response) => {
  const { cursor, category, type } = req.query;
  const parsedLimit = Math.min(parseInt(req.query.limit as string) || 5, 10);
  try {
    const result = await Post.aggregate([
      {
        $facet: {
          posts: [
            {
              $match: {
                ...(cursor && {
                  createdAt: { $lte: new Date(cursor as string) },
                }),
                ...(category && category !== "All" && { category: category }),
                type: type ? type : { $ne: "short" },
              },
            },
            { $sort: { createdAt: -1 } },
            { $limit: parsedLimit + 1 },
            {
              $lookup: {
                from: "channels",
                localField: "channel_id",
                foreignField: "_id",
                as: "channel_id",
              },
            },
            {
              $unwind: {
                path: "$channel_id",
                preserveNullAndEmptyArrays: true,
              },
            },
            {
              $lookup: {
                from: "users",
                localField: "user_id",
                foreignField: "_id",
                as: "user_id",
              },
            },
            { $unwind: { path: "$user_id", preserveNullAndEmptyArrays: true } },
            {
              $project: {
                title: 1,
                thumbnail: 1,
                category: 1,
                type: 1,
                views: 1,
                postedAt: 1,
                duration: 1,
                createdAt: 1,
                "channel_id.channelPicture": 1,
                "channel_id.channelName": 1,
                "user_id.firstname": 1,
                "user_id.lastname": 1,
              },
            },
          ],
          allCategories: [
            { $group: { _id: "$category" } },
            { $match: { _id: { $ne: null } } },
            { $sort: { _id: 1 } },
            { $group: { _id: null, categories: { $push: "$_id" } } },
          ],
        },
      },
    ]);

    const facetResult = result[0];
    let posts = facetResult.posts || [];
    const categories = facetResult.allCategories[0]?.categories || [];

    let nextCursor = null;
    if (posts.length > parsedLimit) {
      const lastPost = posts.pop();
      nextCursor = lastPost.createdAt.toISOString();
    }

    return res.status(200).json({
      message: "Successfully fetched Post",
      data: posts,
      nextCursor,
      categories,
    });
  } catch (error) {
    getServerError(res, error, "getMorePost controller");
  }
};
//TODO:Remove this after
// //For Shorts
// //For Home Page
// export const getShorts = async (req, res) => {
//   try {
//     const short = await Post.find({ type: "short" })
//       .select("_id title type category thumbnail views")
//       .sort({ createdAt: -1 })
//       .limit(15)
//       .lean();
//     console.log("Successfully fetched Short");
//     return res
//       .status(200)
//       .json({ message: "Successfully fetched Short", data: short });
//   } catch (error) {
//     console.error("Error Occurred at getShort controller : ", error);
//     return res.status(500).json({ message: "Internal Server Error" });
//   }
// };

// This controller will take data from body and files, body will be having all field like title,category,... and files will be having thumbnail and videoUrl, both will be available info only when multer runs.
// also video length is calculated for duration.
export const createPost = async (req: AuthRequest, res: Response) => {
  const session = await mongoose.startSession();
  const { channel_id, title, type, category, tags, description, details } =
    req.body;
  const files = req.files as
    | { [fieldname: string]: Express.Multer.File[] }
    | undefined;
  const thumbnail: string = files!.thumbnail[0].path.replace(/\\/g, "/");
  const videoURL: string = files!.videoURL[0].path.replace(/\\/g, "/");
  try {
    session.startTransaction();
    const channel = await Channel.findOne({
      _id: channel_id,
      user_id: req.user!.id,
    }).session(session);
    if (!channel) {
      await session.abortTransaction();
      safeUnlink(thumbnail);
      safeUnlink(videoURL);
      console.warn(
        `${req.user!.id} is trying to create post on unknown channel`,
      );
      return res.status(404).json({ message: "Channel not Found" });
    }
    let durationInSeconds: number;
    try {
      durationInSeconds = Math.floor(await getVideoDurationInSeconds(videoURL));
    } catch {
      await session.abortTransaction();
      console.warn("Unable to fetch video duration");
      return res.status(400).json({
        message: "Unable to fetch video duration",
      });
    }
    const [newPost] = await Post.create(
      [
        {
          user_id: req.user!.id,
          channel_id: channel._id,
          title,
          type: type.toLowerCase(),
          category: category.toLowerCase(),
          tags: tags.split(","),
          thumbnail,
          videoURL,
          postedAt: getNextDate(),
          duration: formatDuration(durationInSeconds),
          description,
          details: JSON.parse(details),
        },
      ],
      { session },
    );
    const formattedTo: { id: mongoose.Types.ObjectId; status: boolean }[] =
      channel.subscribers.map((item) => ({
        id: item,
        status: false,
      }));
    const notifyMessage = `${channel.channelName} uploaded new post`;
    const [newNotification] = await Notification.create(
      [
        {
          from: channel._id,
          to: formattedTo,
          message: notifyMessage,
          link: `/watch?v=${newPost._id}`,
          type: "post_create",
        },
      ],
      { session },
    );
    const channelSubscribersIDs: string[] =
      channel.subscribers?.map((sub) => sub.toString()) || [];
    await session.commitTransaction();
    const newNotify: commonNotify = {
      id: newNotification._id,
      message: newNotification.message,
      createdAt: newNotification.createdAt,
      link: newNotification?.link || null,
      type: newNotification.type,
      channelBanner: channel?.channelBanner || null,
    };
    channelSubscribersIDs.forEach((subscriberID) => {
      const targetSocketID = userSockedIds[subscriberID];
      if (targetSocketID) {
        io.to(targetSocketID).emit("newNotification", newNotify);
      }
    });
    console.log(`${req.user!.email} created new post`);
    return res.status(201).json({
      message: "Successfully created new post",
    });
  } catch (error) {
    await session.abortTransaction();
    safeUnlink(thumbnail);
    safeUnlink(videoURL);
    getServerError(res, error, "createPost controller");
  } finally {
    session.endSession();
  }
};
//require id and update data info, using PATCH here instead of PUT
//Only updates the field that are updatable
export const updatePost = async (req: AuthRequest, res: Response) => {
  const session = await mongoose.startSession();
  const updatedPayLoad: Record<string, string> = {};
  const files = req.files as
    | { [fieldname: string]: Express.Multer.File[] }
    | undefined;
  const thumbnail: string | null =
    files?.thumbnail[0].path.replace(/\\/g, "/") || null;

  try {
    session.startTransaction();
    const acceptedKey = ["description", "details", "category", "tags"];
    for (const key of acceptedKey) {
      if (req.body[key] !== undefined) {
        if (key == "category" || key == "type") {
          updatedPayLoad[key] = req.body[key].toLowerCase();
        } else {
          updatedPayLoad[key] = req.body[key];
        }
      }
    }
    if (thumbnail) {
      updatedPayLoad.thumbnail = thumbnail;
    }
    const oldPost = await Post.findOne(
      {
        _id: req.params.id,
        user_id: req.user!.id,
      },
      null,
      { session },
    )
      .populate("channel_id", "_id channelName channelPicture subscribers")
      .lean();
    if (!oldPost) {
      await session.abortTransaction();
      if (req.file) fs.unlinkSync(req.file.path);
      return res
        .status(404)
        .json({ success: false, message: "Post not found or unauthorized" });
    }

    const oldThumbnailPath: string = oldPost.thumbnail;

    // Update the Database
    const updatedPost = await Post.findByIdAndUpdate(
      req.params.id,
      { $set: updatedPayLoad },
      { new: true, runValidators: true, session },
    )
      .lean()
      .select(
        "thumbnail category title views postedAt duration channel_id _id tags details description type",
      );
    if (!updatedPost) {
      await session.abortTransaction();
      return res.status(400).json({ message: "Failed to update post" });
    }
    // Cleanup: If a NEW file was uploaded, delete the OLD one
    if (thumbnail && oldThumbnailPath) {
      // Avoid deleting if the path is somehow the same or default
      if (oldThumbnailPath !== thumbnail) {
        safeUnlink(oldThumbnailPath);
      }
    }

    const populatedChannel = oldPost.channel_id as any;
    const formattedTo: { id: mongoose.Types.ObjectId; status: boolean }[] =
      populatedChannel.subscribers.map((item: any) => ({
        id: item,
        status: false,
      }));
    const [newNotification] = await Notification.create(
      [
        {
          from: populatedChannel._id,
          to: formattedTo,
          message: `${populatedChannel.channelName} updated its post`,
          link: `/watch?v=${updatedPost._id}`,
          type: "post_update",
        },
      ],
      { session },
    );
    const channelSubscribersIDs: string[] =
      populatedChannel.subscribers?.map((sub: any) => sub.toString()) || [];
    await session.commitTransaction();
    const newNotify: commonNotify = {
      id: newNotification._id,
      message: newNotification.message,
      createdAt: newNotification.createdAt,
      link: newNotification?.link || null,
      type: newNotification.type,
      channelBanner: populatedChannel?.channelBanner || null,
    };
    channelSubscribersIDs.forEach((subscriberID) => {
      const targetSocketID = userSockedIds[subscriberID];
      if (targetSocketID) {
        io.to(targetSocketID).emit("newNotification", newNotify);
      }
    });
    return res.status(200).json({
      success: true,
      message: "Successfully Post has been updated",
      data: updatedPost,
    });
  } catch (error) {
    await session.abortTransaction();
    // If something crashes, don't leave the new file hanging
    if (thumbnail) {
      safeUnlink(thumbnail);
    }
    getServerError(res, error, "updatePost controller");
  } finally {
    session.endSession();
  }
};

//This Controller handles deletion on post, post id will be taken from params
export const deletePost = async (req: AuthRequest, res: Response) => {
  const session = await mongoose.startSession();
  try {
    const dltPost = await Post.findOneAndDelete(
      {
        _id: req.params.id,
        user_id: req.user!.id,
      },
      { session },
    );
    if (!dltPost) {
      await session.abortTransaction();
      console.warn(
        `${req.user!.email} trying to delete post that doesn't exist or don't belong to him`,
      );
      return res.status(404).json({ message: "Post no longer exists" });
    }
    await Comment.deleteMany({ post_id: dltPost._id }, { session });
    await CommentLike.deleteMany({ post_id: dltPost._id }, { session });
    await CommentDislike.deleteMany({ post_id: dltPost._id }, { session });
    await PostLike.deleteMany({ post_id: dltPost._id }, { session });
    await PostDislike.deleteMany({ post_id: dltPost._id }, { session });
    await session.commitTransaction();
    console.log(
      `${req.user!.email} has successfully deleted post : ${dltPost._id}`,
    );
    return res.status(200).json({
      message: "Successfully deleted Post",
      data: { id: dltPost._id, type: dltPost.type },
    });
  } catch (error) {
    await session.abortTransaction();
    getServerError(res, error, "deletePost controller");
  } finally {
    session.endSession();
  }
};
