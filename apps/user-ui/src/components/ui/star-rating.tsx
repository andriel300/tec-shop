'use client';

import React, { useState } from 'react';

interface StarRatingProps {
  value: number;
  onChange?: (rating: number) => void;
  readonly?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showCount?: boolean;
  count?: number;
}

const StarRating: React.FC<StarRatingProps> = ({
  value,
  onChange,
  readonly = false,
  size = 'md',
  showCount = false,
  count,
}) => {
  const [hoverValue, setHoverValue] = useState<number | null>(null);
  const [activeValue, setActiveValue] = useState<number | null>(null);

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  const starSize = sizeClasses[size];

  const handleClick = (rating: number) => {
    if (!readonly && onChange) {
      setActiveValue(rating);
      setTimeout(() => setActiveValue(null), 200);
      onChange(rating);
    }
  };

  const handleMouseEnter = (rating: number) => {
    if (!readonly) {
      setHoverValue(rating);
    }
  };

  const handleMouseLeave = () => {
    if (!readonly) {
      setHoverValue(null);
    }
  };

  const displayValue = hoverValue ?? value;

  return (
    <div className="flex items-center gap-1">
      <div
        className="flex items-center gap-0.5"
        onMouseLeave={handleMouseLeave}
        role={readonly ? undefined : "radiogroup"}
      >
        {[1, 2, 3, 4, 5].map((star) => {
          const isFilled = star <= displayValue;
          const isPartial = readonly && star - 1 < displayValue && displayValue < star;
          const isActive = star === activeValue;

          // Calculate fill percentage for partial stars (only in readonly mode)
          const fillPercentage = isPartial
            ? Math.round((displayValue - (star - 1)) * 100)
            : 0;

          return (
            <button
              key={star}
              type="button"
              onClick={() => handleClick(star)}
              onMouseEnter={() => handleMouseEnter(star)}
              disabled={readonly}
              className={`
                relative
                ${readonly ? 'cursor-default' : 'cursor-pointer'}
                transition-transform duration-200 ease-out
                ${!readonly && 'hover:scale-110'}
                ${isActive ? 'scale-[0.8]' : ''}
                disabled:cursor-default
                focus:outline-none
                focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2
                rounded-full
              `}
              aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
              aria-checked={readonly ? undefined : star <= value}
              role={readonly ? undefined : "radio"}
              tabIndex={readonly ? -1 : (star === Math.ceil(value) ? 0 : -1)}
            >
              {/* Background (unfilled) star */}
              <svg
                className={`${starSize} transition-colors duration-200`}
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
                  fill={isFilled ? '#1D4ED8' : '#D1D5DB'}
                  className="transition-colors duration-200"
                />
              </svg>

              {/* Partial fill overlay (for half stars in readonly mode) */}
              {isPartial && readonly && (
                <svg
                  className={`${starSize} absolute top-0 left-0 overflow-hidden transition-colors duration-200`}
                  style={{ width: `${fillPercentage}%` }}
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                  preserveAspectRatio="xMinYMin slice"
                >
                  <path
                    d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
                    fill="#1D4ED8"
                  />
                </svg>
              )}
            </button>
          );
        })}
      </div>
      {showCount && count !== undefined && (
        <span className="text-sm text-gray-600 ml-1">({count})</span>
      )}
    </div>
  );
};

export default StarRating;
