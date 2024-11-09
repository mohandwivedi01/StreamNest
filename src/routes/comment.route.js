import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
    deleteComment,
    addComment,
    getVideoComments,
    updateComment,

} from "../controllers/comment.controller.js";

const router = Router();

router.use(verifyJWT) // Apply verifyJWT middleware to all routes in this file

router.route("/get-video-comment/:videoId").get(getVideoComments);
router.route("/add-comment/:videoId").post(addComment);
router.route("/delete-comment/:commentId").delete(deleteComment);
router.route("/update-comment/:commentId").patch(updateComment);



export default router
