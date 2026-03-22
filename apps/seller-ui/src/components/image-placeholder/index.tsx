'use client';

import { createLogger } from '@tec-shop/next-logger';
import React, { useState, useEffect, useRef } from 'react';

const logger = createLogger('seller-ui:image-placeholder');
import { Image as IKImage } from '@imagekit/next';
import {
  Upload,
  X,
  Image as ImageIcon,
  Loader2,
  Wand2,
  Scissors,
  Layers,
  Sparkles,
  Maximize2,
} from 'lucide-react';
import { toast } from 'sonner';
import { imagekitConfig, getImageKitPath } from '../../lib/imagekit-config';
import {
  enhancements,
  effectToUrlParam,
  type EnhancementEffect,
} from '../../lib/utils/AI.enhancements';
import type { Transformation } from '@imagekit/javascript';
import { uploadImage } from '../../lib/api/upload';
import { sanitizeUrl } from '../../lib/utils/sanitize-url';

const ENHANCEMENT_META: Record<
  EnhancementEffect,
  { icon: React.ElementType; description: string }
> = {
  aiRemoveBackground: { icon: Scissors, description: 'Remove image background' },
  aiDropShadow: { icon: Layers, description: 'Add realistic drop shadow' },
  aiRetouch: { icon: Sparkles, description: 'Enhance & smooth details' },
  aiUpscale: { icon: Maximize2, description: 'AI super-resolution 2x' },
};

const enhancementTransformation = (
  effect: EnhancementEffect | null
): Partial<Transformation> => {
  if (!effect) return {};
  const map: Record<EnhancementEffect, Partial<Transformation>> = {
    aiRemoveBackground: { aiRemoveBackground: true },
    aiDropShadow: { aiDropShadow: true },
    aiRetouch: { aiRetouch: true },
    aiUpscale: { aiUpscale: true },
  };
  return map[effect];
};

const ImagePlaceHolder = ({
  // size,
  small,
  onImageChange,
  onRemove,
  defaultImage = null,
  index = 0,
  // setOpenImageModal,
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
  const [selectedEnhancement, setSelectedEnhancement] =
    useState<EnhancementEffect | null>(null);
  const [tempEnhancement, setTempEnhancement] =
    useState<EnhancementEffect | null>(null);
  const [isApplyingEnhancement, setIsApplyingEnhancement] = useState(false);
  const [isImageLoading, setIsImageLoading] = useState(false);
  const [isModalPreviewLoading, setIsModalPreviewLoading] = useState(false);
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

  // Show loading indicator when a real (non-blob) image URL is set
  useEffect(() => {
    if (imagePreview && !imagePreview.startsWith('blob:')) {
      setIsImageLoading(true);
    } else {
      setIsImageLoading(false);
    }
  }, [imagePreview]);

  // Close modal when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        modalRef.current &&
        !modalRef.current.contains(event.target as Node)
      ) {
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
    // Validate file size (3MB max for optimal ImageKit performance)
    const maxSize = 3 * 1024 * 1024; // 3MB
    if (file.size > maxSize) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
      toast.error('File too large', {
        description: `File is ${sizeMB}MB. Please compress to under 3MB for best results.`,
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

      // Upload to ImageKit with detailed error handling
      const uploadResult = await uploadImage(file, 'products');

      // Validate upload result
      if (!uploadResult || !uploadResult.url) {
        throw new Error('Upload succeeded but no URL returned');
      }

      // Cleanup blob URL and set ImageKit URL
      URL.revokeObjectURL(tempPreview);
      setImagePreview(uploadResult.url);

      // Notify parent of ImageKit URL
      if (onImageUploaded) {
        onImageUploaded(uploadResult.url, index);
      }

      toast.success('Image uploaded successfully', {
        description: `${file.name} (${(file.size / 1024).toFixed(1)}KB)`,
      });
    } catch (error) {
      // Detailed error messages
      let errorMessage = 'Failed to upload image. Please try again.';

      if (error instanceof Error) {
        if (
          error.message.includes('413') ||
          error.message.includes('too large')
        ) {
          errorMessage =
            'Image file is too large. Please compress it to under 3MB.';
        } else if (error.message.includes('timeout')) {
          errorMessage =
            'Upload timed out. Please check your connection and try again.';
        } else if (error.message.includes('network')) {
          errorMessage =
            'Network error. Please check your internet connection.';
        } else {
          errorMessage = error.message;
        }
      }

      toast.error('Upload failed', {
        description: errorMessage,
      });
      logger.error('Error uploading image:', { error });

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
  const handleSelectEnhancement = (effect: EnhancementEffect) => {
    // Toggle: if same effect is clicked, deselect it
    setTempEnhancement((prev) => (prev === effect ? null : effect));
    setIsModalPreviewLoading(true);
  };

  const handleWandClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setTempEnhancement(selectedEnhancement);
    setIsModalPreviewLoading(true);
    setShowEnhancementModal(true);
  };

  const handleApplyEnhancements = async () => {
    setIsApplyingEnhancement(true);

    try {
      setSelectedEnhancement(tempEnhancement);

      if (
        tempEnhancement &&
        imagePreview &&
        !imagePreview.startsWith('blob:')
      ) {
        const baseUrl = imagePreview.split('?')[0]; // Strip existing params
        const urlParam = effectToUrlParam[tempEnhancement];

        // Build enhanced URL directly from the full ImageKit URL when available.
        // imagePreview is set to the full URL returned by the upload API
        // (e.g. https://ik.imagekit.io/id/products/img.jpg), so we can append
        // the transformation query param without needing urlEndpoint at all.
        let enhancedUrl: string;
        if (baseUrl.startsWith('http://') || baseUrl.startsWith('https://')) {
          enhancedUrl = `${baseUrl}?tr=e-${urlParam}`;
        } else {
          // Fallback: reconstruct from urlEndpoint (path-only preview URLs)
          const endpoint = imagekitConfig.urlEndpoint.replace(/\/$/, '');
          if (!endpoint) {
            throw new Error(
              'ImageKit URL endpoint is not configured. Set NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT.'
            );
          }
          const path = baseUrl.startsWith('/') ? baseUrl : `/${baseUrl}`;
          enhancedUrl = `${endpoint}${path}?tr=e-${urlParam}`;
        }

        // Apply optimistically — do not preload; the placeholder's own loading
        // state will handle the spinner while ImageKit processes the AI effect.
        setImagePreview(enhancedUrl);

        // Notify parent component with enhanced URL
        if (onImageUploaded) {
          onImageUploaded(enhancedUrl, index);
        }

        const enhancementLabel =
          enhancements.find((e) => e.effect === tempEnhancement)?.label ||
          'Enhancement';
        toast.success('Enhancement applied', {
          description: `${enhancementLabel} - Image updated`,
        });
      } else if (
        !tempEnhancement &&
        imagePreview &&
        !imagePreview.startsWith('blob:')
      ) {
        // Clear enhancement - strip transformation params from the URL
        const originalUrl = imagePreview.split('?')[0];

        setImagePreview(originalUrl);

        if (onImageUploaded) {
          onImageUploaded(originalUrl, index);
        }

        toast.info('Enhancement cleared - Original image restored');
      }
    } catch (error) {
      logger.error('Error applying enhancement:', { error });
      toast.error('Failed to apply enhancement', {
        description: 'Please try again or choose a different enhancement',
      });
      // Revert to previous enhancement state on error
      setTempEnhancement(selectedEnhancement);
    } finally {
      setIsApplyingEnhancement(false);
      setShowEnhancementModal(false);
    }
  };

  const handleCancelEnhancements = () => {
    setTempEnhancement(selectedEnhancement);
    setShowEnhancementModal(false);
  };

  // Check if image is uploaded (not a blob URL)
  const isImageUploaded = imagePreview && !imagePreview.startsWith('blob:');
  const safeImagePreview = sanitizeUrl(imagePreview);
  return (
    <div
      onClick={handleClick}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className={`relative ${small ? 'h-[120px]' : 'h-[300px]'
        } w-full cursor-pointer bg-surface-container border-2 border-dashed rounded-lg flex flex-col justify-center items-center transition-all duration-200 group overflow-hidden ${isDragging
          ? 'border-brand-primary-600 bg-brand-primary-600/10 scale-[1.02]'
          : 'border-surface-container-highest hover:border-brand-primary-600'
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
              className="animate-spin text-brand-primary-600"
            />
            <span className="text-xs text-gray-900">Processing...</span>
          </div>
        </div>
      )}

      {safeImagePreview ? (
        <>
          {/* Image Preview - Use regular img for blob URLs and enhanced URLs */}
          {safeImagePreview.startsWith('blob:') || safeImagePreview.includes('?tr=') ? (
            <img
              src={safeImagePreview}
              alt={`Product ${index}`}
              className="absolute inset-0 w-full h-full object-cover"
              onLoad={() => setIsImageLoading(false)}
              onError={() => setIsImageLoading(false)}
            />
          ) : imagekitConfig.urlEndpoint ? (
            /* Use IKImage only for basic ImageKit URLs without transformations */
            <IKImage
              urlEndpoint={imagekitConfig.urlEndpoint}
              src={getImageKitPath(safeImagePreview)}
              alt={`Product ${index}`}
              width={400}
              height={400}
              transformation={[
                {
                  width: '400',
                  height: '400',
                  crop: 'at_max',
                  quality: 85,
                  focus: 'auto',
                  ...enhancementTransformation(selectedEnhancement),
                },
              ]}
              loading="eager"
              className="absolute inset-0 w-full h-full object-cover"
              onLoad={() => setIsImageLoading(false)}
              onError={() => setIsImageLoading(false)}
            />
          ) : (
            <img
              src={safeImagePreview}
              alt={`Product ${index}`}
              className="absolute inset-0 w-full h-full object-cover"
              onLoad={() => setIsImageLoading(false)}
              onError={() => setIsImageLoading(false)}
            />
          )}

          {/* Loading skeleton while ImageKit image loads */}
          {isImageLoading && !isLoading && (
            <div className="absolute inset-0 z-[1] flex items-center justify-center bg-surface-container">
              <Loader2 size={small ? 20 : 28} className="animate-spin text-brand-primary" />
            </div>
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
                    className={`p-2 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${selectedEnhancement
                      ? 'bg-gradient-to-br from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700'
                      : 'bg-purple-600 hover:bg-purple-700'
                      }`}
                    title="AI Enhancements"
                  >
                    <Wand2 size={small ? 16 : 20} />
                  </button>
                  {selectedEnhancement && (
                    <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                      <svg
                        className="w-2 h-2"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
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
            <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white/75 backdrop-blur-sm">
              <div
                ref={modalRef}
                className="bg-surface-container-lowest rounded-2xl w-full max-w-2xl mx-4 overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-blue-600 flex items-center justify-center shrink-0">
                      <Wand2 size={17} className="text-white" />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-gray-900 leading-tight">
                        Enhance Product Image
                      </h3>
                      <p className="text-xs text-gray-500">Powered by ImageKit AI</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleCancelEnhancements}
                    className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-gray-900 hover:bg-surface-container rounded-lg transition-colors cursor-pointer"
                  >
                    <X size={17} />
                  </button>
                </div>

                {/* Body: two-column */}
                <div className="grid grid-cols-2 gap-0 px-6 pb-6">
                  {/* Left: image preview */}
                  <div className="pr-5">
                    <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2">
                      Preview
                    </p>
                    <div className="relative w-full h-56 bg-surface-container rounded-xl overflow-hidden">
                      {isModalPreviewLoading && (
                        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2">
                          <Loader2 size={24} className="animate-spin text-violet-500" />
                          <span className="text-xs text-gray-500">
                            {tempEnhancement ? 'Generating...' : 'Loading...'}
                          </span>
                        </div>
                      )}
                      <img
                        src={
                          tempEnhancement
                            ? `${safeImagePreview.split('?')[0]}?tr=e-${effectToUrlParam[tempEnhancement]}`
                            : safeImagePreview.split('?')[0]
                        }
                        alt="Preview"
                        className={`absolute inset-0 w-full h-full object-contain transition-opacity duration-300 ${isModalPreviewLoading ? 'opacity-0' : 'opacity-100'
                          }`}
                        onLoad={() => setIsModalPreviewLoading(false)}
                        onError={() => setIsModalPreviewLoading(false)}
                      />
                    </div>
                  </div>

                  {/* Right: enhancement options */}
                  <div className="pl-5 border-l border-gray-200">
                    <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2">
                      AI Enhancements
                    </p>
                    <div className="flex flex-col gap-1.5">
                      {enhancements.map((enhancement) => {
                        const isSelected = tempEnhancement === enhancement.effect;
                        const meta = ENHANCEMENT_META[enhancement.effect];
                        const Icon = meta.icon;
                        return (
                          <button
                            key={enhancement.effect}
                            type="button"
                            onClick={() => handleSelectEnhancement(enhancement.effect)}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all cursor-pointer ${isSelected
                              ? 'bg-violet-500/15 ring-1 ring-violet-500/60'
                              : 'bg-surface-container hover:bg-surface-container-low'
                              }`}
                          >
                            <div
                              className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${isSelected
                                ? 'bg-gradient-to-br from-violet-500 to-blue-600'
                                : 'bg-surface-container-highest'
                                }`}
                            >
                              <Icon
                                size={15}
                                className={isSelected ? 'text-white' : 'text-gray-500'}
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 leading-tight">
                                {enhancement.label}
                              </p>
                              <p className="text-xs text-gray-500 truncate">
                                {meta.description}
                              </p>
                            </div>
                            {isSelected && (
                              <div className="w-4 h-4 rounded-full bg-violet-500 flex items-center justify-center shrink-0">
                                <svg
                                  className="w-2.5 h-2.5 text-white"
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {/* Drop Shadow tip — shown inline below the list */}
                    {tempEnhancement === 'aiDropShadow' && (
                      <div className="mt-3 flex items-start gap-2 px-3 py-2.5 bg-yellow-500/10 rounded-lg">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="13"
                          height="13"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="text-feedback-warning mt-0.5 shrink-0"
                        >
                          <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                          <path d="M12 9v4" />
                          <path d="M12 17h.01" />
                        </svg>
                        <p className="text-xs text-gray-900 leading-relaxed">
                          Best with <span className="font-semibold">transparent PNG</span>. On opaque images the shadow wraps the entire frame.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={handleCancelEnhancements}
                    disabled={isApplyingEnhancement}
                    className="px-4 py-2 text-sm text-gray-500 hover:text-gray-900 hover:bg-surface-container rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleApplyEnhancements}
                    disabled={isApplyingEnhancement}
                    className="px-5 py-2 text-sm bg-gradient-to-r from-violet-600 to-blue-600 text-white font-medium rounded-lg hover:from-violet-700 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer"
                  >
                    {isApplyingEnhancement ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        Applying...
                      </>
                    ) : (
                      <>Apply{tempEnhancement ? ' Enhancement' : ''}</>
                    )}
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
            className={`flex flex-col items-center justify-center transition-colors ${isDragging
              ? 'text-brand-primary-600 scale-110'
              : 'text-gray-500 group-hover:text-brand-primary-600'
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
                    PNG, JPG, WebP (max 3MB)
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
