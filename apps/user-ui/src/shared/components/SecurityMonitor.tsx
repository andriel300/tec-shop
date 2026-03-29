'use client';

import { useEffect } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080/api';

/**
 * User-UI SecurityMonitor
 *
 * 1. Suppresses raw console output in production to prevent data leaks.
 *    console.warn and console.error are intentionally kept so that runtime
 *    errors and React warnings remain visible in browser DevTools even in
 *    production builds (error monitoring depends on them surfacing).
 * 2. Detects automated/bot behavior via browser automation signals and
 *    sends a SECURITY signal to the backend for audit logging.
 *    SEC-17: only active in production — avoids false positives in dev/test
 *    environments (e.g. Playwright E2E tests set navigator.webdriver).
 */
export function SecurityMonitor() {
  // Bot / automation detection — SEC-17: production only
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return;

    const signals: string[] = [];

    // WebDriver flag set by Selenium, Puppeteer (without stealth), Playwright default
    if (navigator.webdriver) signals.push('webdriver');

    // Missing language list is a common headless browser tell
    if (!navigator.languages || navigator.languages.length === 0) {
      signals.push('no-languages');
    }

    // PhantomJS / SlimerJS legacy signals
    if ('phantom' in window) signals.push('phantom');
    if ('callPhantom' in window) signals.push('call-phantom');

    // Absence of plugins is common in headless environments
    // (not reliable alone, but useful as one signal among many)
    if (navigator.plugins.length === 0) signals.push('no-plugins');

    if (signals.length >= 2) {
      // Require at least 2 signals to avoid false positives on privacy browsers
      sendSignal('bot_detected', { signals });
    }
  }, []);

  // Console suppression
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return;

    const noop = () => undefined;
    console.log = noop;
    console.debug = noop;
    console.info = noop;
    console.dir = noop;
    console.table = noop;
    console.group = noop;
    console.groupEnd = noop;
    console.groupCollapsed = noop;
    // console.warn and console.error are intentionally kept intact so that
    // runtime errors and React warnings remain visible for error monitoring.
  }, []);

  return null;
}

function sendSignal(type: string, metadata?: Record<string, unknown>): void {
  try {
    navigator.sendBeacon(
      `${API_URL}/security/signal`,
      new Blob([JSON.stringify({ type, metadata })], { type: 'application/json' }),
    );
  } catch {
    // Silently ignore — never break the app over a security beacon
  }
}
