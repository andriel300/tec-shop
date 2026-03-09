//@ts-check

// eslint-disable-next-line @typescript-eslint/no-var-requires
const path = require('path');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { composePlugins, withNx } = require('@nx/next');
const createNextIntlPlugin = require('next-intl/plugin');

// When Nx processes this file from the workspace root (project graph, migrations),
// relative paths resolve against the wrong CWD. Temporarily chdir to __dirname so
// next-intl's existence check passes, then restore CWD before this module returns.
const _savedCwd = process.cwd();
process.chdir(__dirname);

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

/**
 * @type {import('@nx/next/plugins/with-nx').WithNxOptions}
 **/
const nextConfig = {
  // Use this to set Nx-specific options
  // See: https://nx.dev/recipes/next/next-config-setup
  nx: {},
  webpack: (config) => {
    config.resolve.extensionAlias = { '.js': ['.ts', '.tsx', '.js'], '.jsx': ['.tsx', '.jsx'] };
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.join(__dirname, 'src'),
    };
    return config;
  },
};

const plugins = [
  // Add more Next.js plugins to this list if needed.
  withNx,
];

module.exports = withNextIntl(composePlugins(...plugins)(nextConfig));

process.chdir(_savedCwd);
