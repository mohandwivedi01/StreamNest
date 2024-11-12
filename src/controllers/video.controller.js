import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import {Video} from "../models/video.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const publishAVideo = asyncHandler(async(req, res) => {
    /**
     * check user is logged in
     * get the video from user
     * save it in local storage for backup
     * upload the video on cloudinary server
     * if video uploaded successfully then remove it from local storage and return success
     * if uploading failed then remove video from local file and return failure 
     */
    const {title, description, isPublished } = req.body;

    if(!title && !description && isPublished===undefined){
        throw new ApiError(400, "required fields are missing")
    }

    if (!req.files || !videoLocalPath || !thumbnailLocalPath) {
        throw new ApiError(400, "Video file or thumbnail is missing");
    }

    const videoLocalPath = req.files?.videoFile[0]?.path
    const thumbnailLocalPath = req.files?.thumbnail[0]?.path

    if(!videoLocalPath && !thumbnailLocalPath){
        throw new ApiError(400, "video file or thumbnail is missing")
    }
    
    const videoUploaded = await uploadOnCloudinary(videoLocalPath)
    const thumbnailUploaded = await uploadOnCloudinary(thumbnailLocalPath)

    if(!videoUploaded.url && !thumbnailUploaded.url){
        throw new ApiError(400, "somthing went wrong while uploading video, please try again!")
    }

    const video = await Video.create(
        {
            videoFile: videoUploaded.url,
            thumbnail: thumbnailUploaded.url,
            owner: req.user?._id,
            title: title,
            description: description,
            isPublished: isPublished,
            duration: videoUploaded.duration,
            views: 0,
        }
    )

    if(!video){
        throw new ApiError(400, "something went wrong, try again..")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, video, "video uploaded successfully")
    )

})

const getAllVideos = asyncHandler(async(req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
})

const getVideoById = asyncHandler(async(req, res) => {
    const { videoId } = req.params

    if(!videoId){
        throw new ApiError(400, "video id is missing..");
    }

    const getVideo = await Video.findByIdAndUpdate(
        videoId,
        {
            $inc: { views: 1 },
        },
        {
            new: true,
        }
    );
    
    if(!getVideo){
        throw new ApiError(404, "video is not found..");
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, getVideo, "video fatched sunccessfully")
    )
})

const updateVideo = asyncHandler(async(req, res) => {
    const {videoId} = req.params
    if(!videoId){
        throw new ApiError(400, "Video id is missing..");
    }

    if(!req.file || !req.file.thumbnail){
        throw new ApiError(400, "thumbnail is missing..")
    }

    const thumbnailLocalPath = req.file?.thumbnail[0]?.path

    if(!thumbnailLocalPath){
        throw new ApiError(400, "something went wrong thumbnail is not uploaded..");
    }

    const thumbnailUploaded = await uploadOnCloudinary(thumbnailLocalPath);

    if(!thumbnailUploaded.url){
        throw new ApiError(400, "something went wrong thumbnail is not update..")
    }

    const videoThumbnailUpdated = await Video.findByIdAndUpdate(
        videoId,
        {
            thumbnail: thumbnailUploaded.url
        },
        {
            new: true
        }
    )

    if(!videoThumbnailUpdated){
        throw new ApiError(400, "something went wrong..");
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, videoThumbnailUpdated, "thumbnal updated successfully")
    )
})

const deleteVideo = asyncHandler(async(req, res) => {
    const { videoId } = req.params

    if(!videoId){
        throw new ApiError(400, "video id is missing..");
    }
    
    const video = await Video?.findByIdAndDelete(videoId)
    if(!video){
        throw new ApiError(400, "somwthing went wrong..")
    }

    return res
    .status
    .json(
        new ApiResponse(200, video, "Video deleted successfully..")
    )
})

const togglePublishStatus = asyncHandler(async(req, res) => {
    const { videoId } = req.params

    if(!videoId){
        throw new ApiError(400, "video id is missing..");
    }   
    
    const toggledStatus = await Video.findByIdAndUpdate(
        videoId,
        {
            isPublished: !Video.isPublished,
        },
        {
            new: true
        }
    )
    if(!toggledStatus){
        throw new ApiError(400, "something went wrong..")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, toggledStatus, "video's publish status toggeled..")
    );
})

export {
    publishAVideo,
    getAllVideos,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus,
}