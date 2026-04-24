/** @type {import('next').NextConfig} */
const nextConfig = {
  /** ESM / client-only packages: ensure Next compiles them for the browser bundle. */
  transpilePackages: ["konva", "react-konva", "react-konva-utils", "use-image"],
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
  /**
   * Konva may resolve the optional Node `canvas` package; the stage is always client-only.
   * Alising to `false` avoids server/dev bundler pulling native canvas when analyzing imports.
   */
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
