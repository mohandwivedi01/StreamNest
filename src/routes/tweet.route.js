import { Router } from "express";
import { verifyJWTth } from "../middlewares/auth.middleware.js";
import {
    createTweet,
    deleteTweet,
    getUserTweets,
    updateTweet,
} from "../controllers/tweet.controller.js"

const router  = Router();
router.use(verifyJWTth);  // Apply verifyJWT middleware to all routes in this file

router.route("/create-tweet").post(createTweet);
router.route("/user/:userId").get(getUserTweets);
router.route("/update-tweet/:tweetId").patch(updateTweet)
router.route("/delete-tweet/:tweetId").patch(deleteTweet)


