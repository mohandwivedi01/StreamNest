import mongoose from "mongoose"
import {Comment} from "../models/comment.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { registerUser } from "./user.controller.js"

const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    const {videoId} = req.params
    const {page = 1, limit = 10} = req.query

})

const addComment = asyncHandler(async (req, res) => {
    // TODO: add a comment to a video
    const {videoId} = req.params;
    const {content} = req.body;

    if(!videoId){
        throw new ApiError(400, "video is missing..");
    }
    if(!content){
        throw new ApiError(400, "content is missing..")
    }

    //check if video exists
    if (!videoId)  {
        throw new ApiError(404, "video not found..")
    }

    const comment = await Comment.create(
        {
            content: content,
            video: videoId,
            owner: req.user._id,
        }
    )

    if(!comment){
        throw new ApiError(400, "something went wrong..");
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, comment, "comment added successfully..")
    )
})

const updateComment = asyncHandler(async (req, res) => {
    // TODO: update a comment
    const {commentId} = req.params
    const {content} = req.body
    if(!commentId){
        throw new ApiError(400, "comment id is missing..")
    }
    if(!content){
        throw new ApiError(400, "content is missing..")
    }
    //check if commnet exists
    const comment = await Comment.findById(commentId)
    if(!comment){
        throw new ApiError(404, "comment not found")
    }
    //check if user is authorized
    if(req.user._id.toString() !== comment.owner.toString()){
        throw new ApiError(400, "you are not authorized to update this comment")
    }

    const updatedComment = await Comment.findByIdAndUpdate(
        commentId,
        {
            content: content,
        },
        {
            new: true
        }
    )
    if(!updatedComment){
        throw new ApiError(400, "something went wrong..")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, updateComment, "comment updated successfully..")
    )
})

const deleteComment = asyncHandler(async (req, res) => {
    // TODO: delete a comment
    const {commentId} = req.params;
    if(!commentId){
        throw new ApiError(400, "comment id is missing..")
    }

    const comment = await Comment.findById(commentId)
    if(!comment){
        throw new ApiError(404, "comment not found..")
    }

    if(req.user._id.toString() !== comment.owner.toString()){
        throw new ApiError(401, "you are not authorized to delete this comment")
    }

    const deletedComment = await Comment.findByIdAndDelete(commentId)

    if(!deletedComment){
        throw new ApiError(400, "something went wrong..")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, deletedComment, "comment deleted successfully..")
    )
})

export {
    getVideoComments, 
    addComment, 
    updateComment,
    deleteComment
    }