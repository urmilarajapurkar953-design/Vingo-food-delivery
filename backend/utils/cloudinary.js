import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';

// Move config outside the function
cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null;

        // Upload the file to cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto",
        });

        // File has been uploaded successfully
        fs.unlinkSync(localFilePath); // Remove local temporary file
        return response.secure_url;

    } catch (error) {
        if (fs.existsSync(localFilePath)) {
            fs.unlinkSync(localFilePath); // Delete local file if upload failed
        }
        console.error("Error uploading to Cloudinary:", error);
        return null;
    }
}

export default uploadOnCloudinary;