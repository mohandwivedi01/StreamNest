import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import {Video} from "../models/video.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js";

const publishAVideo = asyncHandler(async(req, res) => {
    /**
     * check user is logged in
     * get the video from user
     * save it in local storage for backup
     * upload the video on cloudinary server
     * if video uploaded successfully then remove it from local storage and return success
     * if uploading failed then remove video from local file and return failure 
     */
    // const {title, description } 
    const videoLocalPath = req.file?.path

    if(!videoLocalPath){
        throw new ApiError(400, "Video file is missing")
    }
    
    const videoUploaded = await uploadOnCloudinary(videoLocalPath)

    if(!videoUploaded.url){
        throw new ApiError(400, "somthing went wrong while uploading video, please try again!")
    }
    const user = await User.fineBy


})

const getAllVideos = asyncHandler(async(req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
})

const getVideoById = asyncHandler(async(req, res) => {
    const { videoId } = req.params
    
})

const updateVideo = asyncHandler(async(req, res) => {
    const {videoId} = req.params

})

const deleteVideo = asyncHandler(async(req, res) => {
    const { videoId } = req.params

})

const togglePublishStatus = asyncHandler(async(req, res) => {
    const { videoId } = req.params

})

export {
    publishAVideo,
    getAllVideos,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus,
}