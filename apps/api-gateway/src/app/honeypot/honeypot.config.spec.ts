import { normalizePath, HONEYPOT_LURE_PREFIXES } from './honeypot.config';

describe('normalizePath', () => {
  it.each([
    ['/WP-ADMIN', '/wp-admin'],
    ['/phpmyadmin/', '/phpmyadmin'],
    ['/PHPmyAdmin/', '/phpmyadmin'],
    ['/', '/'],
    ['/.git/config', '/.git/config'],
    ['/ACTUATOR/ENV', '/actuator/env'],
  ])('normalizes %s → %s', (input, expected) => {
    expect(normalizePath(input)).toBe(expected);
  });
});

describe('HONEYPOT_LURE_PREFIXES', () => {
  it('all prefixes end with "/" so /.git/ does not match /.gitignore', () => {
    for (const prefix of HONEYPOT_LURE_PREFIXES) {
      expect(prefix.endsWith('/')).toBe(true);
    }
  });

  it('/.git/ prefix matches subtree paths but not /.gitignore', () => {
    const prefixes = HONEYPOT_LURE_PREFIXES;
    expect(prefixes.some((p) => '/.git/HEAD'.startsWith(p))).toBe(true);
    expect(prefixes.some((p) => '/.gitignore'.startsWith(p))).toBe(false);
  });
});
