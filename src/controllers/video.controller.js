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
    const {title, description, isPublished }  = req.body;
    if(!title || !description || isPublished===undefined){
        throw new ApiError(400, "required fields are missing")
    }
    
    // if (req.files && videoLocalPath && thumbnailLocalPath) {
    
    // }

    let videoUploaded;
    let thumbnailUploaded;
    if(req.files && req.files.videoFile && req.files.thumbnail){
        const videoLocalPath = req.files?.videoFile[0]?.path
        const thumbnailLocalPath = req.files?.thumbnail[0]?.path

        if(!videoLocalPath && !thumbnailLocalPath){
            throw new ApiError(400, "video file or thumbnail is missing")
        }
        videoUploaded = await uploadOnCloudinary(videoLocalPath)
        thumbnailUploaded = await uploadOnCloudinary(thumbnailLocalPath)   
    }

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

    //check if video exists
    const video = await Video.findById(videoId)
    if (!video) {
        throw new ApiError(404, "video not found..")
    }

    const updateView = await Video.findByIdAndUpdate(
        videoId,
        {
            $inc: { views: 1 },
        },
        {
            new: true,
        }
    );
    
    if(!updateVideo){
        throw new ApiError(404, "video is not found..");
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, video, "video fatched sunccessfully")
    )
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const { title, description } = req.body;

    // Validate videoId
    if (!videoId) {
        throw new ApiError(400, "Video ID is missing.");
    }

    // Check if video exists
    const video = await Video.findById(videoId);
    if (!video) {
        throw new ApiError(404, "Video not found.");
    }

    // Check if the user is authorized to update the video
    if (video.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(401, "You are not authorized to update this video.");
    }

    // If a new thumbnail is provided, upload it to Cloudinary
    let thumbnailUrl = video.thumbnail; // Default to existing thumbnail   

    if (req.files && req.files.thumbnail) {
        const thumbnailLocalPath = req.files.thumbnail[0]?.path;

        if (!thumbnailLocalPath) {
            throw new ApiError(400, "Thumbnail is not uploaded correctly.");
        }

        const thumbnailUploaded = await uploadOnCloudinary(thumbnailLocalPath);

        if (!thumbnailUploaded.url) {
            throw new ApiError(500, "Failed to upload the thumbnail.");
        }

        thumbnailUrl = thumbnailUploaded.url; // Set to new thumbnail URL
    }else{
        throw new ApiError(500, "somthing went wrong..")
    }

    // Update the video document
    const updatedVideo = await Video.findByIdAndUpdate(
        videoId,
        {
            ...(title && { title }), // Update only if provided
            ...(description && { description }),
            thumbnail: thumbnailUrl, // Always set thumbnail (existing or new)
        },
        { new: true }
    );

    if (!updatedVideo) {
        throw new ApiError(500, "Failed to update the video.");
    }

    // Return success response
    return res
        .status(200)
        .json(
            new ApiResponse(200, updatedVideo, "Video updated successfully.")
        );
});


//****now videos deleting only from DB and remain on cloudinary need to modify api to delete on cloudinary also****

const deleteVideo = asyncHandler(async(req, res) => {
    const { videoId } = req.params

    if(!videoId){
        throw new ApiError(400, "video id is missing..");
    }

    //check if video exists
    const video = await Video.findById(videoId)
    if (!video) {
        throw new ApiError(404,"video not found..")
    }

    //check user is authorized to delete video
    if (video.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(401, "you are not authorized..")
    }
    
    const deletedVideo = await Video?.findByIdAndDelete(videoId)
    if(!deletedVideo){
        throw new ApiError(400, "somwthing went wrong..")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, deletedVideo, "video deleted successfully..")
    )
})

const togglePublishStatus = asyncHandler(async(req, res) => {
    const { videoId } = req.params

    if(!videoId){
        throw new ApiError(400, "video id is missing..");
    }   
    //check if video is exist or not
    const video = await Video.findById(videoId)
    
    if (!video) {
        throw new ApiError(404, "video not found..")
    }

    //check if you are autherized to toggle publish status
    if(video.owner.toString() !== req.user._id.toString()){
        throw new ApiError(401, "you are not autherized to update this video..")
    }
    
    const toggledStatus = await Video.findByIdAndUpdate(
        videoId,
        {
            isPublished: !video.isPublished,
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