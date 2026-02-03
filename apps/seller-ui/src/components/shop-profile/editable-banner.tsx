'use client';

import React, { useRef, useState } from 'react';
import Image from 'next/image';
import { Camera, Loader2 } from 'lucide-react';
import { uploadImage } from '../../lib/api/upload';

interface EditableBannerProps {
  bannerUrl?: string;
  onBannerChange: (url: string) => void;
}

const DEFAULT_BANNER =
  'https://ik.imagekit.io/andrieltecshop/products/coverBanner_1.jpg';

const EditableBanner: React.FC<EditableBannerProps> = ({
  bannerUrl,
  onBannerChange,
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      alert('Please select a valid image file (JPEG, PNG, WebP, or GIF)');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size must be less than 5MB');
      return;
    }

    try {
      setIsUploading(true);
      const result = await uploadImage(file, 'shop-banners');
      onBannerChange(result.url);
    } catch (error) {
      console.error('Failed to upload banner:', error);
      alert('Failed to upload banner. Please try again.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="relative w-full h-[180px] md:h-[240px] bg-gradient-to-br from-blue-500 to-purple-600 group">
      <Image
        src={bannerUrl || DEFAULT_BANNER}
        alt="Shop banner"
        fill
        className="object-cover"
        priority
      />

      {/* Overlay with edit button */}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 hover:bg-white px-4 py-2 rounded-lg flex items-center gap-2 text-gray-800 font-medium shadow-lg disabled:cursor-not-allowed"
        >
          {isUploading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Camera className="w-5 h-5" />
              Change Banner
            </>
          )}
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
};

export default EditableBanner;
