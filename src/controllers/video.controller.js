import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import {Video} from "../models/video.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

//tested------------------------------------------->
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
/*Explanation of the Code
Query Parameters:

page: The page number for pagination (default: 1).
limit: The number of videos per page (default: 20).
query: A search string for filtering videos by title or description.
sortBy: The field to sort by (default: createdAt).
sortType: The sorting order, asc for ascending or desc for descending (default: desc).
userId: Filters videos owned by a specific user.
Filter Object:

$or: Allows searching by title or description using a case-insensitive regular expression.
owner: Filters videos by the userId if provided.
Pagination:

skip: Skips the appropriate number of videos based on the page.
limit: Limits the number of videos returned.
Sorting:

sort: Dynamically sorts by the specified field (sortBy) in the desired order (sortType).
Response Structure:

Includes the following:
videos: Array of videos for the current page.
totalVideos: Total number of videos matching the filters.
totalPages: Total number of pages available.
currentPage: The current page number.
*/
const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 20, query = "", sortBy = "createdAt", sortType = "desc", userId } = req.query;

    // Convert page and limit to numbers
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);

    // Build the filter object
    const filter = {};

    // Apply query filter for title or description (case-insensitive)
    if (query) {
        filter.$or = [
            { title: { $regex: query, $options: "i" } },
            { description: { $regex: query, $options: "i" } }
        ];
    }

    // Filter by userId if provided
    if (userId) {
        filter.owner = userId;
    }

    // Convert sortType to numeric value (-1 for descending, 1 for ascending)
    const sortOption = sortType === "asc" ? 1 : -1;

    // Fetch videos with filters, pagination, and sorting
    const videos = await Video.find( )
        .sort({ [sortBy]: sortOption }) // Dynamic sorting
        .skip((pageNum - 1) * limitNum) // Skip videos based on the page
        .limit(limitNum); // Limit the number of videos returned

    // Get the total count of videos matching the filters
    const totalVideos = await Video.countDocuments(filter);

    // Return paginated response
    return res.status(200).json(
        new ApiResponse(200, {
            videos,
            totalVideos,
            totalPages: Math.ceil(totalVideos / limitNum),
            currentPage: pageNum,
        }, "Videos retrieved successfully.")
    );
});

//tested------------------------------------------->
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
//tested------------------------------------------->
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
//tested------------------------------------------->
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
//tested------------------------------------------->
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