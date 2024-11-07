import { asyncHandler } from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js" 
import {User} from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"


const generateAccessAndRefreshToken = async(userId) => {
    try{
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken
        const refreshToken = user.generateRefreshToken

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
        throw new ApiError("User already exists", 409)
    }

    // upload images to cloudinary
    // console.log("user details", req.files);
    //multer gives use the access of req.files 
    //req.files? ==> may or may not present
    //req.files?.avtar[0] objects first property gives us path
    const avatarLocalPath = req.files?.avatar[0]?.path
    // const coverImageLocalPath = req.files?.coverImage[0]?.path
    let coverImageLocalPath;
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length>0){
        coverImageLocalPath = req.files.coverImage[0].path
    }

    console.log("****coverImageLocalPath: ", coverImageLocalPath)
    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar image is required")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    // console.log("******avatar",avatar)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)
    if(!avatar) {
        throw new ApiError( 400, "Avatar image is required");
    }
    console.log("avatar url",avatar.url)
    console.log("coverImage url",coverImage.url)

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
            $set: {
                refreshToken: undefined
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

export {
    registerUser,
    loginUser,
    logoutUser,
};