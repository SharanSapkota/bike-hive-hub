import { api } from './api';

export interface PresignedUrlResponse {
  url: string;
  key: string;
}

/**
 * Get a presigned URL from the backend for S3 upload
 */
export const getPresignedUrl = async (fileName: string, fileType: string): Promise<PresignedUrlResponse> => {
  const response = await api.get('/presigned', {
    params: {
      fileName,
      fileType,
    },
  });
  return response.data;
};

/**
 * Upload a file to S3 using the presigned URL
 */
export const uploadToS3 = async (presignedUrl: string, file: File): Promise<void> => {
  await fetch(presignedUrl, {
    method: 'PUT',
    body: file,
    headers: {
      'Content-Type': file.type,
    },
  });
};

/**
 * Upload multiple images and return their S3 URLs
 */
export const uploadImages = async (files: File[]): Promise<string[]> => {
  const uploadPromises = files.map(async (file) => {
    // Get presigned URL
    const { url: presignedUrl, key } = await getPresignedUrl(file.name, file.type);
    
    // Upload to S3
    await uploadToS3(presignedUrl, file);
    
    // Return the public URL (remove query params from presigned URL)
    const publicUrl = presignedUrl.split('?')[0];
    return publicUrl;
  });

  return Promise.all(uploadPromises);
};
