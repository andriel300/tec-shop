'use client';

import { useState, useEffect, useRef } from 'react';
import { IKImage } from 'imagekitio-next';
import { Upload, X, Image as ImageIcon, Loader2, Wand2 } from 'lucide-react';
import { toast } from 'sonner';
import { imagekitConfig, getImageKitPath } from '../../lib/imagekit-config';
import { enhancements } from '../../lib/utils/AI.enhancements';
import { uploadImage } from '../../lib/api/upload';

const ImagePlaceHolder = ({
  size,
  small,
  onImageChange,
  onRemove,
  defaultImage = null,
  index = 0,
  setOpenImageModal,
  onImageUploaded,
}: {
  size: string;
  small?: boolean;
  onImageChange: (file: File | null, index: number) => void;
  onRemove?: (index: number) => void;
  defaultImage?: string | null;
  setOpenImageModal: (OpenImageModal: boolean) => void;
  index?: number;
  onImageUploaded?: (url: string, index: number) => void;
}) => {
  const [imagePreview, setImagePreview] = useState<string | null>(defaultImage);
  const [isLoading, setIsLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [showEnhancementModal, setShowEnhancementModal] = useState(false);
  const [selectedEnhancement, setSelectedEnhancement] = useState<string | null>(null);
  const [tempEnhancement, setTempEnhancement] = useState<string | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);

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

  // Close modal when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        setShowEnhancementModal(false);
        setTempEnhancement(selectedEnhancement);
      }
    };

    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowEnhancementModal(false);
        setTempEnhancement(selectedEnhancement);
      }
    };

    if (showEnhancementModal) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscKey);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('keydown', handleEscKey);
      };
    }

    return undefined;
  }, [showEnhancementModal, selectedEnhancement]);

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

      // Show temporary blob preview for immediate feedback
      const tempPreview = URL.createObjectURL(file);
      setImagePreview(tempPreview);

      // Notify parent of File selection (for form submission)
      onImageChange(file, index);

      // Upload to ImageKit
      const uploadResult = await uploadImage(file, 'products');

      // Cleanup blob URL and set ImageKit URL
      URL.revokeObjectURL(tempPreview);
      setImagePreview(uploadResult.url);

      // Notify parent of ImageKit URL
      if (onImageUploaded) {
        onImageUploaded(uploadResult.url, index);
      }

      toast.success('Image uploaded', {
        description: `${file.name} (${(file.size / 1024).toFixed(1)}KB)`,
      });
    } catch (error) {
      toast.error('Upload failed', {
        description: error instanceof Error ? error.message : 'Failed to upload image. Please try again.',
      });
      console.error('Error uploading image:', error);

      // Clear preview on error
      if (imagePreview && imagePreview.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreview);
      }
      setImagePreview(null);
      onImageChange(null, index);
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

  // Enhancement modal handlers
  const handleSelectEnhancement = (effect: string) => {
    // Toggle: if same effect is clicked, deselect it
    setTempEnhancement((prev) => (prev === effect ? null : effect));
  };

  const handleWandClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setTempEnhancement(selectedEnhancement);
    setShowEnhancementModal(true);
  };

  const handleApplyEnhancements = () => {
    setSelectedEnhancement(tempEnhancement);
    setShowEnhancementModal(false);

    if (tempEnhancement) {
      const enhancementLabel = enhancements.find(e => e.effect === tempEnhancement)?.label || 'Enhancement';
      toast.success('Enhancement applied', {
        description: enhancementLabel,
      });
    } else {
      toast.info('Enhancement cleared');
    }
  };

  const handleCancelEnhancements = () => {
    setTempEnhancement(selectedEnhancement);
    setShowEnhancementModal(false);
  };

  // Check if image is uploaded (not a blob URL)
  const isImageUploaded = imagePreview && !imagePreview.startsWith('blob:');

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
                quality: 85,
                focus: 'auto',
                ...(selectedEnhancement && {
                  e: selectedEnhancement.replace('e-', '')
                })
              }]}
              loading="eager"
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
              {isImageUploaded && (
                <div className="relative">
                  <button
                    type="button"
                    onClick={handleWandClick}
                    disabled={isLoading}
                    className={`p-2 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                      selectedEnhancement
                        ? 'bg-gradient-to-br from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700'
                        : 'bg-purple-600 hover:bg-purple-700'
                    }`}
                    title="AI Enhancements"
                  >
                    <Wand2 size={small ? 16 : 20} />
                  </button>
                  {selectedEnhancement && (
                    <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                      <svg className="w-2 h-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </span>
                  )}
                </div>
              )}
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

          {/* AI Enhancement Modal */}
          {isImageUploaded && showEnhancementModal && (
            <div
              className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-75"
              style={{ animation: 'fadeIn 200ms ease-out' }}
            >
              <div
                ref={modalRef}
                className="bg-gray-900 border border-gray-700 rounded-xl shadow-2xl w-full max-w-2xl mx-4"
                style={{ animation: 'slideUp 200ms ease-out' }}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Modal Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg">
                      <Wand2 size={20} className="text-white" />
                    </div>
                    <h3 className="text-xl font-semibold text-white">
                      Enhance Product Image
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={handleCancelEnhancements}
                    className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Modal Body */}
                <div className="p-6">
                  {/* Image Preview */}
                  <div className="mb-6 flex justify-center">
                    <div className="relative w-full max-w-md h-64 bg-gray-800 rounded-lg overflow-hidden border-2 border-gray-700">
                      <IKImage
                        urlEndpoint={imagekitConfig.urlEndpoint}
                        path={getImageKitPath(imagePreview)}
                        alt="Preview"
                        width={400}
                        height={400}
                        transformation={[{
                          width: '400',
                          height: '400',
                          crop: 'at_max',
                          quality: 90,
                          focus: 'auto',
                          ...(tempEnhancement && {
                            e: tempEnhancement.replace('e-', '')
                          })
                        }]}
                        loading="eager"
                        className="absolute inset-0 w-full h-full object-contain"
                      />
                    </div>
                  </div>

                  {/* AI Enhancements Grid */}
                  <div className="mb-6">
                    <h4 className="text-sm font-medium text-gray-300 mb-3">
                      AI Enhancements
                    </h4>
                    <div className="grid grid-cols-2 gap-3">
                      {enhancements.map((enhancement) => {
                        const isSelected = tempEnhancement === enhancement.effect;
                        return (
                          <button
                            key={enhancement.effect}
                            type="button"
                            onClick={() => handleSelectEnhancement(enhancement.effect)}
                            className={`flex items-center gap-3 p-4 rounded-lg border-2 transition-all ${
                              isSelected
                                ? 'bg-gradient-to-br from-purple-600/20 to-blue-600/20 border-purple-500'
                                : 'bg-gray-800 border-gray-700 hover:border-gray-600'
                            }`}
                          >
                            <div className={`flex items-center justify-center w-5 h-5 rounded-full border-2 transition-colors ${
                              isSelected
                                ? 'bg-purple-600 border-purple-600'
                                : 'border-gray-600'
                            }`}>
                              {isSelected && (
                                <div className="w-2.5 h-2.5 bg-white rounded-full" />
                              )}
                            </div>
                            <span className={`text-sm font-medium ${
                              isSelected ? 'text-white' : 'text-gray-300'
                            }`}>
                              {enhancement.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-700 bg-gray-800/50">
                  <button
                    type="button"
                    onClick={handleCancelEnhancements}
                    className="px-4 py-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleApplyEnhancements}
                    className="px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-medium rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all shadow-lg"
                  >
                    Apply{tempEnhancement ? ' Enhancement' : ''}
                  </button>
                </div>
              </div>
            </div>
          )}
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

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </div>
  );
};

export default ImagePlaceHolder;
