import apiClient from './client';

export interface UploadImageResponse {
  url: string;
  fileId: string;
  name: string;
  size: number;
  filePath: string;
}

/**
 * Upload a single image to ImageKit via backend API
 * @param file - The image file to upload
 * @param folder - Optional folder path in ImageKit (e.g., 'products', 'categories')
 * @returns ImageKit URL and metadata
 */
export const uploadImage = async (
  file: File,
  folder = 'products'
): Promise<UploadImageResponse> => {
  const formData = new FormData();
  formData.append('image', file);
  formData.append('folder', folder);

  const response = await apiClient.post<UploadImageResponse>(
    '/seller/upload-image',
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );

  return response.data;
};

/**
 * Upload multiple images to ImageKit
 * @param files - Array of image files to upload
 * @param folder - Optional folder path in ImageKit
 * @returns Array of ImageKit URLs and metadata
 */
export const uploadImages = async (
  files: File[],
  folder = 'products'
): Promise<UploadImageResponse[]> => {
  const uploadPromises = files.map((file) => uploadImage(file, folder));
  return Promise.all(uploadPromises);
};
