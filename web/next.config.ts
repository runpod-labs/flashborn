import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@flashborn/shared"],
  /* config options here */
  reactCompiler: true,
};

export default nextConfig;
