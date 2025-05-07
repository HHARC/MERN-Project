import mongoose, { isValidObjectId } from "mongoose"
import {Tweet} from "../models/tweet.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {
    const { content } = req.body;

    // Assuming user is authenticated and user info is in req.user
    const owner = req.user?._id;

    // Validation
    if (!owner) {
        throw new ApiError(400, "User not authenticated");
    }

    if (!content) {
        throw new ApiError(400, "Tweet content cannot be empty");
    }

    // Create the tweet
    const tweet = await Tweet.create({
        owner: owner,
        content: content,
    });

    // Send response
    res.status(201).json(
        new ApiResponse(201, tweet, "Tweet created successfully")
    );
});


const getUserTweets = asyncHandler(async (req, res) => {
    const userid=req.user._id;

    if(!userid){
        throw new ApiError(400,"User not exists")

    }
    const tweets=await Tweet.find({owner:userId}).sortBy({createdAt:-1})
        
    res.status(200).json(
        new ApiResponse(200,tweets,"Gets all tweets")
    )
    // TODO: get user tweets
})

const updateTweet = asyncHandler(async (req, res) => {
    const { tweetId } = req.params;
    const { content } = req.body;

    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid Tweet ID");
    }

    const tweet = await Tweet.findById(tweetId);

    if (!tweet) {
        throw new ApiError(404, "Tweet not found");
    }

    // Check if the logged-in user is the owner of the tweet
    if (tweet.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to update this tweet");
    }

    // Update content
    tweet.content = content || tweet.content;
    await tweet.save();

    res.status(200).json(
        new ApiResponse(200, tweet, "Tweet updated successfully")
    );
});


const deleteTweet = asyncHandler(async (req, res) => {
    const {tweetid}=req.params

    if(!isValidObjectId(tweetid)){
        throw new ApiError(400,"Error in finding tweet")
    }
    if(tweet.owner.toString()!==req.user._id.toString()){
        throw new ApiError(400,"User is not authorized")
    }
    await tweet.deleteone()
    res.status(200).json(
        new ApiResponse(200,  "Tweet delete successfully")
    );
    //TODO: delete tweet
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}
