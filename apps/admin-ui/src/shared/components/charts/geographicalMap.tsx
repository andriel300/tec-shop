'use client';

import React, { useState } from 'react';
import { WorldMap } from 'react-svg-worldmap';
import { AnimatePresence, motion } from 'framer-motion';

interface CountryInfo {
  country: string;
  name: string;
  users: number;
  sellers: number;
}

const countryData: CountryInfo[] = [
  { country: 'us', name: 'United States of America', users: 160, sellers: 38 },
  { country: 'gb', name: 'United Kingdom', users: 100, sellers: 20 },
  { country: 'de', name: 'Germany', users: 30, sellers: 10 },
  { country: 'fr', name: 'France', users: 20, sellers: 5 },
  { country: 'it', name: 'Italy', users: 10, sellers: 2 },
  { country: 'se', name: 'Sweden', users: 5, sellers: 1 },
  { country: 'dk', name: 'Denmark', users: 3, sellers: 1 },
  { country: 'no', name: 'Norway', users: 1, sellers: 0 },
  { country: 'fi', name: 'Finland', users: 1, sellers: 0 },
  { country: 'is', name: 'Iceland', users: 1, sellers: 0 },
  { country: 'br', name: 'Brazil', users: 80, sellers: 16 },
];

// Convert to react-svg-worldmap data format
const mapData = countryData.map((c) => ({
  country: c.country,
  value: c.users,
}));

const GeographicalMap = () => {
  const [hovered, setHovered] = useState<CountryInfo | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  const handleMouseMove = (evt: React.MouseEvent<HTMLDivElement>) => {
    const target = evt.target as SVGElement;
    const countryCode = target.getAttribute('data-country');

    if (!countryCode) {
      setHovered(null);
      return;
    }

    const match = countryData.find(
      (c) => c.country === countryCode.toLowerCase()
    );

    if (!match) {
      setHovered(null);
      return;
    }

    setTooltipPos({ x: evt.pageX, y: evt.pageY });
    setHovered(match);
  };

  return (
    <div
      className="relative w-full px-0 py-5 overflow-visible"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setHovered(null)}
    >
      <WorldMap
        color="#1e293b"
        valueSuffix=" users"
        size="responsive"
        data={mapData}
        styleFunction={(countryProps) => {
          const match = countryData.find(
            (c) => c.country === countryProps.countryCode.toLowerCase()
          );

          if (match) {
            return {
              fill: `rgba(34, 197, 94, ${Math.min(match.users / 200, 0.9)})`,
              stroke: '#334155',
              strokeWidth: 1,
            };
          }

          return {
            fill: '#1e293b',
            stroke: '#334155',
            strokeWidth: 1,
          };
        }}
      />

      {/* Tooltip */}
      <AnimatePresence>
        {hovered && (
          <motion.div
            key={hovered.name}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="fixed bg-gray-800 text-white text-xs p-2 rounded shadow-lg pointer-events-none"
            style={{
              top: tooltipPos.y + 10,
              left: tooltipPos.x + 10,
            }}
          >
            <strong>{hovered.name}</strong>
            <br />
            Users: <span className="text-green-400">{hovered.users}</span>
            <br />
            Sellers: <span className="text-yellow-400">{hovered.sellers}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GeographicalMap;
