'use client';

import React, { useState, useMemo } from 'react';
import { WorldMap } from 'react-svg-worldmap';
import { AnimatePresence, motion } from 'framer-motion';
import { Users, Store, Globe } from 'lucide-react';

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
  'czech republic': 'cz',
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

  // Calculate totals for summary
  const totals = useMemo(() => {
    return countryData.reduce(
      (acc, c) => ({
        users: acc.users + c.users,
        sellers: acc.sellers + c.sellers,
        countries: acc.countries + (c.users > 0 || c.sellers > 0 ? 1 : 0),
      }),
      { users: 0, sellers: 0, countries: 0 }
    );
  }, [countryData]);

  if (isLoading) {
    return (
      <div className="relative w-full rounded-xl bg-gray-900/50 border border-gray-800 p-6">
        <div className="flex items-center justify-center h-[350px]">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
            <span className="text-slate-400 text-sm">Loading map data...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full rounded-xl bg-gray-900/50 border border-gray-800 overflow-hidden">
      {/* Summary Stats Bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800 bg-gray-900/80">
        <h3 className="text-white font-semibold flex items-center gap-2">
          <Globe size={18} className="text-emerald-500" />
          Geographic Distribution
        </h3>
        <div className="flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-500/10">
              <Users size={14} className="text-emerald-400" />
            </div>
            <span className="text-slate-400">Users:</span>
            <span className="text-white font-medium">{totals.users.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-amber-500/10">
              <Store size={14} className="text-amber-400" />
            </div>
            <span className="text-slate-400">Sellers:</span>
            <span className="text-white font-medium">{totals.sellers.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-blue-500/10">
              <Globe size={14} className="text-blue-400" />
            </div>
            <span className="text-slate-400">Countries:</span>
            <span className="text-white font-medium">{totals.countries}</span>
          </div>
        </div>
      </div>

      {/* Map Container with Dark Background */}
      <div
        className="relative px-6 py-8 bg-[#0a0a0f]"
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHovered(null)}
        style={{ minHeight: '350px' }}
      >
        <WorldMap
          backgroundColor="#0a0a0f"
          color="#1a1a2e"
          valueSuffix=" activity"
          size="responsive"
          data={mapData}
          styleFunction={(countryProps) => {
            const match = countryData.find(
              (c) => c.country === countryProps.countryCode.toLowerCase()
            );

            if (match && (match.users > 0 || match.sellers > 0)) {
              const totalActivity = match.users + match.sellers;
              const intensity = Math.min(totalActivity / maxValue, 1);
              // Gradient from dark cyan to bright emerald based on activity
              const baseColor = intensity > 0.5 ? '16, 185, 129' : '6, 182, 212';
              return {
                fill: `rgba(${baseColor}, ${Math.max(intensity * 0.85, 0.25)})`,
                stroke: '#1e293b',
                strokeWidth: 0.5,
                cursor: 'pointer',
              };
            }

            return {
              fill: '#1a1a2e',
              stroke: '#1e293b',
              strokeWidth: 0.5,
            };
          }}
        />

        {/* Tooltip */}
        <AnimatePresence>
          {hovered && (hovered.users > 0 || hovered.sellers > 0) && (
            <motion.div
              key={hovered.name}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 5 }}
              transition={{ duration: 0.15 }}
              className="fixed z-50 pointer-events-none"
              style={{
                top: tooltipPos.y + 12,
                left: tooltipPos.x + 12,
              }}
            >
              <div className="bg-gray-900/95 backdrop-blur-sm border border-gray-700 rounded-lg shadow-xl p-3 min-w-[160px]">
                <div className="flex items-center gap-2 mb-2 pb-2 border-b border-gray-700">
                  <Globe size={14} className="text-emerald-400" />
                  <span className="text-white font-semibold text-sm">{hovered.name}</span>
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5 text-slate-400">
                      <Users size={12} className="text-emerald-400" />
                      Users
                    </span>
                    <span className="text-emerald-400 font-medium">{hovered.users.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5 text-slate-400">
                      <Store size={12} className="text-amber-400" />
                      Sellers
                    </span>
                    <span className="text-amber-400 font-medium">{hovered.sellers.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 px-6 py-3 border-t border-gray-800 bg-gray-900/60">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span className="w-3 h-3 rounded-sm bg-cyan-500/25 border border-cyan-500/40" />
          <span>Low activity</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span className="w-3 h-3 rounded-sm bg-emerald-500/50 border border-emerald-500/60" />
          <span>Medium activity</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span className="w-3 h-3 rounded-sm bg-emerald-500/85 border border-emerald-500" />
          <span>High activity</span>
        </div>
      </div>
    </div>
  );
};

export default GeographicalMap;
