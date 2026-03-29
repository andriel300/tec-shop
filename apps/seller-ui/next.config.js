//@ts-check

const path = require('path');
const { composePlugins, withNx } = require('@nx/next');
const createNextIntlPlugin = require('next-intl/plugin');

const i18nRequestPath = path.relative(process.cwd(), path.join(__dirname, 'src/i18n/request.ts'));
const withNextIntl = createNextIntlPlugin(i18nRequestPath.startsWith('.') ? i18nRequestPath : `./${i18nRequestPath}`);

/**
 * @type {import('@nx/next/plugins/with-nx').WithNxOptions}
 **/
const nextConfig = {
  // Use this to set Nx-specific options
  // See: https://nx.dev/recipes/next/next-config-setup
  nx: {
    svgr: false,
  },
  productionBrowserSourceMaps: false,
  serverExternalPackages: ['pino', 'pino-pretty', 'thread-stream'],
  experimental: {
    webpackMemoryOptimizations: true,
  },
  webpack: (config, { dev }) => {
    config.resolve.extensionAlias = { '.js': ['.ts', '.tsx', '.js'], '.jsx': ['.tsx', '.jsx'] };
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.join(__dirname, 'src'),
    };
    if (dev) {
      config.watchOptions = {
        ...config.watchOptions,
        ignored: /node_modules/,
      };
      // Disable source maps in dev — eliminates 30-50% of per-module compilation memory.
      config.devtool = false;
    }
    return config;
  },
  // Set custom port for seller-ui
  env: {
    PORT: '3001',
    // Expose ImageKit credentials from root .env to client-side
    NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT: process.env.IMAGEKIT_URL_ENDPOINT,
    NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY: process.env.IMAGEKIT_PUBLIC_KEY,
  },
  // Configure allowed image domains for next/image
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'ik.imagekit.io',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

const plugins = [
  // Add more Next.js plugins to this list if needed.
  withNx,
];

const composedConfig = {
  ...composePlugins(...plugins)(nextConfig),
  images: nextConfig.images,
  serverExternalPackages: ['pino', 'pino-pretty', 'thread-stream'],
};

// Only apply Sentry in production/CI — requiring @sentry/nextjs unconditionally
// loads heavy webpack plugins that consume multiple GB in dev.
const baseExport = withNextIntl(composedConfig);
if (process.env.NODE_ENV !== 'development') {
  const { withSentryConfig } = require('@sentry/nextjs');
  module.exports = withSentryConfig(baseExport, {
    org: 'andriel',
    project: 'tecshop-seller-ui',
    silent: !process.env.CI,
    widenClientFileUpload: true,
    disableLogger: true,
    automaticVercelMonitors: true,
  });
} else {
  module.exports = baseExport;
}
