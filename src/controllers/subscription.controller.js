import mongoose, { isValidObjectId } from "mongoose"
import { User } from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

// ✅ TOGGLE SUBSCRIPTION
const toggleSubscription = asyncHandler(async (req, res) => {
    const { channelId } = req.params;

    if (!isValidObjectId(channelId)) {
        throw new ApiError(400, "Channel ID is invalid");
    }

    if (req.user._id.toString() === channelId.toString()) {
        throw new ApiError(400, "You cannot subscribe to your own channel");
    }

    const existingSubscription = await Subscription.findOne({
        subscriber: req.user._id,
        channel: channelId
    });

    if (existingSubscription) {
        await existingSubscription.deleteOne();
        return res.status(200).json(
            new ApiResponse(200, null, "Unsubscribed from the channel")
        );
    }

    const newSubscription = await Subscription.create({
        subscriber: req.user._id,
        channel: channelId
    });

    return res.status(200).json(
        new ApiResponse(200, newSubscription, "Subscribed to the channel")
    );
});

const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const { channelId } = req.params;

    if (!isValidObjectId(channelId)) {
        throw new ApiError(400, "Channel ID is invalid");
    }

    const subscribers = await Subscription.find({ channel: channelId })
        .populate("subscriber", "username avatar");

    return res.status(200).json(
        new ApiResponse(200, subscribers, "Subscribers fetched successfully")
    );
});

const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params;
 
    if (!isValidObjectId(subscriberId)) {
        throw new ApiError(400, "Subscriber ID is invalid");
    }

    const subscriptions = await Subscription.find({ subscriber: subscriberId })
        .populate("channel", "username avatar");

    return res.status(200).json(
        new ApiResponse(200, subscriptions, "Subscribed channels fetched successfully")
    );
});

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}
