import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import fs from 'fs';

const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;
    const filterConditions = {};
    if (query) {
        filterConditions.title = { $regex: query, $options: "i" };
    }

    if (userId) {
        filterConditions.owner = userId;
    }

    const sortCondition = {};
    if (sortBy) {
        sortCondition[sortBy] = sortType === 'desc' ? -1 : 1;
    }

    const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        sort: sortCondition,
    };

    const videos = await Video.aggregatePaginate(
        Video.find(filterConditions).populate('owner', 'fullName username avatar'),
        options
    );

    res.status(200).json(ApiResponse.success("Fetched all videos", videos));
});

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description } = req.body;
    const videoFile = req.files.videoFile[0];
    const thumbnailFile = req.files.thumbnail[0];

    if (!videoFile || !thumbnailFile) {
        throw new ApiError(400, "Video file and thumbnail are required");
    }

    const videoResponse = await uploadOnCloudinary(videoFile.path);
    const thumbnailResponse = await uploadOnCloudinary(thumbnailFile.path);

    const video = await Video.create({
        title,
        description,
        videoFile: videoResponse.url,
        thumbnail: thumbnailResponse.url,
        duration: videoFile.size,
        owner: req.user._id,
    });

    fs.unlinkSync(videoFile.path);
    fs.unlinkSync(thumbnailFile.path);

    res.status(201).json(ApiResponse.success("Video published successfully", video));
});

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }

    const video = await Video.findById(videoId).populate('owner', 'fullName username avatar');
    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    res.status(200).json(ApiResponse.success("Video found", video));
});

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const { title, description } = req.body;

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }

    const video = await Video.findById(videoId);
    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    video.title = title || video.title;
    video.description = description || video.description;

    if (req.file) {
        const thumbnailResponse = await uploadOnCloudinary(req.file.path);
        video.thumbnail = thumbnailResponse.url;
        fs.unlinkSync(req.file.path);
    }

    await video.save();

    res.status(200).json(ApiResponse.success("Video updated successfully", video));
});

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }

    const video = await Video.findById(videoId);
    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    await video.deleteOne();

    res.status(200).json(ApiResponse.success("Video deleted successfully"));
});

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }

    const video = await Video.findById(videoId);
    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    video.isPublished = !video.isPublished;
    await video.save();

    res.status(200).json(ApiResponse.success("Video publish status updated", video));
});

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
};
