
import { writeAsyncIterableToWritable } from '@remix-run/node';
import cloudinary from 'cloudinary'

cloudinary.v2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function uploadCloudinaryImage(
    data: AsyncIterable<Uint8Array>, options: cloudinary.UploadApiOptions
  ) {
    const uploadPromise = new Promise<cloudinary.UploadApiResponse|undefined>(
      async (resolve, reject) => {
        const uploadStream =
          cloudinary.v2.uploader.upload_stream(
            options,
            (error, result) => {
              if (error) {
                reject(error);
                return;
              }
              resolve(result);
            }
          );
        await writeAsyncIterableToWritable(
          data,
          uploadStream
        );
      }
    );
  
    return uploadPromise;
  }

export async function deleteCloudinaryImage(publicId: string) : Promise<cloudinary.DeleteApiResponse|undefined> {
    const deletePromise = new Promise<cloudinary.DeleteApiResponse|undefined>((resolve, reject) => {
        cloudinary.v2.uploader.destroy(
            publicId,
            (error, result) => {
                if (error) {
                    reject(error)
                    return;
                }
                resolve(result)
            }
        )
    })
    
    return deletePromise
}

