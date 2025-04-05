import { v2 as cloudinary } from 'cloudinary';
import fs from "fs"

    cloudinary.config({ 
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
        api_key: process.env.CLOUDINARY_API_KEY, 
        api_secret: process.env.CLOUDINARY_API_SECRET
    })


const uploadOnCloudinary=async(localFilePath)=>{
    try {
        if(!localFilePath) return null

        const responce=await cloudinary.uploader.upload(localFilePath,{
            resource_type:'auto'
        })
        //console.log("File has been Uploaded Successfully my boi :)",responce.url)
        fs.unlinkSync(localFilePath)
        return responce;
        
    } catch (error) {
        fs.unlinkSync(localFilePath)
        //remove the file from our storage 
        return null
    }
}

export {uploadOnCloudinary};