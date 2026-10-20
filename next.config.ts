import type { NextConfig } from "next";

const isDevelopment = process.env.NODE_ENV === "development";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  pageExtensions: isDevelopment ? ["dev.tsx", "tsx", "ts"] : ["tsx", "ts"],
};

export default nextConfig;
