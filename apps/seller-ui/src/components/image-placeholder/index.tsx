'use client';

import { useState, useEffect } from 'react';
import { IKImage } from 'imagekitio-next';
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { imagekitConfig, getImageKitPath } from '../../lib/imagekit-config';

const ImagePlaceHolder = ({
  size,
  small,
  onImageChange,
  onRemove,
  defaultImage = null,
  index = 0,
  setOpenImageModal,
}: {
  size: string;
  small?: boolean;
  onImageChange: (file: File | null, index: number) => void;
  onRemove?: (index: number) => void;
  defaultImage?: string | null;
  setOpenImageModal: (OpenImageModal: boolean) => void;
  index?: number;
}) => {
  const [imagePreview, setImagePreview] = useState<string | null>(defaultImage);
  const [isLoading, setIsLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Update preview when defaultImage changes
  useEffect(() => {
    setImagePreview(defaultImage);
  }, [defaultImage]);

  // Cleanup object URLs to prevent memory leaks
  useEffect(() => {
    return () => {
      if (imagePreview && imagePreview.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  // Validate and process file
  const processFile = async (file: File) => {
    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File too large', {
        description: 'File size must be less than 5MB',
      });
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Invalid file type', {
        description: 'Please upload an image file (PNG, JPG, WebP)',
      });
      return;
    }

    try {
      setIsLoading(true);

      // Simulate small delay for loading state (optional, can remove in production)
      await new Promise((resolve) => setTimeout(resolve, 300));

      // Cleanup old preview URL if exists
      if (imagePreview && imagePreview.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreview);
      }

      const preview = URL.createObjectURL(file);
      setImagePreview(preview);
      onImageChange(file, index);

      toast.success('Image uploaded', {
        description: `${file.name} (${(file.size / 1024).toFixed(1)}KB)`,
      });
    } catch (error) {
      toast.error('Upload failed', {
        description: 'Failed to process image. Please try again.',
      });
      console.error('Error processing image:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();

    // Cleanup preview URL
    if (imagePreview && imagePreview.startsWith('blob:')) {
      URL.revokeObjectURL(imagePreview);
    }

    setImagePreview(null);
    onImageChange(null, index);
    if (onRemove) {
      onRemove(index);
    }

    toast.info('Image removed');
  };

  const handleClick = () => {
    if (!isLoading) {
      document.getElementById(`image-upload-${index}`)?.click();
    }
  };

  // Drag and Drop Handlers
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  return (
    <div
      onClick={handleClick}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className={`relative ${
        small ? 'h-[120px]' : 'h-[300px]'
      } w-full cursor-pointer bg-gray-800 border-2 border-dashed rounded-lg flex flex-col justify-center items-center transition-all duration-200 group overflow-hidden ${
        isDragging
          ? 'border-blue-400 bg-blue-900/20 scale-[1.02]'
          : 'border-gray-600 hover:border-blue-500 hover:bg-gray-750'
      } ${isLoading ? 'cursor-wait' : ''}`}
    >
      <input
        type="file"
        accept="image/*"
        className="hidden"
        id={`image-upload-${index}`}
        onChange={handleFileChange}
      />

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-black bg-opacity-70 flex items-center justify-center z-10">
          <div className="flex flex-col items-center gap-2">
            <Loader2
              size={small ? 24 : 32}
              className="animate-spin text-blue-400"
            />
            <span className="text-xs text-gray-300">Processing...</span>
          </div>
        </div>
      )}

      {imagePreview ? (
        <>
          {/* Image Preview - Use regular img for blob URLs (local previews) */}
          {imagePreview.startsWith('blob:') ? (
            <img
              src={imagePreview}
              alt={`Product ${index}`}
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            /* Use IKImage only for uploaded ImageKit URLs */
            <IKImage
              urlEndpoint={imagekitConfig.urlEndpoint}
              path={getImageKitPath(imagePreview)}
              alt={`Product ${index}`}
              width={400}
              height={400}
              transformation={[{
                width: '400',
                height: '400',
                crop: 'at_max',
                quality: '85',
                focus: 'auto'
              }]}
              loading="eager"
              lqip={{ active: true, quality: 20 }}
              className="absolute inset-0 w-full h-full object-cover"
            />
          )}

          {/* Overlay on Hover */}
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-60 transition-all duration-200 flex items-center justify-center">
            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-2">
              <button
                type="button"
                onClick={handleClick}
                disabled={isLoading}
                className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Change image"
              >
                <Upload size={small ? 16 : 20} />
              </button>
              <button
                type="button"
                onClick={handleRemove}
                disabled={isLoading}
                className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Remove image"
              >
                <X size={small ? 16 : 20} />
              </button>
            </div>
          </div>
        </>
      ) : (
        <>
          {/* Upload Placeholder */}
          <div
            className={`flex flex-col items-center justify-center transition-colors ${
              isDragging
                ? 'text-blue-400 scale-110'
                : 'text-gray-400 group-hover:text-blue-400'
            }`}
          >
            {small ? (
              <>
                <ImageIcon size={24} className="mb-1" />
                <span className="text-xs">
                  {isDragging ? 'Drop here' : 'Upload'}
                </span>
              </>
            ) : (
              <>
                <Upload size={32} className="mb-2" />
                <span className="text-sm font-medium">
                  {isDragging ? 'Drop image here' : 'Click to upload'}
                </span>
                <span className="text-xs mt-1">
                  {isDragging ? 'Release to upload' : 'or drag and drop'}
                </span>
                {!isDragging && (
                  <span className="text-xs text-gray-500 mt-2">
                    PNG, JPG, WebP (max 5MB)
                  </span>
                )}
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default ImagePlaceHolder;
