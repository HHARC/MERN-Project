import { asyncHandler } from "../utils/asyncHandler.js";

import { ApiError } from "../utils/ApiError.js";

import { User } from "../models/user.model.js";

import { uploadOnCloudinary } from "../utils/cloudnary.js";

import { ApiResponse } from "../utils/ApiResponse.js";

import jwt from "jsonwebtoken"
import mongoose from "mongoose";

const generateAccessAndRefereshTokens = async (userId) => {
  try {
    const user = await User.findById(userId)
    const accessToken = user.generateAccessToken()
    const refreshToken = user.generateRefreshToken()

    user.refreshToken = refreshToken
    await user.save({ validateBeforeSave: false })

    return { accessToken, refreshToken }

  } catch (error) {
    throw new ApiError("Failed to generate access and refresh tokens", 500);

  }

}

const registerUser = asyncHandler(async (req, res) => {
  const { fullName, email, username, password } = req.body;
  console.log("Email", email);

  if (
    [fullName, email, username, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError("All fields are required", 400);
  }
  const existedUser = await User.findOne({
    $or: [{ email }, { username }],
  });
  if (existedUser) {
    throw new ApiError("Email or username already exists", 409);
  }

  const avatarLocalPath = req.files?.avatar?.[0]?.path;
  const coverImageLocalPath = req.files?.coverImage?.[0]?.path;

  console.log("Avatar Path:", avatarLocalPath);
  console.log("Cover Image Path:", coverImageLocalPath);

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar is mandatory");
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = coverImageLocalPath ? await uploadOnCloudinary(coverImageLocalPath) : null;
  if (!avatar) {
    throw new ApiError("Failed to upload images to cloudinary");
  }

  const user = await User.create({
    fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    username: username.toLowerCase(),
  });

  console.log("User Created:", user); // Debugging log

  if (!user) {
    throw new ApiError(500, "User creation failed in database");
  }
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );
  if (!createdUser) {
    throw new ApiError(500, "Something Went Wrong While Creating the User");
  }

  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User Created Successfully"));
});

const loginUser = asyncHandler(async (req, res) => {

  const { email, username, password } = req.body
  if (!username && !email) {
    throw new ApiError("Email and Username are required", 400)
  }
  const user = await User.findOne({
    $or: [{ email }, { username }],
  })
  if (!user) {
    throw new ApiError("User Not Found", 404)
  }
  const isPasswordValid = await user.isPasswordCorrect(password)

  if (!isPasswordValid) {
    throw new ApiError("Invalid Password", 401)
  }

  const { accessToken, refreshToken } = await generateAccessAndRefereshTokens(user._id)

  const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

  const options = {
    httpOnly: true,
    secure: true
  }
  return res.status(200).cookie("accessToken", accessToken, options).
    cookie("refreshToken", refreshToken, options).json(
      new ApiResponse(200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "User Logged In Successfully"

      )

    )
})

const logoutUser = asyncHandler(async (req, res) => {

  User.findByIdAndDelete(
    await req.user._id,
    {
      $set: {
        refreshToken: undefined,
      },

    }

  )
  const options = {
    httpOnly: true,
    secure: true
  }
  return res.status(200).clearCookie("accessToken", options).clearCookie("refreshToken", options).
    json(
      new ApiResponse(200,
        {},
        "User Logged Out Successfully"
      ))
})


const refreshTokenAccess = asyncHandler(async (req, res) => {
  const incomingRefreshToken = req.cookie.refreshToken || req.body.refreshToken

  if (!incomingRefreshToken) {
    throw new ApiError(401, "No Refrsh token")
  }

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    )
    const user = await User.findById(decodedToken?._id)
    if (!user) {
      throw new ApiError(401, "Invalid Refresh Token")
    }
    if (incomingRefreshToken == !user?.refreshToken) {
      throw new ApiError(401, " Refresh Token is expired and used")
    }
    const options = {
      httpOnly: true,
      secure: true
    }
    const { accessToken, newrefreshToken } = await generateAccessAndRefereshTokens(user._id)

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken: newrefreshToken },
          "Access Token Refreshed"
        )
      )
  } catch (error) {
    throw new ApiError(401, error.message || "Invalid refresh Token")
  }
})

const changeCurrentPassword = asyncHandler(async (req, res) => {

  const { oldPassword, newPassword } = req.body;
  const user = await User.findById(req.user?._id)
  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

  if (!isPasswordCorrect) {
    throw new ApiError(400, "Invalid Old Password")

  }

  user.password = newPassword;
  await user.save({ validateBeforeSave: false })

  return res.status(200).json(
    new ApiResponse(200, {}, "Password Change Successfully")
  )
})

const getCurrentUser = asyncHandler(async (req, res) => {
  return res.status(200).json(new ApiResponse(200, res.user, "Get Current User Successfully"))
})

const updateAccountDetails = asyncHandler(async (req, res) => {
  const { fullName, email } = req.body

  if (!fullName || !email) {
    throw new ApiError(400, "All fields are Required")
  }
  const user = await User.findByIdAndUpdate(req.user?._id,
    {
      $set: {
        fullName,
        email: email
      }
    },
    {
      new: true,
    }
  ).select("-password")

  return res.status(200).json(200, user, "Account Deatisl Change Successfully")
})

const updateUserAvatar = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.file?.path

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar is missing")
  }
  const avatar = await uploadOnCloudinary(avatarLocalPath)

  if (!avatar.url) {
    throw new ApiError(400, "Error while Uploading on cloundinary avatar")

  }
  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        avatar: avatar.url
      }
    },
    { new: true }
  ).select("-password")

  return res.status(200).json(
    new ApiResponse(200, user, "Avatar Uploaded Successfully")
  )
})

const updateUserCoverImage = asyncHandler(async (req, res) => {
  const coverImageLocalPath = req.file?.path

  if (!coverImageLocalPath) {
    throw new ApiError(400, "CoverImage is missing")
  }
  const coverImage = await uploadOnCloudinary(coverImageLocalPath)

  if (!coverImage.url) {
    throw new ApiError(400, "Error while Uploading on cloundinary CoverImage")

  }
  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        coverImage: coverImage.url
      }
    },
    { new: true }
  ).select("-password")

  return res.status(200).json(
    new ApiResponse(200, user, "CoverImage Uploaded Successfully")
  )
})

const getUserChannelProfile=asyncHandler(async (req,res)=>{
  const {username} =req.params

    if(!username.trim()){
      throw new ApiError(400,"username not found")
    }

    const channel=await User.aggregate([
      {
        $match:{
          username:username?.toLowerCase()
        }
      },
      {
        $lookup:{
          from:"subscriptions",
          localField:"_id",
          foreignField:"channel",
          as:"subscribers"

        }
      },{
        $lookup:{
          from:"subscriptions",
          localField:"_id",
          foreignField:"subscriber",
          as:"subscribedTo"
        }
      },{
        $addFields:{
          subscribersCount:{
            $size:"$subscribers"
          },
          channelSubscribedToCount:{
            $size:"$subscribedTo"
          },
          isSubscribed:{
            $cond:{
              if:{$in:[req.user?._id,"$subscribers.subsciber"]},
              then:true,
              else:false
            }
          }
        }
        
      },
      {
        $project:{
          fullName:1,
          username:1,
          subscribersCount:1,
          channelSubscribedToCount:1,
          isSubscribed:1,
          avatar:1,
          coverImage:1,
          email:1
        }
      }
    ])

  
    if(channel?.length){
   throw new ApiError(404,"Channel Does not exists")
    }


return res.
status(200)
.json(
  new ApiResponse(200, channel[0],"User channel Fetched Successfully")
)



})

const getUserHistory=asyncHandler(async(req,res)=>{

  const user= await User.aggregate([
    {
      $match:{
        _id: new mongoose.Types.ObjectId(req.user._id)
      },
      $lookup:{
        from:"videos",
        localField:"watchHistory",
        foreignField:"_id",
        as:"watchHistory",
        pipeline:[
          {
            $lookup:{
              from:"users",
              localField:"owner",
              foreignField:"_id",
              as:"owner",
              pipeline:[
                {
                  $project:{
                    fullName:1,
                    username:1,
                    avatar:1
                  }
                }
              ]
            },
          },
          {
            $addFields:{
              owner:{
                $first:"$owner",
              }
            }
          }
        ]
      }
    }
  ])
   
  return res.status(200).json(
    new ApiResponse(
      200,
      user[0].watchHistory,
      "watchHistory fetch Successfully"
    )
  )
})

export {
  registerUser, loginUser, logoutUser, refreshTokenAccess,
  changeCurrentPassword, getCurrentUser, updateAccountDetails,
  updateUserAvatar, updateUserCoverImage,getUserChannelProfile,getUserHistory
};
