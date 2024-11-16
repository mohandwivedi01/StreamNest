import { asyncHandler } from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js" 
import {User} from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import jwt from "jsonwebtoken"
import { response } from "express"


const generateAccessAndRefreshToken = async(userId) => {
    try{
        const user = await User.findById(userId)
        // console.log("user: ", user)

        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken() 

        // console.log("accessToken: ", accessToken)
        // console.log("refreshToken: ", refreshToken)

        user.refreshToken = refreshToken
        await user.save({validateBeforeSave: false})

        return {
            accessToken,
            refreshToken
        }
        
    }catch(error){
        throw new ApiError(500, "somthing went wrong while generating access and refresh token")
    }
}

const registerUser = asyncHandler( async (req, res) => {
    /* register user
    1). get user details from client 
    2). validate user details(not empty)
    3). check if user is already registered(check uniqe username and email)
    4). check for images and avatar images
    5). upload to cloudinary
    6). check if images upload sucessfully
    7). create user object -> create entry in db
    8). remove password and refresh token firld from response 
    9). check is response not empty 
    10). save user object
    11). return response to client. 
    */

    //destructure the req body
    const {fullName, email, username, password} = req.body;
    // console.log(fullName, "\n", email, "\n", username, "\n", password);
    if(fullName=== ""&&email===null&&username===null&&password===null){
        throw new ApiError("All fields are required", 400)
    }

    const existedUser = await User.findOne(
        {$or: [{username},{email}]}
    )
    
    if(existedUser){
        throw new ApiError(400, "User already exists")
    }

    // upload images to cloudinary
    // console.log("user details", req.files);
    //multer gives use the access of req.files 
    //req.files? ==> may or may not present
    //req.files?.avtar[0] objects first property gives us path
    // const coverImageLocalPath = req.files?.coverImage[0]?.path
    let avatar;
    let coverImage;
    if(req.files && req.files.avatar && req.files.coverImage){
        console.log("condition failed..")
        const avatarLocalPath = req.files?.avatar[0]?.path
        const coverImageLocalPath = req.files.coverImage[0].path
        if(!avatarLocalPath || !coverImageLocalPath){
            throw new ApiError(400, "Avatar and cover image is required")
        }

        avatar = await uploadOnCloudinary(avatarLocalPath)
        coverImage = await uploadOnCloudinary(coverImageLocalPath)
    }
    if(!avatar || !coverImage){
        throw new ApiError(500, "Somthing went wrong..")
    }

    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage.url || "",
        email,
        password,
        username: username.toLowerCase(),
    })

    const createdUser = await User.findById(user._id).select("-password -refreshToken")

    if(!createdUser) {
        throw new ApiError("somthing went wrong while creating user", 500)
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, "user registered successfully")
    )
})

const loginUser = asyncHandler(async (req, res) => {
    /*
     *req body --> data
     *username or email based login
     *fine the user in db 
     *match password
     *generate access token and refresh token and send to user with response
     *set isLogin flag true if available
     */
    const {email, username, password} = req.body;
    if(!(username || email)) {
        throw new ApiError(403, " Username or email is required")
    }
    //fineOne check for first entry in db as soon as it get the entry it will retrun it.
    const user = await User.findOne({
        $or: [{username}, {email}]  //it will by username or by email
    })

    if(!user){
        throw new ApiError(404, "User not found")
    }

    const isPasswordValid = await user.isPasswordCorrect(password)

    if(!isPasswordValid){
        throw new ApiError(404, "password is not correct")
    }

    const {accessToken, refreshToken} = await generateAccessAndRefreshToken(user._id)
    
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")
     
    const options = {
        httpOnly: true,
        secure: true
    }
    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(200,
            {
                user: loggedInUser, accessToken,
                refreshToken
            },
            "User logged in successfully"
        )
    )
})

const logoutUser = asyncHandler(async(req, res) =>{
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                refreshToken: 1 //this removes the field from document
            }
        },
        {
            new: true
        }
    ) 
    const options = {
        httpOnly: true,
        secure: true
    }
    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "user logged out successfully"))
})

const refreshAccessToken = asyncHandler(async (req, res) => {
    /*
    get the refresh token from cookies 
    match with the refresh token stored in db
    if matches with the refresh token generat a new access token and send to the user
    if match get failed send error message and return
    */

    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken
    if(!incomingRefreshToken){
        throw new ApiError(401, "unauthorized request")
    }

   try {
    const decodedToken = jwt.verify(
        incomingRefreshToken,
        process.env.REFRESH_TOKEN_SECRET
    )

    const user = await User.findByIdAndUpdate(decodedToken?._id)
    
    if(!user){
        throw new ApiError(404, "User not found")
    }

    if(incomingRefreshToken !== user?.refreshToken){
        throw new ApiError(401, "refresh token is expired")
    }

    const options = {
        httpOnly: true,
        secure: true
    }

    await generateAccessAndRefreshToken(user._id)

    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(200,
                accessToken,
                refreshToken,
                "Access token refreshed"
        )
    )
   }catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token")
   }
})

const changeCurrentPassword = asyncHandler(async(re, res) => {
    const {oldPassword, newPassword} = req.body
    const user = await User.findById(req.user?._id)

    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

    if(!isPasswordCorrect){
        throw new ApiError(401, "Invalid password")
    }
    user.password = newPassword
    await user.save({validateBeforeSave: flase})

    return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password updated successfully"))
})

const getCurrentUser = asyncHandler(async(req, res) =>{
    const user = await req.user;
    return res
    .status(200)
    .json(new ApiResponse(200, {user: user}, "current user fatched successfully"))
})

const updateAccountDetails = asyncHandler(async(req, res) =>{
    const {fullName, email, username} = req.body;
    if(!fullName || !email || !username){
        throw new ApiError(400, "All fields are requied");

        const user = User.findByIdAndUpdate(
            req.user?._id,
            {
                $set:{
                    fullName,
                    email,
                    username
                }
            },
            {new: true}
        ).select("-password")
        return res
        .status(200)
        .json(new ApiResponse(200, user, "Account details updated"))
    }
})

const updateUserAvatar = asyncHandler(async(req, res) => {
    const avatarLocalPath = req.file?.path

    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar file is missing")
    }
    
    const avatar = await uploadOnCloudinary(avatarLocalPath)

    if(!avatar.url){
        throw new ApiError(400, "Error while uploading avatar")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                avatar: avatar.url 
            }
        },
        {new: true}
    ).select("-password")
    return res
    .status(200)
    .json(new ApiResponse(200, user, "avatar image updated successfully"))
})
 
const updateCoverImage = asyncHandler(async(req, res) => {
    const CoverImageLocalPath = req.file?.path

    if(!CoverImageLocalPath){
        throw new ApiError(400, "CoverImage file is missing")
    }
    
    const coverImage = await uploadOnCloudinary(avatarLocalPath)

    if(!coverImage.url){
        throw new ApiError(400, "Error while uploading avatar")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                coverImage: coverImage.url 
            }
        },
        {new: true}
    ).select("-password")
    return res
    .status(200)
    .json(new ApiResponse(200, user, "coverImage image updated successfully"))
})

const getUserChannelProfile = asyncHandler(async(req, res) => {
    /*
    
    */
    const {username} = req.params;

    if(!username?.trim()){
        throw new ApiError(400, "Username is missing")
    }
    //the value we get in return from aggregation is an array
    /*
    {
        $unwind: "$subscribers" // Unwind the array to access subscriber details directly
    }
     */
    const channel = await User.aggregate([
        {
            $match: {
                username: username?.toLowerCase()
            }  
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            }
        }, 
        {
            $lookup: {
                from: "subscribers",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedTo"
            }
        },
        {
            $addField: {
                subscribersCount: {
                    $size: "$subscribers"
                },
                channelsSubscribedToCount: {
                    $size: "$subscribedTo"
                },
                isSubscribed: {
                    $cond:{
                        if: {$in: [req.user?._id, "$subscribers.subscriber"]},
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project: {
                fullName: 1,
                username: 1,
                isSubscribed: 1,
                channelsSubscribedToCount: 1,
                subscribersCount: 1,
                avatar: 1,
                coverImage: 1,
                email: 1,
            }
        }
    ])
    if(!channel?.length){
        throw new ApiError(404, "Channel not found")
    }
    
    return res
    .status(200)
    .json(
        new ApiResponse(200, channel[0], "User channel fetched successfully")
    )

})

const getWatchHistory = asyncHandler(async(req, res) =>{
    const user = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(req.user._id),
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
                pipeline: [
                    {
                      $lookup: {
                        from: "users",
                        localField: "owner",
                        foreignField: "_id",
                        as: "owner",
                        pipeline: [
                            {
                               $project: {
                                fullName: 1,
                                username: 1,
                                avatar: 1,
                               } 
                            }
                        ]
                      },
                    } ,
                    {
                        $addFields:{
                            owner: {
                                $first: "$owner"
                            }
                        }
                    }
                ]
            }
        }
    ])
    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            user[0].watchHistory,
            "watch history fetched successfully"
        )
    )
})

export {
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
    getWatchHistory,

};