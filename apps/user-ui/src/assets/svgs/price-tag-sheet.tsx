import * as React from 'react';

// CSS clip-path arrow shapes — scales correctly with text, no SVG distortion.
// "right": tip points right → use on left side of image (badge "stabs in" from the left)
// "left":  tip points left  → use on right side of image (badge "stabs in" from the right)
const CLIP_RIGHT = 'polygon(0 0, calc(100% - 8px) 0, 100% 50%, calc(100% - 8px) 100%, 0 100%)';
const CLIP_LEFT  = 'polygon(8px 0, 100% 0, 100% 100%, 8px 100%, 0 50%)';

interface SaleTagProps {
  children?: React.ReactNode;
  className?: string;
  /** Discount percentage, e.g. 23 renders "-23% OFF" */
  discount?: number;
  /** 'right' (default) — tip points right, for left-side placement.
   *  'left' — tip points left, for right-side placement. */
  direction?: 'right' | 'left';
}

export const SaleTag: React.FC<SaleTagProps> = ({
  children,
  className = '',
  discount,
  direction = 'right',
}) => {
  const isLeft = direction === 'left';
  const clip    = isLeft ? CLIP_LEFT  : CLIP_RIGHT;
  const padding = isLeft ? 'pl-4 pr-2' : 'pl-2 pr-4';

  return (
    <span className={`relative inline-flex ${className}`}>
      {/* Sonar ring — rounded halo that pulses outward behind the arrow badge */}
      <span
        className="animate-ping absolute -inset-0.5 rounded bg-red-400 opacity-40"
        style={{ animationDuration: '2s' }}
        aria-hidden="true"
      />
      <span
        className={`relative inline-flex items-center bg-red-500 text-white text-xs font-bold ${padding} py-0.5 shadow-sm tracking-wide whitespace-nowrap`}
        style={{ clipPath: clip }}
      >
        {discount !== undefined ? `-${discount}% OFF` : children}
      </span>
    </span>
  );
};

interface FeaturedTagProps {
  children?: React.ReactNode;
  className?: string;
  direction?: 'right' | 'left';
}

export const FeaturedTag: React.FC<FeaturedTagProps> = ({
  children,
  className = '',
  direction = 'right',
}) => {
  const isLeft = direction === 'left';
  const clip    = isLeft ? CLIP_LEFT  : CLIP_RIGHT;
  const padding = isLeft ? 'pl-4 pr-2' : 'pl-2 pr-4';

  return (
    <span className={`relative inline-flex ${className}`}>
      {/* Sonar ring — green, 3s (slower than Sale's 2s so they're visually distinct) */}
      <span
        className="animate-ping absolute -inset-0.5 rounded bg-emerald-400 opacity-40"
        style={{ animationDuration: '3s' }}
        aria-hidden="true"
      />
      <span
        className={`relative inline-flex items-center bg-emerald-500 text-white text-xs font-bold ${padding} py-0.5 shadow-sm tracking-wide whitespace-nowrap`}
        style={{ clipPath: clip }}
      >
        {children}
      </span>
    </span>
  );
};
