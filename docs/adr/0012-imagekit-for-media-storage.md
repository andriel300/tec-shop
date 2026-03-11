# ADR-0012: ImageKit for Media Storage and Transformation

## Status
Accepted

## Context
TecShop handles user-uploaded media including product images (up to 4 per product,
5 MB each), seller shop logos, and user avatars. We needed a media storage solution
that provided CDN delivery, on-the-fly image transformation (resize, crop, format
conversion), and a simple upload API without managing our own storage infrastructure.

## Decision
We adopted ImageKit as the media storage and CDN provider. The integration is
centralised in the `@tec-shop/imagekit` shared library:

- **Backend**: `ImageKitService` handles server-side uploads using the ImageKit
  private API key. Files are uploaded from the API Gateway, which receives multipart
  form data from clients.
- **Frontend**: The ImageKit public key (`IMAGEKIT_PUBLIC_KEY`) and URL endpoint
  (`IMAGEKIT_URL_ENDPOINT`) are exposed to Next.js via `next.config.js`
  environment variables for client-side URL construction.
- **URL pattern**: All media URLs use `https://ik.imagekit.io/{account-id}/...`,
  configured as a remote pattern in Next.js `Image` component settings.

Avatar uploads use server-side cropping and transformation parameters applied at
upload time.

## Alternatives Considered
- **AWS S3 + CloudFront** — industry standard, but requires managing IAM policies,
  bucket policies, and a separate CDN configuration. ImageKit provides equivalent
  functionality with a simpler API and built-in image transformation.
- **Cloudinary** — similar feature set to ImageKit. ImageKit was preferred for
  its pricing model and simpler SDK.
- **Self-hosted MinIO** — eliminates vendor dependency but requires infrastructure
  management for a non-core concern.

## Consequences
- **Positive:** On-the-fly image transformation (resize, crop, WebP conversion)
  without pre-processing; CDN edge delivery; simple upload API.
- **Negative:** Vendor dependency; costs scale with storage and bandwidth usage;
  private key must be kept secret and rotated if compromised.

## Trade-offs
Vendor dependency was accepted to avoid managing media storage infrastructure.
Image transformation at the CDN edge reduces bandwidth costs compared to serving
full-resolution originals.
