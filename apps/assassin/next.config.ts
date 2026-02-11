import type { NextConfig } from "next";
import withPWA from "@ducanh2912/next-pwa";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  turbopack: {},
  output: "standalone",
};

export default withPWA({
  dest: "public",
  register: true,
  disable: false,
})(nextConfig);
