/** @type {import('next').NextConfig} */
const nextConfig = {
  /**
   * The app is a single page at `/`. If you open e.g. `/editor` you would otherwise get 404.
   */
  async redirects() {
    return [
      { source: "/editor", destination: "/", permanent: false },
      { source: "/scrapbook", destination: "/", permanent: false },
      { source: "/app", destination: "/", permanent: false },
    ];
  },
  /** Konva can resolve the Node `canvas` package; the stage is always client-only. */
  webpack: (config) => {
    config.resolve = config.resolve ?? {};
    config.resolve.alias = {
      ...config.resolve.alias,
      canvas: false,
    };
    return config;
  },
};

export default nextConfig;
