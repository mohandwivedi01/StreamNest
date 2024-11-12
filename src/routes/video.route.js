import { Router } from "express";

import {
    updateVideo,
    getAllVideos,
    getVideoById,
    publishAVideo,
    deleteVideo,
    togglePublishStatus,
} from "../controllers/video.controller.js"
import {verifyJWT} from "../middlewares/auth.middleware.js"
import {upload} from "../middlewares/multer.middleware.js"
// import router from "./user.routes.js";

const router = Router();
router.use(verifyJWT);

router.route("/publish-video").post(
    upload.fields([
        {
            name: "videoFile",
            maxCount: 1,
        },
        {
            name: "thumbnail",
            maxCount: 1,
        }
    ]),
    publishAVideo
);

router.route("/get-all-videos").get(getAllVideos);
router.route("get-video/:videoId").get(getVideoById);
router.route("/delete-video/:videoId").delete(deleteVideo);
router.route("/update-thumbnail").patch(updateVideo)
router.route("/toggle/publish/:videoId").patch(togglePublishStatus)

export default router;