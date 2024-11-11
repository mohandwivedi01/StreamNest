import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
    getLikedVideos,
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
} from "../controllers/like.controller.js"

const router = Router();

router.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file

router.route("/toggle-video-like/:videoId").post(toggleVideoLike);
router.route("/toggle-comment/:commentId").post(toggleCommentLike);
router.route("/toggle-tweet-like/:tweetId").post(toggleTweetLike);
router.route("/get-liked-videos/:tweetId").get(getLikedVideos);

export default router;