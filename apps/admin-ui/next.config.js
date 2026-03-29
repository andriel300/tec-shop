//@ts-check

const path = require('path');
const { composePlugins, withNx } = require('@nx/next');
const createNextIntlPlugin = require('next-intl/plugin');

const i18nRequestPath = path.relative(process.cwd(), path.join(__dirname, 'src/i18n/request.ts'));
const withNextIntl = createNextIntlPlugin(i18nRequestPath.startsWith('.') ? i18nRequestPath : `./${i18nRequestPath}`);

/**
 * @type {import('@nx/next/plugins/with-nx').WithNxOptions}
 **/
const browserLoggerPath = path.resolve(__dirname, '../../libs/shared/next-logger/src/browser.ts');

const nextConfig = {
  // Use this to set Nx-specific options
  // See: https://nx.dev/recipes/next/next-config-setup
  nx: {},
  productionBrowserSourceMaps: false,
  serverExternalPackages: ['pino', 'pino-pretty', 'thread-stream'],
  experimental: {
    turbopack: {
      resolveAlias: {
        '@tec-shop/next-logger': browserLoggerPath,
      },
    },
  },
  webpack: (config, { isServer }) => {
    config.resolve.extensionAlias = { '.js': ['.ts', '.tsx', '.js'], '.jsx': ['.tsx', '.jsx'] };
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.join(__dirname, 'src'),
    };
    if (!isServer) {
      config.resolve.alias['@tec-shop/next-logger'] = browserLoggerPath;
    }
    return config;
  },
};

const plugins = [
  // Add more Next.js plugins to this list if needed.
  withNx,
];

module.exports = withNextIntl(composePlugins(...plugins)(nextConfig));
