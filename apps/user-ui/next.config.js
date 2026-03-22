//@ts-check

const path = require('path');
const { withNx } = require('@nx/next');
const { withSentryConfig } = require('@sentry/nextjs');
const createNextIntlPlugin = require('next-intl/plugin');

const i18nRequestPath = path.relative(process.cwd(), path.join(__dirname, 'src/i18n/request.ts'));
const withNextIntl = createNextIntlPlugin(i18nRequestPath.startsWith('.') ? i18nRequestPath : `./${i18nRequestPath}`);

/**
 * @type {import('@nx/next/plugins/with-nx').WithNxOptions}
 **/
const nextConfig = {
  nx: {},
  serverExternalPackages: ['pino', 'pino-pretty', 'thread-stream'],
  experimental: {
    webpackMemoryOptimizations: true,
  },
  webpack: (config, { dev }) => {
    config.resolve.extensionAlias = { '.js': ['.ts', '.tsx', '.js'], '.jsx': ['.tsx', '.jsx'] };
    if (dev) {
      config.watchOptions = {
        ...config.watchOptions,
        ignored: /node_modules/,
      };
      // Disable source maps in dev — eliminates 30-50% of per-module compilation memory.
      // Trade-off: stack traces show compiled output instead of TypeScript source.
      config.devtool = false;
    }
    return config;
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        port: '',
        pathname: '/**',
      },
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

// Following Sentry's recommended pattern for Nx monorepos:
// https://docs.sentry.io/platforms/javascript/guides/nextjs/troubleshooting/#using-the-sentry-next-sdk-in-a-nx-monorepo-using-nxnext
module.exports = async (phase, context) => {
  // Apply next-intl plugin synchronously
  let updatedConfig = withNextIntl(nextConfig);

  // Apply withNx asynchronously (required for proper Nx + Sentry integration)
  updatedConfig = await withNx(updatedConfig)(phase, context);

  // Preserve these options after withNx may override them
  updatedConfig.images = nextConfig.images;
  updatedConfig.serverExternalPackages = ['pino', 'pino-pretty', 'thread-stream'];

  return updatedConfig;
};

// Only apply Sentry in production/CI — it loads heavy webpack plugins that consume multiple GB in dev
if (process.env.NODE_ENV !== 'development') {
  module.exports = withSentryConfig(module.exports, {
    org: 'andriel',
    project: 'tecshop-user-ui',
    silent: !process.env.CI,
    widenClientFileUpload: true,
    disableLogger: true,
    automaticVercelMonitors: true,
  });
}
