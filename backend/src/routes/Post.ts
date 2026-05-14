import express from "express";
import {
  createPost,
  deletePost,
  getPost,
  updatePost,
  getMorePost,
} from "../controllers/Post.js";
import Validate from "../validations/mongooseIDValidation.js";
import jwtVerifier from "../middlewares/jwtVerifier.js";
import postValidation from "../validations/postValidation.js";
import postUpdateValidation from "../validations/postUpdateValidation.js";
import { upload } from "../middlewares/multerUpload.js";
const uploadMultiple = upload.fields([
  { name: "thumbnail", maxCount: 1 },
  { name: "videoURL", maxCount: 1 },
]);
const updateThumbnail = upload.single("thumbnail");
const router = express.Router();
//TODO : In future remove jwtVErifier from /posts request so that guest user can see posts, rest keep as it is

router
  .route("/post/:id")
  .get(Validate, jwtVerifier, getPost)
  .delete(Validate, jwtVerifier, deletePost)
  .patch(
    Validate,
    jwtVerifier,
    updateThumbnail,
    postUpdateValidation,
    updatePost,
  );
router.route("/posts").get(jwtVerifier, getMorePost);
router
  .route("/create_post")
  .post(jwtVerifier, uploadMultiple, postValidation, createPost);

export default router;
