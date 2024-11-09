import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js"
import { verify } from "jsonwebtoken";
import { 
    registerUser, 
    loginUser, 
    logoutUser, 
    refreshAccessToken, 
    changeCurrentPassword, 
    getCurrentUser, 
    updateAccountDetails, 
    updateUserAvatar, 
    updateCoverImage, 
    getUserChannelProfile, 
    getWatchHistory 

} from "../controllers/user.controller.js";

const router = Router();

router.route("/register").post(upload.fields([
    {                
        name: "avatar", 
        maxCount: 1     //added a middleware that will add some extra fields in 
    },                  //request
    {
        name: "coverImage",
        maxCount: 1
    }                              
]), registerUser)

router.route("/login").post(loginUser)

//secure routes
router.route("/logout").post(verifyJWT, logoutUser)
router.route("/refresh-token").post(refreshAccessToken)
router.route("/change-password").post(verify, changeCurrentPassword)
router.route("/current-user").get(getCurrentUser)
router.route("/update-account").patch(verify, updateAccountDetails)
router.route("/update-avatar").patch(verify, upload.single("avatar"), updateUserAvatar)
router.route("/update-cover-image").patch(verify, upload.single("coverImage"), updateCoverImage)

router.route("/channel/:username").get(verify, getUserChannelProfile)
router.route("/watch-history").get(verify, getWatchHistory)




export default router;   //using export default to help importing with any userDefined name