import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../models/like.model.js"
import {Tweet} from "../models/tweet.model.js"
import {Comment} from "../models/comment.model.js"
import {Video} from "../models/video.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

// tested--------------------------------->
const toggleVideoLike = asyncHandler(async (req, res) => {
    const {videoId} = req.params
    //TODO: toggle like on video
    if(!videoId){
        throw new ApiError(400, "video id is missing..");
    }
    
    const video = await Video.findById(videoId)
    if(!video){
        throw new ApiError(400, "video is not exists..")
    }
    
    const like = await Like.findOne(
        {
            video: videoId,
            likedBy: req.user._id
        },
        {
            new: true
        }
    )
    
    if(like){
        await Like.findByIdAndDelete(like._id);
    }else{
        await Like.create(
            {
                video: videoId,
                likedBy: req.user._id
            }
        ) 
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, like, "video liked toggeled successfully..")
    )
})
// tested--------------------------------->
const toggleCommentLike = asyncHandler(async (req, res) => {
    const {commentId} = req.params;
    //TODO: toggle like on comment
    if(!commentId){
        throw new ApiError(400, "comment id is missing..");
    }

    const comment = await Comment.findById(commentId);
    if(!comment){
        throw new ApiError(404, "comment is not found..");
    }

    const like = await Like.findOne(
        {
            comment: commentId,
            likedBy: req.user._id
        }
    )

    if(like){
        await Comment.findByIdAndDelete(like._id)
    }else{
        await Like.create(
            {
                comment: commentId,
                likedBy: req.user._id
            }
        )
    }
    

    return res
    .status(200)
    .json(
        new ApiResponse(200, comment, "video liked toggeled successfully..")
    )

})
// tested--------------------------------->
const toggleTweetLike = asyncHandler(async (req, res) => {
    const {tweetId} = req.params
    //TODO: toggle like on tweet
    if(!tweetId){
        throw new ApiError(400, "tweet id is missing..")
    }

    const tweet = await Tweet.findById(tweetId);

    if(!tweet){
        throw new ApiError(404,"tweet not found..")
    }

    const like = await Tweet.findOne(
        {
            tweet: tweetId,
            likedBy: req.user._id,
        },
    )

    try{
        if(like){
            await Like.findByIdAndDelete(like._id)
        }else{
            await Like.create(
                {
                    tweet: tweetId,
                    likedBy: req.user._id
                }
            )
        }
    }catch{
        throw new ApiError(500, "something went wrong..")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, tweet, "tweet like toggeled successfully..")
    )
})

// tested--------------------------------->
const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos
    try{
        const likedVideos = await Like.aggregate(
            [
                {
                  $match: {
                    likedBy: new mongoose.Types.ObjectId(req.user?._id) // Filter likes by current user
                  }
                },
                {
                  $lookup: {
                    from: "videos", // Join with videos collection
                    localField: "video", // Video ID in likes
                    foreignField: "_id", // Video ID in videos collection
                    as: "likedVideos",
                    pipeline: [
                      {
                        $lookup: {
                          from: "users", // Fetch video owners
                          localField: "owner", // Owner in videos
                          foreignField: "_id", // User ID in users
                          as: "owner"
                        }
                      },
                      {
                        $addFields: {
                          owner: { $first: "$owner" } // Simplify owner details
                        }
                      },
                      {
                        $project: {
                          _id: 1,
                          title : 1,
                          description : 1,
                          videoFile : 1,
                          thumbnail : 1,
                          duration : 1,
                          views : 1,
                          isPublised : 1,
                          createdAt : 1,
                          updatedAt : 1,
                          owner: { _id: 1, name: 1, email: 1 } // Customize owner fields
                        }
                      }
                    ]
                  }
                },
                {
                       $match: {
                      video: { $ne: null }
                    }
                  },
                {
                  $addFields: {
                    likedVideos: {
                        $first: '$likedVideos'
                      }
                  }
                },
                {
                  $project: {
                    _id: 1, // Fields from the Likes schema
                    likedAt: "$createdAt", // When the video was liked
                    likedVideos: 1 // Include detailed video information
                  }
                }
            ]
        )
    
        return res
        .status(200)
        .json(
            new ApiResponse(200, likedVideos, "liked videos fetched successfully..")
        )
    }catch(error){
        throw new ApiError(500, `something went wrong, error: ${error}`)
    }
})




export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}


