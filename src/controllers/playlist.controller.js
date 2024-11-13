import mongoose, {isValidObjectId} from "mongoose"
import {Playlist} from "../models/playlist.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const createPlaylist = asyncHandler(async (req, res) => {
    const {name, description} = req.body
    //TODO: create playlist
    if (!name) {
        throw new ApiError(400, "name is missing..")
    }
    const playlist = await Playlist.create(
        {
            name: name,
            description: description || "",
            owner: req.user._id
        }
    )

    if(!playlist){
        throw new ApiError(400, "something went wrong..")
    }
    return res
    .status
    .json(
        new ApiResponse(200, playlist, "playlist created successfully..")
    )
})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const {userId} = req.params
    //TODO: get user playlists
})

const getPlaylistById = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    //TODO: get playlist by id
    if (!playlistId) {
        throw new ApiError(400, "playlist id is missing..")
    }

    const playlist = await Playlist.findById(playlistId)

    if(!playlist){
        throw new ApiError(404, "playlist not found..")
    }

    return res
    .status
    .json(
        new ApiResponse(200, playlist, "fatched playlist successfully..")
    )
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params;

    // Validate playlistId and videoId
    if (!playlistId) {
        throw new ApiError(400, "Playlist ID is missing.");
    }
    if (!videoId) {
        throw new ApiError(400, "Video ID is missing.");
    }

    // Find the playlist by ID
    const playlist = await Playlist.findById(playlistId);
    if (!playlist) {
        throw new ApiError(404, "Playlist not found.");
    }

    // Check if the user is authorized to modify this playlist
    if (playlist.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(401, "You are not authorized to add videos to this playlist.");
    }

    // Add video to the playlist's videos array
    const updatedPlaylist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $addToSet: { // Use $addToSet to avoid duplicate video entries
                videos: videoId
            }
        },
        { new: true } // Return the updated document
    );

    if (!updatedPlaylist) {
        throw new ApiError(500, "Something went wrong while updating the playlist.");
    }

    // Return success response
    return res
        .status(200)
        .json(
            new ApiResponse(200, updatedPlaylist, "Video added to playlist successfully.")
        );
});

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    // TODO: remove video from playlist
    //validate playlistId and videoId 
    if(!playlistId || !videoId){
        throw new ApiError(400, "playlist id or video id is missing..")
    }
    //check is playlist exists or not
    const playlist = await Playlist.findById(playlistId)
    if(!playlist){
        throw new ApiError(404, "playlist is not found..")
    }

    //check user is authorized or not
    if(playlist.owner.toString() !== req.user._id.toString()){
        throw new ApiError(401, "You are not authorized to remove videos from this playlist..")
    }
    //check is video available in the playlist or not
    if(!playlist.videos.includes(videoId)){
        throw new ApiError(404, "video is not exist..")
    }
    //remove the video from playlist
    const removeVideo = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $pull: { videos: videoId } // Use $pull to remove the videoId from the videos array
        },
        { new: true } // Return the updated document
    )
    
    if(!removeVideo){
        throw new ApiError(500, "something went wrong..")
    }

    return res
    .status
    .json(
        new ApiResponse(200, removeVideo, "video removed from playlist..")
    )
})

const deletePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    // TODO: delete playlist

    //validate playlist id
    if (!playlistId) {
        throw new ApiError(400, "playlist id is missing..")
    }

    //check is playlist exist
    const playlist = await Playlist.findById(playlistId)
    if(!playlist){
        throw new ApiError(404, "playlist is not found..")
    }

    //check are you autherized to delete this playlist or not
    if(playlist.owner.toString() !== req.user._id.toString()){
        throw new ApiError(401, "you are not autherised to delete this playlist..")
    }

    //find playlist and delete it
    const deletedPlaylist = await Playlist.findByIdAndDelete(playlistId)

    if (deletedPlaylist) {
        throw new ApiError(500, "something went wrong..")
    }

    return res
    .status
    .json(
        new ApiResponse(200, deletedPlaylist, "playlist deleted successfully..")
    )
})

const updatePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    const {name, description} = req.body
    //TODO: update playlist
    //validate playlist id
    if (!playlistId) {
        throw new ApiError(400, "playlist id is missing..")
    }

    //check if playlist exists or not
    const playlist = await Playlist.findById(playlistId)
    if(!playlist){
        throw new ApiError(404, "playlist not found..")
    }

    //check if user is autherized to update playlist
    if (playlist.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(401, "you are not autherized to update this playlist..")
    }

    //update the playlist

    const updatedPlaylist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            ...(name && { name }), // Update name only if it's provided
            ...(description && { description }), // Update description only if it's provided
        },
        { new: true }
    )

    return res
    .status(200)
    .json(
        new ApiResponse(200, updatedPlaylist, "playlist updated successfully..")
    )
})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}