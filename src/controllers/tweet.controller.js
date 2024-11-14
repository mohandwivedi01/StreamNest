import mongoose, { isValidObjectId } from "mongoose";
import {Tweet} from "../models/tweet.model.js";
import {ApiError} from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";


const createTweet = asyncHandler(async (req, res) =>{
    
    const {content} = req.body;
    
    if(!content){
        throw ApiError(400, "content is missing!")
    }
    
    const tweet = await Tweet.create(
        {
            content: content,
            owner: req.user?._id,
        }
    )
    
    if(!tweet){
        throw new ApiError(400, "somthing went wrong!")
    }

    console.log("tweet id: ",tweet?._id)
    
    return res
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
                localField: "$owner",
                foreignField: "#_id",
                as: ""                         
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

    if(req.user?._id.toString() !== tweet.owner?.toString()){
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

const  getTweetsById = asyncHandler(async(req, res) => {
    const {tweetId} = req.params;

    if(!tweetId){
        throw new ApiError(400, "tweet id is missing..")
    }

    //check if tweet exists
    const tweet = await Tweet.findById(tweetId)
    if (!tweet) {
        throw new ApiError(404, "tweet not found..")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, tweet, "tweet fetched successfully..")
    )
})
export {
    createTweet,
    updateTweet,
    getUserTweets,
    deleteTweet,
    getTweetsById
}