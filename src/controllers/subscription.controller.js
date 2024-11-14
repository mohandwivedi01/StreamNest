import mongoose from "mongoose"
import {User} from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    // TODO: toggle subscription
    if(!channelId){
        throw new ApiError(400, "channelId not found");
    }

    //check user not subscribe its own channel
    if (channelId.toString() === req.user._id.toString()) {
        throw new ApiError(400, "its not valid request..")
    }
    const subscrib = await Subscription.create(
        {
            subscriber: req.user?._id,
            channel: channelId
        }
    )

    if(!subscrib){
        throw new ApiError(400, "somthing went wrong, try again")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, null, "channel subscribed successfully")
    )
})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    if(!channelId){
        throw new ApiError(404, "channelId is missing")
    }
    
    const subscribers = await Subscription.aggregate([
        {
            $match: {
                channel: channelId
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "subscriber",
                foreignField: "_id",
                as: "subscribers"
            }
        },
        {
            $unwind: "$subscribers" // Unwind the array to access subscriber details directly
        },
        {
            $project: {
                fullName: 1,
                username: 1,
                avatar: 1,
                coverImage: 1,
            }
        }
    ])

    if(!subscribers?.length){
        new ApiError(400, "something went wrong! please try again..")
    }
    return res
    .status(200)
    .json(
        new ApiResponse(200, subscribers, "subscribers fetched successfully")
    )
})


// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params
    if(!subscriberId){
        throw new ApiError(404, "subscriberId is missing..")
    }

    const subscribedChannels = Subscription.aggregate([
        {
            $match: {
                subscriber: subscriberId,
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "channel",
                foreignField: "_id",
                as: "channels",
            }
        },
        {
            $unwind: "$subscribers" // Unwind the array to access subscriber details directly
        },
        {
            $project: {
                fullName: 1,
                username: 1,
                avatar: 1,
                coverImage: 1,
            }
        }
    ])

    if(!subscribedChannels?.length){
        throw new ApiError(404, "something went wrong! please try again..")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, subscribedChannels, "subscribed channels fetched successfully")
    )
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}