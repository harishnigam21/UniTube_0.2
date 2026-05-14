import Channel from "../models/Channel.js";
import mongoose from "mongoose";
import User from "../models/User.js";
import Post from "../models/Post.js";
import { AuthRequest } from "../types/AuthRequest.js";
import { Response } from "express";
import envVariables from "../envConfig.js";
import Comment from "../models/Comment.js";
import { io, userSockedIds } from "../socket.js";
import Notification from "../models/Notification.js";
import { commonNotify } from "../types/Notification.js";
import { getServerError } from "../utils/serverError.js";

// This controller, providing one channel info using id, id will be fetched from params.
// Here aggregation will join the tables using lookup to get common info we will be needed for ex joining channels and users to get user info like firstname,...., I have designed aggregation in such manner , such that no extra load should be attached in response and all data should be fetched from DB in one instance..
export const getChannel = async (req: AuthRequest, res: Response) => {
  try {
    const [ChannelData] = await Channel.aggregate([
      {
        $match: {
          channelHandler: req.params.handler,
        },
      },
      {
        $addFields: {
          isOwner: {
            $eq: ["$user_id", new mongoose.Types.ObjectId(req.user!.id)],
          },
          // NEW: Check if the current user ID exists in the subscribers array
          isSubscribed: {
            $cond: [
              { $isArray: "$subscribers" },
              {
                $in: [
                  new mongoose.Types.ObjectId(req.user!.id),
                  "$subscribers",
                ],
              },
              false,
            ],
          },
        },
      },
      {
        $lookup: {
          from: "users",
          let: { user_id: "$user_id" },
          pipeline: [
            { $match: { $expr: { $eq: ["$_id", "$$user_id"] } } },
            { $project: { firstname: 1, middlename: 1, lastname: 1, _id: 0 } },
          ],
          as: "user",
        },
      },
      {
        $unwind: {
          path: "$user",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "posts",
          let: { channel_id: "$_id" },
          pipeline: [
            { $match: { $expr: { $eq: ["$channel_id", "$$channel_id"] } } },
            { $sort: { createdAt: -1 } },
            {
              $facet: {
                videos: [
                  { $match: { type: "video" } },
                  { $limit: 6 },
                  {
                    $project: {
                      title: 1,
                      thumbnail: 1,
                      category: 1,
                      duration: 1,
                      views: 1,
                      postedAt: 1,
                      _id: 1,
                      channel_id: 1,
                      tags: 1,
                      details: 1,
                      description: 1,
                    },
                  },
                ],
                shorts: [
                  { $match: { type: "short" } },
                  { $limit: 6 },
                  {
                    $project: {
                      title: 1,
                      thumbnail: 1,
                      category: 1,
                      duration: 1,
                      views: 1,
                      postedAt: 1,
                      _id: 1,
                      channel_id: 1,
                      tags: 1,
                      details: 1,
                      description: 1,
                    },
                  },
                ],
                live: [
                  { $match: { type: "live" } },
                  { $limit: 6 },
                  {
                    $project: {
                      title: 1,
                      thumbnail: 1,
                      category: 1,
                      duration: 1,
                      views: 1,
                      postedAt: 1,
                      _id: 1,
                      channel_id: 1,
                      tags: 1,
                      details: 1,
                      description: 1,
                    },
                  },
                ],
                podcasts: [
                  { $match: { type: "podcast" } },
                  { $limit: 6 },
                  {
                    $project: {
                      title: 1,
                      thumbnail: 1,
                      category: 1,
                      duration: 1,
                      views: 1,
                      postedAt: 1,
                      _id: 1,
                      channel_id: 1,
                      tags: 1,
                      details: 1,
                      description: 1,
                    },
                  },
                ],
                playlists: [
                  { $match: { type: "playlist" } },
                  { $limit: 6 },
                  {
                    $project: {
                      title: 1,
                      thumbnail: 1,
                      category: 1,
                      duration: 1,
                      views: 1,
                      postedAt: 1,
                      _id: 1,
                      channel_id: 1,
                      tags: 1,
                      details: 1,
                      description: 1,
                    },
                  },
                ],
                posts: [
                  { $match: { type: "post" } },
                  { $limit: 6 },
                  {
                    $project: {
                      title: 1,
                      thumbnail: 1,
                      category: 1,
                      duration: 1,
                      views: 1,
                      postedAt: 1,
                      _id: 1,
                      channel_id: 1,
                      tags: 1,
                      details: 1,
                      description: 1,
                    },
                  },
                ],
                totalCount: [{ $count: "count" }],
              },
            },
          ],
          as: "postsData",
        },
      },
      {
        $unwind: "$postsData",
      },
      {
        $addFields: {
          totalPosts: {
            $ifNull: [{ $arrayElemAt: ["$postsData.totalCount.count", 0] }, 0],
          },
          // Transform each facet into your required format { posts: [], nextCursor: '' }
          video: {
            posts: { $slice: ["$postsData.videos", 5] },
            nextCursor: {
              $cond: [
                { $gte: [{ $size: "$postsData.videos" }, 6] },
                { $arrayElemAt: ["$postsData.videos._id", 5] },
                null,
              ],
            },
          },
          short: {
            posts: { $slice: ["$postsData.shorts", 5] },
            nextCursor: {
              $cond: [
                { $gte: [{ $size: "$postsData.shorts" }, 6] },
                { $arrayElemAt: ["$postsData.shorts._id", 5] },
                null,
              ],
            },
          },
          live: {
            posts: { $slice: ["$postsData.live", 5] },
            nextCursor: {
              $cond: [
                { $gte: [{ $size: "$postsData.live" }, 6] },
                { $arrayElemAt: ["$postsData.live._id", 5] },
                null,
              ],
            },
          },
          podcast: {
            posts: { $slice: ["$postsData.podcasts", 5] },
            nextCursor: {
              $cond: [
                { $gte: [{ $size: "$postsData.podcasts" }, 6] },
                { $arrayElemAt: ["$postsData.podcasts._id", 5] },
                null,
              ],
            },
          },
          playlist: {
            posts: { $slice: ["$postsData.playlists", 5] },
            nextCursor: {
              $cond: [
                { $gte: [{ $size: "$postsData.playlists" }, 6] },
                { $arrayElemAt: ["$postsData.playlists._id", 5] },
                null,
              ],
            },
          },
          communityPost: {
            // Renamed from 'posts' to avoid conflict with top-level naming
            posts: { $slice: ["$postsData.posts", 5] },
            nextCursor: {
              $cond: [
                { $gte: [{ $size: "$postsData.posts" }, 6] },
                { $arrayElemAt: ["$postsData.posts._id", 5] },
                null,
              ],
            },
          },
        },
      },
      {
        $addFields: {
          // NEW: Extract the total count we just calculated
          totalPosts: { $ifNull: ["$postsData.totalCount", 0] },

          // Handle the postsArray for your existing cursor logic
          postsArray: {
            $slice: [
              {
                $sortArray: {
                  input: "$postsData.docs",
                  sortBy: { createdAt: -1 },
                },
              },
              6,
            ],
          },
          subscribersCount: { $size: { $ifNull: ["$subscribers", []] } },
        },
      },
      {
        $addFields: {
          nextCursor: {
            $cond: [
              { $gte: [{ $size: { $ifNull: ["$postsArray", []] } }, 6] },
              { $arrayElemAt: ["$postsArray._id", 5] },
              null,
            ],
          },
          posts: {
            $slice: [{ $ifNull: ["$postsArray", []] }, 5],
          },
          subscribers: "$subscribersCount",
        },
      },
      {
        $project: {
          postsArray: 0,
          postsData: 0,
          subscribersCount: 0,
          user_id: 0,
          updatedAt: 0,
          __v: 0,
        },
      },
    ]);
    if (!ChannelData || ChannelData.length == 0) {
      console.log("Channel not Found");
      return res.status(404).json({ message: "Channel not Found" });
    }
    console.log("Successfully fetched Channel");
    return res
      .status(200)
      .json({ message: "Successfully fetched Channel", data: ChannelData });
  } catch (error) {
    getServerError(res, error, "getChannel controller");
  }
};
//This controller, provides all channels for particular user, with some extra fields other then channel it join post table to get post count and get only subscribers length from DB and other common fields from channel
export const getChannels = async (req: AuthRequest, res: Response) => {
  try {
    const Channels = await Channel.aggregate([
      { $match: { user_id: new mongoose.Types.ObjectId(req.user!.id) } },
      {
        $lookup: {
          from: "posts",
          localField: "_id",
          foreignField: "channel_id",
          as: "channelPosts",
        },
      },
      {
        $addFields: {
          postsCount: { $size: "$channelPosts" },
          subscribersCount: { $size: { $ifNull: ["$subscribers", []] } },
        },
      },
      {
        $project: {
          channelName: 1,
          channelHandler: 1,
          channelBanner: 1,
          channelPicture: 1,
          subscribers: "$subscribersCount",
          posts: "$postsCount",
        },
      },
    ]);
    console.log(`User : ${req.user!.id} fetched its channels successfully`);
    return res
      .status(200)
      .json({ message: "Successfully fetched channels", data: Channels });
  } catch (error) {
    getServerError(res, error, "getChannels controller");
  }
};
// This controller will take data from body and files, body will be having all field like name,handler,... and files will be having banner and pictures, both will be available info only when multer runs, Transaction in used to follow the protocol either one or full.
// Because when channel is created, along with new document in channels, it also have to update channels array in users model
// also checks that channel create limit exceed or not.
export const createChannel = async (req: AuthRequest, res: Response) => {
  const { channelName, channelHandler } = req.body;
  const files = req.files as
    | { [fieldname: string]: Express.Multer.File[] }
    | undefined;

  const picturePath = files?.channelPicture
    ? files.channelPicture[0].path.replace(/\\/g, "/")
    : null;
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const handlerExist = await Channel.findOne({ channelHandler }).session(
      session,
    );
    if (handlerExist) {
      console.warn(
        `${req.user!.id} checks for handler ${channelHandler}, but it already exist`,
      );
      return res
        .status(409)
        .json({ message: "Handler already exist", status: false });
    }
    const countChannel = await Channel.countDocuments({
      user_id: req.user!.id,
    }).session(session);
    if (Number(countChannel) >= Number(envVariables.MAX_CHANNEL)) {
      console.log(`User : ${req.user!.id} has exceeded channel creation limit`);
      return res
        .status(403)
        .json({ message: "Channel Creation limit exceeds" });
    }
    const [createChannel] = await Channel.create(
      [
        {
          user_id: req.user!.id,
          channelName,
          channelHandler,
          channelPicture: picturePath || "",
        },
      ],
      { session },
    );
    await User.updateOne(
      { _id: req.user!.id },
      { $addToSet: { channels: createChannel._id } },
      { session },
    );
    await session.commitTransaction();
    console.log(
      `Successfully Created Channel for ${req.user!.email}`,
      createChannel,
    );
    return res.status(201).json({
      message: `Successfully Created Channel`,
      data: {
        _id: createChannel._id,
        channelName: createChannel.channelName,
        channelHandler: createChannel.channelHandler,
        channelPicture: createChannel.channelPicture,
        subscribers: 0,
        posts: 0,
      },
    });
  } catch (error) {
    await session.abortTransaction();
    getServerError(res, error, "createChannel controller");
  } finally {
    await session.endSession();
  }
};
//This controller will handle deletion of channel, Transaction is used to remove document from channels and pop channel id from id from users channels fields
export const deleteChannel = async (req: AuthRequest, res: Response) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const deleteChannel = await Channel.findOneAndDelete(
      {
        _id: req.params.id,
        user_id: req.user!.id,
      },
      { session },
    );
    if (!deleteChannel) {
      await session.abortTransaction();
      console.error(
        `User : ${req.user!.email} trying to delete channel : ${req.params.id} that does not exist or might user is not authorized`,
      );
      return res.status(404).json({
        message: "Channel no longer exists",
      });
    }

    await User.updateOne(
      { _id: req.user!.id },
      { $pull: { channels: deleteChannel._id } },
      { session },
    );
    const RelatedPostIDs = (await Post.distinct(
      "_id",
      { user_id: req.user!.id, channel_id: deleteChannel._id },
      { session },
    )) as mongoose.Types.ObjectId[];
    await Post.deleteMany(
      { user_id: req.user!.id, channel_id: deleteChannel._id },
      { session },
    );
    await Comment.deleteMany(
      {
        post_id: { $in: RelatedPostIDs },
      },
      { session },
    );
    await User.updateMany(
      {
        subscription: deleteChannel._id,
      },
      {
        $pull: { subscription: deleteChannel._id },
      },
      { session },
    );
    const formattedTo: { id: mongoose.Types.ObjectId; status: boolean }[] =
      deleteChannel.subscribers.map((item) => ({
        id: item,
        status: false,
      }));
    const notifyMessage: string = `${deleteChannel.channelName} has been deleted`;
    const [newNotification] = await Notification.create(
      [
        {
          from: req.user!.id,
          to: formattedTo,
          message: notifyMessage,
        },
      ],
      { session },
    );
    const channelSubscriberIds: string[] =
      deleteChannel.subscribers?.map((id) => id.toString()) || [];
    await session.commitTransaction();
    if (channelSubscriberIds.length > 0) {
      channelSubscriberIds.forEach((id) => {
        const targetSocketID = userSockedIds[id];
        if (targetSocketID) {
          io.to(targetSocketID).emit("channelDeleted", deleteChannel._id);
          const newNotify: commonNotify = {
            notificationID: newNotification._id,
            message: newNotification.message,
            createdAt: newNotification.createdAt,
            link: `/channel/${deleteChannel.channelHandler}`,
          };
          io.to(targetSocketID).emit("newNotification", newNotify);
        }
      });
    }
    console.log(`Channel ${deleteChannel._id} deleted by user ${req.user!.id}`);
    return res.status(200).json({
      message: "Successfully Channel has been deleted",
      data: deleteChannel._id,
    });
  } catch (error) {
    await session.abortTransaction();
    getServerError(res, error, "deleteChannel controller");
  } finally {
    session.endSession();
  }
};
//require id and update data info, using PATCH here instead of PUT
//available only for channel creator
//Only updates the field that are updatable
//TODO:later think about, to notify channel subscribers about updates done at this channel
export const updateChannel = async (req: AuthRequest, res: Response) => {
  try {
    //remove unwanted payloads
    const acceptedKey = [
      "channelName",
      "channelBanner",
      "channelPicture",
      "description",
    ];
    const updatedPayLoad: Record<string, string> = {};
    for (const key of acceptedKey) {
      if (req.body[key] !== undefined && typeof key == "string") {
        updatedPayLoad[key] = req.body[key];
      }
      const files = req.files as
        | { [fieldname: string]: Express.Multer.File[] }
        | undefined;
      if (files && files["channelBanner"]?.[0]) {
        updatedPayLoad["channelBanner"] = files[
          "channelBanner"
        ][0].path.replace(/\\/g, "/");
      }

      if (files && files["channelPicture"]?.[0]) {
        updatedPayLoad["channelPicture"] = files[
          "channelPicture"
        ][0].path.replace(/\\/g, "/");
      }
    }
    const updateChannel = await Channel.findOneAndUpdate(
      {
        _id: req.params.id,
        user_id: req.user!.id,
      },
      { $set: updatedPayLoad },
      { new: true, runValidators: true },
    );
    if (!updateChannel) {
      console.error(
        `User : ${req.user!.email} trying to update channel : ${req.params.id} that does not exist or might user is not authorized`,
      );
      return res.status(404).json({
        message: "Channel no longer exists",
      });
    }
    console.log("Successfully Channel has been updated", updateChannel);
    return res.status(200).json({
      message: "Successfully Channel has been updated",
      data: updateChannel,
    });
  } catch (error) {
    getServerError(res, error, "updateChannel controller");
  }
};

//require id of subscriber, update subscriber array in Channel
//Checks if subscribed then unsubscribe it and unsubscribed then subscribe it, Using transaction to update subscribed array and subscription array from both end from channels and users
export const subscriberToggle = async (req: AuthRequest, res: Response) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const channel = await Channel.findById(req.params.id).session(session);
    if (!channel) {
      await session.abortTransaction();
      console.error(`No such channel found`);
      return res.status(404).json({ message: "No such channel found" });
    }
    if (channel.subscribers.some((id) => id.toString() === req.user!.id)) {
      const subscriber = await Channel.findOneAndUpdate(
        { _id: req.params.id },
        { $pull: { subscribers: req.user!.id } },
        { session, new: true },
      );
      if (!subscriber) {
        return res.status(404).json({ message: "No Such Channel Found !" });
      }
      await User.updateOne(
        { _id: req.user!.id },
        { $pull: { subscription: req.params.id } },
        { session },
      );
      const [newNotification] = await Notification.create(
        [
          {
            from: req.user!.id,
            to: [{ id: channel.user_id }],
            message: `You lost one subscriber`,
          },
        ],
        { session },
      );
      await session.commitTransaction();
      const targetSocketId = userSockedIds[channel.user_id.toString()];
      if (targetSocketId) {
        const notify: commonNotify = {
          notificationID: newNotification._id,
          message: `You lost one subscriber`,
          createdAt: newNotification.createdAt,
          link: `/channel/${channel.channelHandler}`,
        };
        io.to(targetSocketId).emit("newNotification", notify);
        io.to(targetSocketId).emit("lostSubscriber", { success: true });
      }
      console.log(
        `User : ${req.user!.id}, unsubscribed to channel-${req.params.id}`,
      );
      return res.status(200).json({
        message: "Successfully unsubscribed",
        subscriber: subscriber.subscribers.length,
        status: false,
      });
    }
    const subscriber = await Channel.findOneAndUpdate(
      { _id: req.params.id },
      { $addToSet: { subscribers: req.user!.id } },
      { session, new: true },
    );
    if (!subscriber) {
      return res.status(404).json({ message: "No Such Channel Found !" });
    }
    await User.updateOne(
      { _id: req.user!.id },
      { $addToSet: { subscription: req.params.id } },
      { session },
    );
    const [newNotification] = await Notification.create(
      [
        {
          from: req.user!.id,
          to: [{ id: channel.user_id }],
          message: `You got new subscriber`,
        },
      ],
      { session },
    );
    await session.commitTransaction();
    const targetSocketId = userSockedIds[channel.user_id.toString()];
    if (targetSocketId) {
      const notify: commonNotify = {
        notificationID: newNotification._id,
        message: `You got new subscriber`,
        createdAt: newNotification.createdAt,
        link: `/channel/${channel.channelHandler}`,
      };
      io.to(targetSocketId).emit("newNotification", notify);
      io.to(targetSocketId).emit("gotSubscriber", { success: true });
    }
    console.log(
      `User : ${req.user!.id}, subscribed to channel-${req.params.id}`,
    );
    return res.status(200).json({
      message: "Successfully subscribed",
      subscriber: subscriber.subscribers.length,
      status: true,
    });
  } catch (error) {
    await session.abortTransaction();
    getServerError(res, error, "subscriberToggle controller");
  } finally {
    await session.endSession();
  }
};

//Handler that notify user that handler he want to use it already existing or ready to use.
export const validateHandler = async (req: AuthRequest, res: Response) => {
  try {
    const handlerExist = await Channel.findOne({
      channelHandler: req.params.handler,
    });
    if (handlerExist) {
      console.warn(
        `${req.user!.id} checks for handler ${req.params.handler}, but it already exist`,
      );
      return res
        .status(409)
        .json({ message: "Handler already exist", status: false });
    }
    console.log("Handler does not exist");
    return res.status(200).json({ message: "Handler Available", status: true });
  } catch (error) {
    getServerError(res, error, "validateHandler controller");
  }
};
