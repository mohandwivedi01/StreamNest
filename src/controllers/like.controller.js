import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../models/like.model.js"
import {Tweet} from "../models/tweet.model.js"
import {Comment} from "../models/comment.model.js"
import {Video} from "../models/video.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

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

const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos
    const likes = await Like.aggregate(
        [
            {
                $match : {
                    likedBy : mongoose.Types.ObjectId(userId)
                }
            },
            {
                $lookup : {
                    from : "videos",
                    localField : "video",
                    foreignField : "_id",
                    as : "video",
                    pipeline : [
                        {
                            $lookup : {
                                from : "users",
                                localField : "owner",
                                foreignField : "_id",
                                as : "owner"
                            }
                        },
                        {
                            $addFields : {
                                owner : {
                                    $first : "$owner"
                                }
                            }
                        }
                    ]
                }
            },
            {
                $lookup : {
                    from : "users",
                    localField : "likedBy",
                    foreignField : "_id",
                    as : "likedBy",
                }
            },
            {
                $addFields : {
                    video : {
                        $first : "$video"
                    },
                    likedBy : {
                        $first : "$likedBy"
                    },
                    totalVideo : {
                        $size : "$video"
                    }
                }
            },
            {
                $project : {
                    video : {
                        title : 1,
                        description : 1,
                        videoFile : 1,
                        thumbnail : 1,
                        duration : 1,
                        views : 1,
                        isPublised : 1,
                        createdAt : 1,
                        updatedAt : 1,
                        owner : 1
                    },
                    likedBy : {
                        username : 1,
                        fullName : 1,
                        avatar : 1
                    },
                    totalVideo : 1
                }
            }

        ]
    )

    if(likes.length===0){
        throw new ApiError(400, "something went wrong..")
    }
    
    return res
    .status(200)
    .json(
        new ApiResponse(200, likes, "liked videos fetched successfully")
    )
})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}