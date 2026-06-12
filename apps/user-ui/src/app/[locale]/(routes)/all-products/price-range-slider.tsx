'use client';

import { Range } from 'react-range';

const MIN = 0;
const MAX = 1199;

interface PriceRangeSliderProps {
  values: number[];
  onChange: (values: number[]) => void;
}

export default function PriceRangeSlider({ values, onChange }: PriceRangeSliderProps) {
  return (
    <Range
      step={1}
      min={MIN}
      max={MAX}
      values={values}
      onChange={onChange}
      renderTrack={({ props, children }) => {
        const [min, max] = values;
        const percentageLeft = ((min - MIN) / (MAX - MIN)) * 100;
        const percentageRight = ((max - MIN) / (MAX - MIN)) * 100;
        return (
          <div
            {...props}
            className="h-[6px] bg-blue-200 rounded relative"
            style={{ ...props.style }}
          >
            <div
              className="absolute h-full bg-blue-600 rounded"
              style={{
                left: `${percentageLeft}%`,
                width: `${percentageRight - percentageLeft}%`,
              }}
            />
            {children}
          </div>
        );
      }}
      renderThumb={({ props }) => {
        const { key, ...rest } = props;
        return (
          <div
            key={key}
            {...rest}
            className="w-[16px] h-[16px] bg-blue-600 rounded-full shadow"
          />
        );
      }}
    />
  );
}
