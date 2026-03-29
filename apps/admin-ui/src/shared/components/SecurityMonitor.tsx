'use client';

import { useEffect } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080/api';

/**
 * Admin-UI SecurityMonitor
 *
 * 1. Suppresses raw console output in production to prevent data leaks
 *    via accidentally shipped console.log calls.
 *    console.warn and console.error are intentionally kept so that runtime
 *    errors and React warnings remain visible in browser DevTools even in
 *    production builds (error monitoring depends on them surfacing).
 * 2. Detects open DevTools (size heuristic + debugger getter) and sends
 *    a SECURITY signal to the backend for audit logging.
 *    Only active in production — developers need DevTools.
 *    SEC-13: threshold raised to 200px; size heuristic requires 2 consecutive
 *    positive samples to avoid false positives from window snapping.
 */
export function SecurityMonitor() {
  // Step 1: DevTools detection runs FIRST (before console is suppressed).
  // The getter technique fires console.log once at mount to plant a trap;
  // the size poll catches subsequent opens.
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return;

    let reported = false;
    // SEC-13: require 2 consecutive positive size samples to avoid false positives
    let consecutiveSizeHits = 0;

    const report = (method: string) => {
      if (reported) return;
      reported = true;
      sendSignal('devtools_open', { method });
    };

    // Getter trap: when DevTools evaluates the object in the console panel,
    // the toString getter fires and we detect the open state.
    const trap = /./;
    (trap as unknown as { toString: () => string }).toString = () => {
      report('getter');
      return '';
    };
    // eslint-disable-next-line no-console
    console.log('%c', trap);

    // Size heuristic: docked DevTools increases the gap between outer and inner dimensions.
    // SEC-13: THRESHOLD raised to 200px (was 160) to reduce false positives on HiDPI displays.
    const THRESHOLD = 200;
    const sizeCheck = () => {
      const widthDiff = window.outerWidth - window.innerWidth > THRESHOLD;
      const heightDiff = window.outerHeight - window.innerHeight > THRESHOLD;
      if (widthDiff || heightDiff) {
        consecutiveSizeHits++;
        if (consecutiveSizeHits >= 2) {
          report(widthDiff ? 'size-vertical' : 'size-horizontal');
        }
      } else {
        consecutiveSizeHits = 0;
      }
    };

    const id = setInterval(sizeCheck, 1500);
    return () => clearInterval(id);
  }, []);

  // Step 2: Suppress console AFTER the getter trap is planted.
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
