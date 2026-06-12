'use client';

import DOMPurify from 'isomorphic-dompurify';

export default function ProductDescription({ html }: { html: string }) {
  return (
    <div
      className="prose prose-sm text-gray-500 max-w-none"
      dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(html) }}
    />
  );
}
