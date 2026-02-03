'use client';

import React, { useRef, useState } from 'react';
import Image from 'next/image';
import { Camera, Loader2 } from 'lucide-react';
import { uploadImage } from '../../lib/api/upload';

interface EditableLogoProps {
  logoUrl?: string;
  businessName: string;
  onLogoChange: (url: string) => void;
}

const DEFAULT_AVATAR =
  'https://ik.imagekit.io/andrieltecshop/products/avatar.jpg?updatedAt=1763005913773';

const EditableLogo: React.FC<EditableLogoProps> = ({
  logoUrl,
  businessName,
  onLogoChange,
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
      const result = await uploadImage(file, 'shop-logos');
      onLogoChange(result.url);
    } catch (error) {
      console.error('Failed to upload logo:', error);
      alert('Failed to upload logo. Please try again.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="relative group">
      <div className="w-28 h-28 md:w-32 md:h-32 rounded-full border-4 border-white overflow-hidden shadow-lg bg-white">
        <Image
          src={logoUrl || DEFAULT_AVATAR}
          alt={`${businessName} logo`}
          width={128}
          height={128}
          className="object-cover w-full h-full"
        />
      </div>

      {/* Edit button overlay */}
      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading}
        className="absolute inset-0 rounded-full bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center disabled:cursor-not-allowed"
      >
        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
          {isUploading ? (
            <Loader2 className="w-8 h-8 text-white animate-spin" />
          ) : (
            <Camera className="w-8 h-8 text-white" />
          )}
        </div>
      </button>

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

export default EditableLogo;
