import mongoose from "mongoose"
import {Video} from "../models/video.model.js"
import {Subscription} from "../models/subscription.model.js"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getChannelStats = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    // 1. Get all videos by this channel
    const allVideos = await Video.find({ owner: userId }).sort({ createdAt: -1 });
    const totalVideos = allVideos.length;

    // 2. Calculate total views from all videos
    const totalViews = allVideos.reduce((sum, video) => sum + (video.views || 0), 0);

    // 3. Get all likes on the channel's videos
    const videoIds = allVideos.map(video => video._id);
    const totalLikes = await Like.countDocuments({ video: { $in: videoIds } });

    // 4. Get total subscribers for the channel
    const totalSubscribers = await Subscription.countDocuments({ channel: userId });

    // 5. Send response
    res.status(200).json(
        new ApiResponse(200, {
            totalVideos,
            totalViews,
            totalLikes,
            totalSubscribers
        }, "Channel stats fetched successfully")
    );
});


const getChannelVideos = asyncHandler(async (req, res) => {
    // TODO: Get all the videos uploaded by the channel
    const userId=req.user._id

    const allVideos=await  Video.find({owner:userId}).sort({createdAt:-1})
    res.status(200).json(200,allVideos,"All videos has been fetched ")
})

export {
    getChannelStats, 
    getChannelVideos
    }