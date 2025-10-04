import React, { useState } from 'react';
import ImagePlaceHolder from '../../image-placeholder';

export interface ProductImageUploaderProps {
  images: (File | null)[];
  onChange: (images: (File | null)[]) => void;
  className?: string;
}

/**
 * ProductImageUploader component
 * Manages product image uploads with 1 main image + 3 additional images
 *
 * @example
 * const [images, setImages] = useState<(File | null)[]>([null, null, null, null]);
 * <ProductImageUploader images={images} onChange={setImages} />
 */
const ProductImageUploader: React.FC<ProductImageUploaderProps> = ({
  images,
  onChange,
  className = '',
}) => {
  const [_openImageModal, setOpenImageModal] = useState(false);

  const handleImageChange = (file: File | null, index: number) => {
    const updated = [...images];
    updated[index] = file;
    onChange(updated);
  };

  const handleImageRemove = (index: number) => {
    const updated = [...images];
    updated[index] = null;
    onChange(updated);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-200 mb-4">
        Product Images
      </h3>

      {/* Main Image */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Main Image *
        </label>
        <ImagePlaceHolder
          size="large"
          small={false}
          index={0}
          onImageChange={handleImageChange}
          onRemove={handleImageRemove}
          setOpenImageModal={setOpenImageModal}
          defaultImage={images[0] ? URL.createObjectURL(images[0]) : null}
        />
        <p className="mt-2 text-xs text-gray-400">
          Upload the main product image (Required)
        </p>
      </div>

      {/* Additional Images Grid */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Additional Images (Optional)
        </label>
        <div className="grid grid-cols-3 gap-2">
          {[1, 2, 3].map((idx) => (
            <ImagePlaceHolder
              key={idx}
              size="small"
              small={true}
              index={idx}
              onImageChange={handleImageChange}
              onRemove={handleImageRemove}
              setOpenImageModal={setOpenImageModal}
              defaultImage={
                images[idx] ? URL.createObjectURL(images[idx]) : null
              }
            />
          ))}
        </div>
        <p className="mt-2 text-xs text-gray-400">
          Upload up to 3 additional images
        </p>
      </div>

      {/* Image Upload Tips */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 mt-4">
        <h4 className="text-sm font-semibold text-gray-200 mb-2">
          📸 Image Guidelines
        </h4>
        <ul className="text-xs text-gray-400 space-y-1">
          <li>• Use high-quality images (min 800x800px)</li>
          <li>• Supported formats: JPG, PNG, WebP</li>
          <li>• Max file size: 5MB per image</li>
          <li>• Use clear, well-lit photos</li>
        </ul>
      </div>
    </div>
  );
};

ProductImageUploader.displayName = 'ProductImageUploader';

export { ProductImageUploader };
