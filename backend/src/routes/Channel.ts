import express from "express";
import {
  createChannel,
  deleteChannel,
  getChannel,
  getChannels,
  subscriberToggle,
  updateChannel,
  validateHandler,
} from "../controllers/Channel.js";
import jwtVerifier from "../middlewares/jwtVerifier.js";
import Validate from "../validations/mongooseIDValidation.js";
import channelValidation from "../validations/channelValidation.js";
import channelUpdateValidation from "../validations/channelUpdateValidation.js";
import handlerValidation from "../validations/handlerValidation.js";
import { upload } from "../middlewares/multerUpload.js";
const router = express.Router();
//TODO : In future remove jwt verification from /channel/:handler route because guest user can also see userChannel Info, rest keep as it is
const uploadMultiple = upload.fields([{ name: "channelPicture", maxCount: 1 }]);
router.route("/my_channels").get(jwtVerifier, getChannels);
router
  .route("/channel/:handler")
  .get(handlerValidation, jwtVerifier, getChannel);
router
  .route("/create_channel")
  .post(jwtVerifier, uploadMultiple, channelValidation, createChannel);
router
  .route("/delete_channel/:id")
  .delete(Validate, jwtVerifier, deleteChannel);
router
  .route("/update_channel/:id")
  .patch(Validate, channelUpdateValidation, jwtVerifier, updateChannel); //TODO: Confirm that using 1 response from db or executing long code, which would be better
router
  .route("/new_subscriber/:id")
  .patch(Validate, jwtVerifier, subscriberToggle);
router
  .route("/validatehandler/:handler")
  .get(jwtVerifier, handlerValidation, validateHandler);
export default router;
