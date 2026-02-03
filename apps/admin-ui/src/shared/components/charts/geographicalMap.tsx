'use client';

import React, { useState, useMemo } from 'react';
import { WorldMap } from 'react-svg-worldmap';
import { AnimatePresence, motion } from 'framer-motion';

interface CountryInfo {
  country: string;
  name: string;
  users: number;
  sellers: number;
}

interface GeographicDistributionItem {
  country: string;
  users: number;
  sellers: number;
}

interface GeographicalMapProps {
  data?: GeographicDistributionItem[];
  isLoading?: boolean;
}

// Country name to ISO 2-letter code mapping
const countryNameToCode: Record<string, string> = {
  'united states': 'us',
  'united states of america': 'us',
  usa: 'us',
  'united kingdom': 'gb',
  uk: 'gb',
  germany: 'de',
  france: 'fr',
  italy: 'it',
  sweden: 'se',
  denmark: 'dk',
  norway: 'no',
  finland: 'fi',
  iceland: 'is',
  brazil: 'br',
  canada: 'ca',
  australia: 'au',
  japan: 'jp',
  china: 'cn',
  india: 'in',
  spain: 'es',
  portugal: 'pt',
  netherlands: 'nl',
  belgium: 'be',
  switzerland: 'ch',
  austria: 'at',
  poland: 'pl',
  ireland: 'ie',
  'new zealand': 'nz',
  mexico: 'mx',
  argentina: 'ar',
  chile: 'cl',
  colombia: 'co',
  peru: 'pe',
  'south korea': 'kr',
  singapore: 'sg',
  malaysia: 'my',
  thailand: 'th',
  indonesia: 'id',
  philippines: 'ph',
  vietnam: 'vn',
  'south africa': 'za',
  nigeria: 'ng',
  egypt: 'eg',
  kenya: 'ke',
  'united arab emirates': 'ae',
  uae: 'ae',
  'saudi arabia': 'sa',
  israel: 'il',
  turkey: 'tr',
  russia: 'ru',
  ukraine: 'ua',
  czech republic: 'cz',
  czechia: 'cz',
  hungary: 'hu',
  romania: 'ro',
  greece: 'gr',
};

// Country code to full name mapping
const countryCodeToName: Record<string, string> = {
  us: 'United States of America',
  gb: 'United Kingdom',
  de: 'Germany',
  fr: 'France',
  it: 'Italy',
  se: 'Sweden',
  dk: 'Denmark',
  no: 'Norway',
  fi: 'Finland',
  is: 'Iceland',
  br: 'Brazil',
  ca: 'Canada',
  au: 'Australia',
  jp: 'Japan',
  cn: 'China',
  in: 'India',
  es: 'Spain',
  pt: 'Portugal',
  nl: 'Netherlands',
  be: 'Belgium',
  ch: 'Switzerland',
  at: 'Austria',
  pl: 'Poland',
  ie: 'Ireland',
  nz: 'New Zealand',
  mx: 'Mexico',
  ar: 'Argentina',
  cl: 'Chile',
  co: 'Colombia',
  pe: 'Peru',
  kr: 'South Korea',
  sg: 'Singapore',
  my: 'Malaysia',
  th: 'Thailand',
  id: 'Indonesia',
  ph: 'Philippines',
  vn: 'Vietnam',
  za: 'South Africa',
  ng: 'Nigeria',
  eg: 'Egypt',
  ke: 'Kenya',
  ae: 'United Arab Emirates',
  sa: 'Saudi Arabia',
  il: 'Israel',
  tr: 'Turkey',
  ru: 'Russia',
  ua: 'Ukraine',
  cz: 'Czech Republic',
  hu: 'Hungary',
  ro: 'Romania',
  gr: 'Greece',
};

// Fallback data when no API data is available
const fallbackData: CountryInfo[] = [
  { country: 'us', name: 'United States of America', users: 0, sellers: 0 },
];

const GeographicalMap: React.FC<GeographicalMapProps> = ({ data, isLoading }) => {
  const [hovered, setHovered] = useState<CountryInfo | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  // Transform API data to component format
  const countryData = useMemo(() => {
    if (!data || data.length === 0) {
      return fallbackData;
    }

    return data.map((item) => {
      const countryLower = item.country.toLowerCase();
      const code = countryNameToCode[countryLower] || countryLower.slice(0, 2);
      const name = countryCodeToName[code] || item.country;

      return {
        country: code,
        name,
        users: item.users,
        sellers: item.sellers,
      };
    });
  }, [data]);

  // Convert to react-svg-worldmap data format
  const mapData = useMemo(() => {
    return countryData.map((c) => ({
      country: c.country,
      value: c.users + c.sellers, // Total activity
    }));
  }, [countryData]);

  // Calculate max value for color intensity
  const maxValue = useMemo(() => {
    return Math.max(...countryData.map((c) => c.users + c.sellers), 1);
  }, [countryData]);

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

  if (isLoading) {
    return (
      <div className="relative w-full px-0 py-5 flex items-center justify-center h-[300px]">
        <div className="text-slate-400 text-sm">Loading map data...</div>
      </div>
    );
  }

  return (
    <div
      className="relative w-full px-0 py-5 overflow-visible"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setHovered(null)}
    >
      <WorldMap
        color="#1e293b"
        valueSuffix=" activity"
        size="responsive"
        data={mapData}
        styleFunction={(countryProps) => {
          const match = countryData.find(
            (c) => c.country === countryProps.countryCode.toLowerCase()
          );

          if (match && (match.users > 0 || match.sellers > 0)) {
            const totalActivity = match.users + match.sellers;
            const intensity = Math.min(totalActivity / maxValue, 0.9);
            return {
              fill: `rgba(34, 197, 94, ${Math.max(intensity, 0.2)})`,
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
        {hovered && (hovered.users > 0 || hovered.sellers > 0) && (
          <motion.div
            key={hovered.name}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="fixed bg-gray-800 text-white text-xs p-2 rounded shadow-lg pointer-events-none z-50"
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

      {/* Legend */}
      {countryData.length > 0 && countryData[0].users + countryData[0].sellers > 0 && (
        <div className="flex items-center gap-4 mt-4 text-xs text-slate-400">
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-green-500/20 border border-green-500/50" />
            <span>Low activity</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-green-500/60 border border-green-500/70" />
            <span>Medium activity</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-green-500/90 border border-green-500" />
            <span>High activity</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default GeographicalMap;
