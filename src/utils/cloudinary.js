import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();  

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) {
      throw new Error('No file path provided');
    }

    if (!fs.existsSync(localFilePath)) {
      throw new Error('File does not exist');
    }

    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: 'auto',  
    });

    fs.unlinkSync(localFilePath);

    return response;
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error.message);
    // Clean up temporary file if upload fails
    if (fs.existsSync(localFilePath)) {
      fs.unlinkSync(localFilePath);
    }
    return null;
  }
};

export { uploadOnCloudinary };
