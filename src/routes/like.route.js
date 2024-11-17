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

router.route("/get-liked-videos").get(getLikedVideos);
router.route("/toggle-video-like/:videoId").get(toggleVideoLike);
router.route("/toggle-comment-like/:commentId").get(toggleCommentLike);
router.route("/toggle-tweet-like/:tweetId").get(toggleTweetLike);

export default router;