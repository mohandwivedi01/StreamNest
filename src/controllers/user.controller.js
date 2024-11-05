import { asyncHandler } from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js" 
import {User} from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"


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
    console.log(fullName, "\n", email, "\n", username, "\n", password);
    if(fullName=== ""&&email===null&&username===null&&password===null){
        throw new ApiError("All fields are required", 400)
    }

    const existedUser = User.findOne(
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
    const avatarLocalPath = req.files?.avtar[0]?.path
    const coverImageLocalPath = req.files?.coverImage[0]?.path

    if(!avatarLocalPath){
        throw new ApiError("Avatar image is required", 400)
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if(!avatar) throw new ApiError("Avatar image is required", 400);

    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage.url || "",
        email,
        password,
        username: username.toLowerCase,
    })

    const createdUser = await User.findById(user._id).select("-password -refreshToken")

    if(!createdUser) {
        throw new ApiError("somthing went wrong while creating user", 500)
    }

    return res.statud(201).json({
        new :ApiResponse(200, createdUser, "user registered successfully")
    })
})

export {registerUser};