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

router.route("/publish-video").post(verifyJWT, 
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

router.route("/get-all-videos").get(verifyJWT, getAllVideos);
router.route("get-video/:videoId").get(verifyJWT, getVideoById);
router.route("/delete-video/:videoId").delete(verifyJWT, deleteVideo);
router.route("/update-thumbnail").patch(verifyJWT, updateVideo)

router.route("/toggle/publish/:videoId").patch(togglePublishStatus)

export default router;