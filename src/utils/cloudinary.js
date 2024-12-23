import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';


cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET
});


const uploadOnCloudinary = async (localFilePath) => {
    try{
        if(!localFilePath) return null;
        const response =  await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        })
        //file has been successfully uploaded
        console.log("file is uploaded on cloudinary ", response);

        // Await fs.promises.unlink() to ensure file is deleted after upload
        await fs.promises.unlink(localFilePath)
        
        return response; 

    }catch(error){
        fs.unlinkSync(localFilePath) //remove the local saved temporary file as the upload failed
        return null;
    }
}

const deleteVideoFromCloudinary = async (publicId) => {
    try {
        const result = await cloudinary.uploader.destroy(publicId, { resource_type: "video" });
        
        return result;
    } catch (error) {
        console.error("Error deleting video:", error);
        throw new Error("Failed to delete video from Cloudinary");
    }
};

export {uploadOnCloudinary}

// Upload an image
// const uploadResult = await cloudinary.uploader
// .upload(
//     'https://res.cloudinary.com/demo/image/upload/getting-started/shoes.jpg', {
//         public_id: 'shoes',
//     }
// )
// .catch((error) => {
//     console.log(error);
// })