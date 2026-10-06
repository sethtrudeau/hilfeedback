import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["better-sqlite3", "unpdf", "mammoth", "exceljs", "jszip"],
  experimental: {
    serverActions: {
      // Artifacts (audio, video, PDFs) are uploaded through Server Actions.
      bodySizeLimit: "100mb",
    },
  },
};

export default nextConfig;
