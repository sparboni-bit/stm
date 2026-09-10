import type { NextConfig } from "next"

const isMobileBuild =
  process.env.STM_BUILD_TARGET === "mobile"

const nextConfig: NextConfig = isMobileBuild
  ? {
      output: "export",
      trailingSlash: true,
      images: {
        unoptimized: true,
      },
    }
  : {}

export default nextConfig
