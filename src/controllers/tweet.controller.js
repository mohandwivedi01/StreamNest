import mongoose, { isValidObjectId } from "mongoose";
import {Tweet} from "../models/tweet.model.js";
import {User} from "../models/user.model.js";
import {ApiError} from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";


const createTweet = asyncHandler(async(req, res) =>{
    const {content} = req.body;

})

const getUserTweets = asyncHandler(async(req, res) => {
    const {userId} = req.params

})

const updateTweet = asyncHandler(async(req, res)=>{
    const { tweetId, content } = req.body;

})

const deleteTweet = asyncHandler(async(req, res)=>{
    const {tweetId} = req.params
    
})
export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet,
}