import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
    getSubscribedChannels,
    toggleSubscription,
    getUserChannelProfile
} from "../controllers/subscription.controller.js"

const router = Router();
router.use(verify); // Apply verifyJWT middleware to all routes in this file

router.route("/get-subscribed-channels/:channelId").get(getSubscribedChannels);
router.route("/toggle-subscription/:channelId").post(toggleSubscription);
router.route("/get-subscribers").get(getUserChannelProfile)

export default router