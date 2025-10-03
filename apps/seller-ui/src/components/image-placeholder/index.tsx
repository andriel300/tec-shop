'use client';

import { useState, useEffect } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';

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

  // Update preview when defaultImage changes
  useEffect(() => {
    setImagePreview(defaultImage);
  }, [defaultImage]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
        return;
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please upload an image file');
        return;
      }

      const preview = URL.createObjectURL(file);
      setImagePreview(preview);
      onImageChange(file, index);
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    setImagePreview(null);
    onImageChange(null, index);
    if (onRemove) {
      onRemove(index);
    }
  };

  const handleClick = () => {
    document.getElementById(`image-upload-${index}`)?.click();
  };

  return (
    <div
      onClick={handleClick}
      className={`relative ${
        small ? 'h-[120px]' : 'h-[300px]'
      } w-full cursor-pointer bg-gray-800 border-2 border-dashed border-gray-600 rounded-lg flex flex-col justify-center items-center hover:border-blue-500 hover:bg-gray-750 transition-all duration-200 group overflow-hidden`}
    >
      <input
        type="file"
        accept="image/*"
        className="hidden"
        id={`image-upload-${index}`}
        onChange={handleFileChange}
      />

      {imagePreview ? (
        <>
          {/* Image Preview */}
          <img
            src={imagePreview}
            alt={`Product ${index}`}
            className="absolute inset-0 w-full h-full object-cover"
          />

          {/* Overlay on Hover */}
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-60 transition-all duration-200 flex items-center justify-center">
            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-2">
              <button
                type="button"
                onClick={handleClick}
                className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                title="Change image"
              >
                <Upload size={small ? 16 : 20} />
              </button>
              <button
                type="button"
                onClick={handleRemove}
                className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
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
          <div className="flex flex-col items-center justify-center text-gray-400 group-hover:text-blue-400 transition-colors">
            {small ? (
              <>
                <ImageIcon size={24} className="mb-1" />
                <span className="text-xs">Upload</span>
              </>
            ) : (
              <>
                <Upload size={32} className="mb-2" />
                <span className="text-sm font-medium">Click to upload</span>
                <span className="text-xs mt-1">or drag and drop</span>
                <span className="text-xs text-gray-500 mt-2">
                  PNG, JPG, WebP (max 5MB)
                </span>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default ImagePlaceHolder;
