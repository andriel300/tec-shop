'use client';

import React, {
  useRef,
  useState,
  useCallback,
  useMemo,
  useEffect,
} from 'react';

interface SmallImageConfig {
  alt?: string;
  src: string;
  isFluidWidth?: boolean;
}

interface LargeImageConfig {
  src: string;
  width: number;
  height: number;
}

interface ContainerDimensions {
  width: string | number;
  height: string | number;
}

interface ProductMagnifierProps {
  smallImage: SmallImageConfig;
  largeImage: LargeImageConfig;
  enlargedImageContainerDimensions?: ContainerDimensions;
  enlargedImagePosition?: 'right' | 'left' | 'over' | 'top' | 'bottom';
  enlargedImageStyle?: React.CSSProperties;
  lensStyle?: React.CSSProperties;
  lensSize?: number;
  className?: string;
}

export default function ProductMagnifier({
  smallImage,
  largeImage,
  enlargedImageContainerDimensions = { width: 500, height: 500 },
  enlargedImagePosition = 'right',
  enlargedImageStyle = {},
  lensStyle = {},
  lensSize = 120,
  className = '',
}: ProductMagnifierProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isHovering, setIsHovering] = useState(false);
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
  const [containerReady, setContainerReady] = useState(false);
  const [actualImageDimensions, setActualImageDimensions] = useState({
    width: largeImage.width,
    height: largeImage.height,
  });

  // Force recalculation when container is mounted
  useEffect(() => {
    if (containerRef.current) {
      setContainerReady(true);
    }
  }, []);

  // Get actual image dimensions when loaded
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      setActualImageDimensions({
        width: img.naturalWidth,
        height: img.naturalHeight,
      });
    };
    img.src = largeImage.src;
  }, [largeImage.src]);

  /**
   * Parse dimension value (handles both numbers and percentage strings)
   */
  const parseDimension = useCallback(
    (value: string | number, isWidth: boolean): number => {
      if (typeof value === 'number') return value;

      // Handle percentage strings by using the small image dimensions as reference
      if (typeof value === 'string' && value.includes('%')) {
        const percentage = parseInt(value) / 100;
        const refSize = isWidth
          ? containerRef.current?.offsetWidth || 0
          : containerRef.current?.offsetHeight || 0;

        if (refSize === 0) return 500; // Fallback if ref not ready
        return refSize * percentage;
      }

      return parseInt(String(value)) || 500;
    },
    []
  );

  /**
   * Get parsed container dimensions
   */
  const containerDimensions = useMemo(
    () => ({
      width: parseDimension(enlargedImageContainerDimensions.width, true),
      height: parseDimension(enlargedImageContainerDimensions.height, false),
    }),
    [
      enlargedImageContainerDimensions.width,
      enlargedImageContainerDimensions.height,
      parseDimension,
      containerReady,
    ]
  );

  /**
   * Handle mouse movement with bounds checking
   */
  const onMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const bounds = containerRef.current?.getBoundingClientRect();
    if (!bounds) return;

    const x = e.clientX - bounds.left;
    const y = e.clientY - bounds.top;

    setCursorPos({
      x: Math.max(0, Math.min(x, bounds.width)),
      y: Math.max(0, Math.min(y, bounds.height)),
    });
  }, []);

  /**
   * Calculate lens position (centered on cursor)
   */
  const lensPosition = useMemo(
    () => ({
      left: cursorPos.x - lensSize / 2,
      top: cursorPos.y - lensSize / 2,
      width: lensSize,
      height: lensSize,
    }),
    [cursorPos.x, cursorPos.y, lensSize]
  );

  /**
   * Calculate zoomed image styles with proper centering
   */
  const zoomedStyles = useMemo(() => {
    const smallImageWidth = containerRef.current?.offsetWidth || 1;
    const smallImageHeight = containerRef.current?.offsetHeight || 1;

    // Use actual image dimensions for proper aspect ratio
    const imageWidth = actualImageDimensions.width;
    const imageHeight = actualImageDimensions.height;

    // Calculate the cursor position ratio (0 to 1)
    const cursorRatioX = cursorPos.x / smallImageWidth;
    const cursorRatioY = cursorPos.y / smallImageHeight;

    // Calculate where that point is on the large image (in pixels)
    const pointOnLargeImageX = cursorRatioX * imageWidth;
    const pointOnLargeImageY = cursorRatioY * imageHeight;

    // Center that point in the enlarged container
    const translateX = containerDimensions.width / 2 - pointOnLargeImageX;
    const translateY = containerDimensions.height / 2 - pointOnLargeImageY;

    return {
      transform: `translate(${translateX}px, ${translateY}px)`,
      width: `${imageWidth}px`,
      height: `${imageHeight}px`,
      maxWidth: 'none',
      objectFit: 'contain' as const,
    };
  }, [
    cursorPos.x,
    cursorPos.y,
    actualImageDimensions.width,
    actualImageDimensions.height,
    containerDimensions.width,
    containerDimensions.height,
  ]);

  /**
   * Calculate enlarged container position based on position prop
   */
  const enlargedContainerStyle = useMemo((): React.CSSProperties => {
    const baseStyle: React.CSSProperties = {
      position: 'absolute',
      width: enlargedImageContainerDimensions.width,
      height: enlargedImageContainerDimensions.height,
      overflow: 'hidden',
      borderRadius: '8px',
      background: '#fff',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      zIndex: 30,
      pointerEvents: 'none',
      opacity: isHovering ? 1 : 0,
      transition: 'opacity 0.2s ease',
    };

    // Position the enlarged container based on the position prop
    switch (enlargedImagePosition) {
      case 'top':
        return {
          ...baseStyle,
          bottom: '100%',
          left: '0',
          marginBottom: '10px',
        };
      case 'bottom':
        return {
          ...baseStyle,
          top: '100%',
          left: '0',
          marginTop: '10px',
        };
      case 'left':
        return {
          ...baseStyle,
          right: '100%',
          top: '0',
          marginRight: '10px',
        };
      case 'right':
        return {
          ...baseStyle,
          left: '100%',
          top: '0',
          marginLeft: '10px',
        };
      case 'over':
        return {
          ...baseStyle,
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
        };
      default:
        return baseStyle;
    }
  }, [enlargedImageContainerDimensions, enlargedImagePosition, isHovering]);

  /**
   * Lens overlay style
   */
  const lensStyleMerged: React.CSSProperties = useMemo(
    () => ({
      position: 'absolute',
      borderRadius: '50%',
      background: 'rgba(255, 255, 255, 0.3)',
      border: '2px solid rgba(0, 0, 0, 0.2)',
      pointerEvents: 'none',
      ...lensPosition,
      ...lensStyle,
    }),
    [lensPosition, lensStyle]
  );

  return (
    <div
      className={`relative inline-block ${className}`}
      onMouseMove={onMouseMove}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      ref={containerRef}
    >
      {/* Small Image */}
      <img
        src={smallImage.src}
        alt={smallImage.alt || 'Product image'}
        style={{
          width: smallImage.isFluidWidth ? '100%' : 'auto',
          display: 'block',
          cursor: 'crosshair',
        }}
      />

      {/* Lens Overlay */}
      {isHovering && <div style={lensStyleMerged} aria-hidden="true" />}

      {/* Enlarged Image Container */}
      <div style={enlargedContainerStyle} aria-hidden="true">
        <img
          src={largeImage.src}
          alt={smallImage.alt || 'Product image (zoomed)'}
          style={{
            position: 'absolute',
            pointerEvents: 'none',
            display: 'block',
            ...zoomedStyles,
            ...enlargedImageStyle,
          }}
          draggable={false}
        />
      </div>
    </div>
  );
}
