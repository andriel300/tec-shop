import * as React from 'react';

const TitleBorder = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    width={180}
    height={28}
    viewBox="0 0 180 28"
    fill="none"
    preserveAspectRatio="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    {/* Main flowing wave */}
    <path
      d="M3 18 C28 6 54 28 80 16 C106 4 132 26 160 14 C166 12 172 11 177 12"
      stroke="#FE296A"
      strokeWidth={3.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      vectorEffect="non-scaling-stroke"
    />
    {/* Echo wave */}
    <path
      d="M3 22 C28 12 54 30 80 20 C106 10 132 28 160 18 C166 16 172 15 177 16"
      stroke="#FE296A"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      opacity={0.35}
      vectorEffect="non-scaling-stroke"
    />
    {/* Accent dot */}
    <circle cx="177" cy="12" r="3" fill="#FE296A" />
  </svg>
);

export default TitleBorder;
