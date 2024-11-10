import mongoose, { isValidObjectId } from "mongoose";
import {Tweet} from "../models/tweet.model.js";
import {User} from "../models/user.model.js";
import {ApiError} from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";


const createTweet = asyncHandler(async (req, res) =>{
    const {content} = req.body;

    if(!content){
        throw ApiError(400, "content is missing!")
    }

    const user = await req.u

    const tweet = await Tweet.create(
        {
            content: content,
            owner: req.user?._id,
        },
        {
            new: true
        }
    )

    if(!tweet){
        throw new ApiError(400, "somthing went wrong!")
    }

    retrun res
    .status(200)
    .json(
        new ApiResponse(200, tweet, "tweet created successfully")
    )
})

const getUserTweets = asyncHandler(async (req, res) => {
    const {userId} = req.params

    if(!userId){
        throw new ApiError(400, "userId is missing"); 
    }

    const getUserTweets = await Tweet.aggregate([
        {
            $match: {
                owner: mongoose.Types.ObjectId(userId)
            }
        },
        {
            $lookup: {
                from: "users",
                
            }
        }
    ])

})

const updateTweet = asyncHandler(async (req, res)=>{
    const { content } = req.body;
    const { tweetId } = req.params;

    if(!tweetId || !content){
        throw ApiError(400, "somthing went wrong may be tweetId or content is missing!")
    }

    const tweet = await Tweet.findById(tweetId)
    
    if(!tweet){
        throw new ApiError(400, "tweet not found")
    }

    if(req.user._id.toString() !== tweet.owner.toString()){
        throw new ApiError(400, "you are not authorized to update this tweet")
    }

    const response = await Tweet?.findByIdAndUpdate(
        tweetId,
        {
            $set: {
                content,
            }
        },
        {new: true}
    );

    if(!response){
        throw new ApiError(400, "Unable to update tweet");
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, response, "tweet updated successfully")
    )
})


const deleteTweet = asyncHandler(async (req, res)=>{
    const {tweetId} = req.params;
    if(!tweetId){
        throw new ApiError(400, "tweetId is missing");
    }
    const tweet = await Tweet.findById(tweetId);
    if(!tweet){
        throw new ApiError(400, "tweet not found please provide correct tweet id");
    }
    if(req.user?._id.toString() !== Tweet.owner?.toString()){
        throw new ApiError(400, "You are not authorized to delete this tweet")
    }

    const deleteTweet = await Tweet.findByIdAndDelete(tweetId)
    
    if(!deleteTweet){
        throw new ApiError(400, "Unable to delete")
    }
    
    return res
    .status(200)
    .json(
        new ApiResponse(200, null, "Tweet deleted successfully")
    )
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet,
}