import mongoose, { isValidObjectId } from "mongoose"
import { Like } from "../models/like.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid Video ID");
    }

    const userId = req.user._id;

    // Check if the like already exists
    const existingLike = await Like.findOne({
        video: videoId,
        likedBy: userId
    });

    if (existingLike) {
        // Unlike the video
        await existingLike.deleteOne();
        return res.status(200).json(
            new ApiResponse(200, null, "Video unliked successfully")
        );
    }

    // Like the video
    const newLike = await Like.create({
        video: videoId,
        likedBy: userId
    });

    res.status(201).json(
        new ApiResponse(201, newLike, "Video liked successfully")
    );
});


const toggleCommentLike = asyncHandler(async (req, res) => {
    const { commentId } = req.params;

    if (!isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid Comment ID");
    }

    const userId = req.user._id;

    const existingLike = await Like.findOne({
        comment: commentId, // ✅ field name should be lowercase "comment" as defined in schema
        likedBy: userId
    });

    if (existingLike) {
        await existingLike.deleteOne();
        return res.status(200).json(
            new ApiResponse(200, null, "Comment unliked successfully")
        );
    }

    const newLike = await Like.create({
        comment: commentId, // ✅ lowercase
        likedBy: userId
    });

    res.status(201).json(
        new ApiResponse(201, newLike, "Comment liked successfully")
    );
});


const toggleTweetLike = asyncHandler(async (req, res) => {
    const { tweetId } = req.params;

    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid Tweet ID");
    }

    const userId = req.user._id;

    const existingLike = await Like.findOne({
        tweet: tweetId,
        likedBy: userId
    });

    if (existingLike) {
        await existingLike.deleteOne();
        return res.status(200).json(
            new ApiResponse(200, null, "Tweet unliked successfully")
        );
    }

    const newLike = await Like.create({
        tweet: tweetId,
        likedBy: userId
    });

    res.status(201).json(
        new ApiResponse(201, newLike, "Tweet liked successfully")
    );
});


const getLikedVideos = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    const videos = await Like.find({
        likedBy: userId,
        video: { $ne: null } 
    })
    .populate("video") 
    .sort({ createdAt: -1 });

    res.status(200).json(
        new ApiResponse(200, videos, "Retrieved all liked videos")
    );
});


export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}