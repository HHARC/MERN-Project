import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const healthcheck = asyncHandler(async (req, res) => {
    //TODO: build a healthcheck response that simply returns the OK status as json with a message
    const Responce=new ApiResponse(200,"Server is Running ")
    res.status(200).json(Responce)
})

export {
    healthcheck
    }
    