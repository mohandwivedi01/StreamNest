import mongoose,{ObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import {Subscription} from "../models/subscription.model.js"
import {Like} from "../models/like.model.js"
import {Tweet} from "../models/tweet.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

// tested----------------------->
const getChannelStats = asyncHandler(async (req, res) => {
    // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.
    
    try{
        const totalVideos = await Video.countDocuments({owner: req.user?._id})
    
        const totalViews = await Video.aggregate([
            {
                $match: {
                    owner: new mongoose.Types.ObjectId(req.user._id) // Match videos with the given owner ID
                }
            },
            {
                $group: {
                    _id: null, // Group all matched documents together
                    AllVideosTotalViews: { $sum: "$views" } // Sum the views
                }
            },
        ])
        
        const totalVideoLikes = await Video.aggregate(
            [
                {
                $match: {
                    owner: new mongoose.Types.ObjectId(req.user._id) // Match videos by the specific owner
                }
                },
                {
                $lookup: {
                    from: 'likes', // The collection where likes are stored
                    localField: '_id', // The video ID field in the videos collection
                    foreignField: 'video', // The video reference field in the likes collection
                    as: 'videoLikes' // Output array containing related likes
                }
                },
                {
                $project: {
                    totalVideoLikes: { $size: "$videoLikes" } // Calculate likes for each video
                }
                },
                {
                $group: {
                    _id: null, // Group all documents together
                    allVideosTotalLikes: { $sum: "$totalVideoLikes" } // Sum up all totalVideoLikes
                }
                }
            ] 
        )
        
        const totalTweetLikes = await Tweet.aggregate(
            [
                {
                $match: {
                    owner: new mongoose.Types.ObjectId(req.user._id) // Match videos by the specific owner
                }
                },
                {
                $lookup: {
                    from: 'likes', // The collection where likes are stored
                    localField: '_id', // The video ID field in the videos collection
                    foreignField: 'tweet', // The video reference field in the likes collection
                    as: 'tweetLikes' // Output array containing related likes
                }
                },
                {
                $project: {
                    totalTweetLikes: { $size: "$tweetLikes" } // Calculate likes for each video
                }
                },
                {
                $group: {
                    _id: null, // Group all documents together
                    allTweetsTotalLikes: { $sum: "$totalTweetLikes" } // Sum up all totalVideoLikes
                }
                }
            ] 
        )

        const totalSubs = await Subscription.countDocuments({channel: req.user?._id})  

        return res
        .status(200)
        .json(
            new ApiResponse(
                200, {
                totalViews,
                totalVideos,
                totalVideoLikes,
                totalTweetLikes,
                totalSubs  
                }, 
                "all details fetched successfully.."
            )
        )

    }catch(error){
        throw new ApiError(500, `something went wrong, error: ${error}`)
    }
})
// tested----------------------->
const getChannelVideos = asyncHandler(async (req, res) => {
    // TODO: Get all the videos uploaded by the channel
    const {page=1, limit=20} = req.query
    const pageNo = parseInt(page)
    const limitNo = parseInt(limit)
    try{
        const allVideos = await Video.find({owner: req.user?._id})
                                    .sort({createdAt: 1})   // Sort by newest comments first
                                    .skip((pageNo-1)*limitNo)   // Skip comments based on the page
                                    .limit(limitNo)     // Limit the number of comments returned

        return res
        .status(200)
        .json(
            new ApiResponse(200, allVideos, "all user video fetched successfully..")
        )
    }catch(error){
        throw new ApiError(500, `something went wrong, error: ${error}`)
    }
    
})

export {
    getChannelStats, 
    getChannelVideos
    }