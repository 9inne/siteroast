/** @type {import('next').NextConfig} */
const nextConfig = {
  // The share-image route reads its fonts from /assets at runtime,
  // so make sure those files are bundled with that route on the server.
  outputFileTracingIncludes: {
    '/r/[id]/card': ['./assets/**/*'],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Frame-Options', value: 'DENY' },
        ],
      },
    ];
  },
};

export default nextConfig;
