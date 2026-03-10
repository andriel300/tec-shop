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
  webpack: (config) => {
    config.resolve.extensionAlias = { '.js': ['.ts', '.tsx', '.js'], '.jsx': ['.tsx', '.jsx'] };
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

// withSentryConfig must be applied last, wrapping the async function
module.exports = withSentryConfig(module.exports, {
  org: 'andriel',
  project: 'tecshop-user-ui',

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,

  // Upload a larger set of source maps for prettier stack traces
  widenClientFileUpload: true,

  // Automatically tree-shake Sentry logger statements to reduce bundle size
  disableLogger: true,

  // Enables automatic instrumentation of Vercel Cron Monitors.
  automaticVercelMonitors: true,
});
