'use client';

import { useEffect, useState } from 'react';

const LOCATION_STORAGE_KEY = 'user_location';
const LOCATION_EXPIRY_DAYS = 20;

const getStoredLocation = () => {
  // Check if we're on the client side
  if (typeof window === 'undefined') {
    return null;
  }

  const storedLocation = localStorage.getItem(LOCATION_STORAGE_KEY);

  if (!storedLocation) {
    return null;
  }

  try {
    const parsedData = JSON.parse(storedLocation);
    const expiryTime = LOCATION_EXPIRY_DAYS * 24 * 60 * 60 * 1000; // 20 days in milliseconds
    const isExpired = Date.now() - parsedData.timestamp > expiryTime;

    return isExpired ? null : parsedData;
  } catch (error) {
    console.error('Error parsing stored location:', error);
    return null;
  }
};

const useLocationTracking = () => {
  const [location, setLocation] = useState<{
    country: string;
    city: string;
  } | null>(null);
  const [_isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Try to load from localStorage first
    const stored = getStoredLocation();
    if (stored) {
      setLocation(stored);
      setIsLoading(false);
      return;
    }

    // Check if we previously failed to fetch location
    const failedAttempt = localStorage.getItem('location_fetch_failed');
    if (failedAttempt) {
      const failedTimestamp = parseInt(failedAttempt, 10);
      const oneHourInMs = 60 * 60 * 1000;

      // Don't retry for 1 hour after a failed attempt
      if (Date.now() - failedTimestamp < oneHourInMs) {
        setIsLoading(false);
        return;
      }
    }

    // If no stored location, fetch from API
    fetch('https://ipapi.co/json/')
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        const newLocation = {
          country: data?.country,
          city: data?.city,
          timestamp: Date.now(),
        };

        if (typeof window !== 'undefined') {
          localStorage.setItem(
            LOCATION_STORAGE_KEY,
            JSON.stringify(newLocation)
          );
          localStorage.removeItem('location_fetch_failed');
        }
        setLocation(newLocation);
        setIsLoading(false);
      })
      .catch(() => {
        // Silently handle location fetch errors
        // Store failed attempt timestamp to prevent retry spam
        if (typeof window !== 'undefined') {
          localStorage.setItem('location_fetch_failed', Date.now().toString());
        }
        setIsLoading(false);
      });
  }, []);

  return location;
};

export default useLocationTracking;
