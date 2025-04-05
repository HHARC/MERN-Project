import { asyncHandler } from "../utils/asyncHandler.js";

import { ApiError } from "../utils/ApiError.js";

import { User } from "../models/user.model.js";

import { uploadOnCloudinary } from "../utils/cloudnary.js";

import { ApiResponse } from "../utils/ApiResponse.js";

const generateAccessAndRefereshTokens=async(userId)=>{
    try {
      const user=await User.findById(userId)
      const accessToken=user.generateAccessToken()
      const refreshToken=user.generateRefreshToken()

      user.refreshToken=refreshToken
      await user.save({validateBeforeSave:false})

      return {accessToken,refreshToken}
      
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

const loginUser= asyncHandler(async(req,res)=>{

  const {email,username,password}=req.body
  if(!username || !email){
    throw new ApiError("Email and Username are required",400)
  }
  const user=await User.findOne({
    $or:[{email},{username}],
  })
  if(!user){
    throw new ApiError("User Not Found",404)
  }
  const isPasswordValid=await user.isPasswordCorrect(password)

  if(!isPasswordValid){
    throw new ApiError("Invalid Password",401)
  }

  const {accessToken,refreshToken} =await generateAccessAndRefereshTokens(user._id)

  const loggedInUser= await User.findById(user._id).select("-password -refreshToken")

  const options={
    httpOnly:true,
    secure:true
  }
  return res.status(200).cookie("accessToken",accessToken,options).
  cookie("refreshToken",refreshToken,options).json(
    new ApiResponse(200,
      {
        user:loggedInUser,
        accessToken,
        refreshToken,
      },
      "User Logged In Successfully"

    )

  )
})

const logoutUser=asyncHandler(async(req,res)=>{

  User.findByIdAndDelete(
   await req.user._id,
    {
      $set:{
        refreshToken:undefined,
      },

    }
    
  )
  const options={
    httpOnly:true,
    secure:true
  }
  return res.status(200).clearCookie("accessToken",options).clearCookie("refreshToken",options).
  json(
    new ApiResponse(200,
      {},
      "User Logged Out Successfully"
    ))
})

export { registerUser,loginUser,logoutUser };
