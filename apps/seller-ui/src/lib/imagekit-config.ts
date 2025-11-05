// ImageKit configuration for Next.js client-side
export const imagekitConfig = {
  urlEndpoint: process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT || '',
  publicKey: process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY || '',
};

/**
 * Extract ImageKit path from full URL
 * Converts: https://ik.imagekit.io/andrieltecshop/products/image.png
 * To: products/image.png
 */
export const getImageKitPath = (urlOrPath: string): string => {
  if (!urlOrPath) return '';

  // If it's already a path (no http/https), return as-is
  if (!urlOrPath.startsWith('http://') && !urlOrPath.startsWith('https://')) {
    return urlOrPath;
  }

  // Extract path from full URL
  try {
    const url = new URL(urlOrPath);
    // Remove leading slash from pathname
    let path = url.pathname.substring(1);

    // Remove the ImageKit account ID prefix (e.g., "andrieltecshop/")
    // The urlEndpoint already contains this, so we need to strip it from the path
    const urlEndpoint = imagekitConfig.urlEndpoint;
    if (urlEndpoint) {
      const accountIdMatch = urlEndpoint.match(/\/([^/]+)\/?$/);
      if (accountIdMatch) {
        const accountId = accountIdMatch[1];
        // Remove accountId prefix if present
        if (path.startsWith(accountId + '/')) {
          path = path.substring(accountId.length + 1);
        }
      }
    }

    return path;
  } catch {
    // If URL parsing fails, return original
    return urlOrPath;
  }
};
