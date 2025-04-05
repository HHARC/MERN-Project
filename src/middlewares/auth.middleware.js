import { asyncHandler } from "../utils/asyncHandler";
import jwt from "jsonwebtoken"
import { User } from "../models/user.model"


export const verifyJWT=asyncHandler(async (req,res,next)=>{
    try {
        const token=req.cookies?.accessToken || req.header
        ("Authorization")?.replace("Bearer","")
    
        if(!token) return next(new ApiError("Not authorized, token required",401))
    
        const decodedToken= jwt.verify(token,process.env.ACCESS_TOKEN_SECRET)
    
        const user=await User.findById(decodedToken?._id).select("-password -refreshToken")
    
        if(!user)  {
            new ApiError("Invalid Token",401)
        }
    
        req.user=user
        next()
    } catch (error) {
        throw new ApiError("Invalid Token",401)
        
    }
    
})