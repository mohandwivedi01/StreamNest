import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js"
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


//secure routes
router.route("/channel/:username").get(verifyJWT, getUserChannelProfile)
router.route("/watch-history").get(verifyJWT, getWatchHistory)
router.route("/current-user").get(getCurrentUser)

router.route("/login").post(loginUser)
router.route("/logout").post(verifyJWT, logoutUser)
router.route("/change-password").post(verifyJWT, changeCurrentPassword)
router.route("/refresh-token").post(refreshAccessToken)

router.route("/update-account").patch(verifyJWT, updateAccountDetails)
router.route("/update-avatar").patch(verifyJWT, upload.single("avatar"), updateUserAvatar)
router.route("/update-cover-image").patch(verifyJWT, upload.single("coverImage"), updateCoverImage)




export default router;   //using export default to help importing with any userDefined name