import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

function buildSupabaseStorageRemotePatterns() {
  const patterns: NonNullable<NextConfig["images"]>["remotePatterns"] = [];

  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL ?? "";

  if (supabaseUrl) {
    try {
      const parsed = new URL(supabaseUrl);
      patterns.push({
        protocol: parsed.protocol.replace(":", "") as "http" | "https",
        hostname: parsed.hostname,
        pathname: "/storage/v1/object/public/**",
      });
    } catch {
      // Ignore invalid env var.
    }
  }

  // Fallback for hosted Supabase projects.
  patterns.push({
    protocol: "https",
    hostname: "**.supabase.co",
    pathname: "/storage/v1/object/public/**",
  });

  return patterns;
}

const nextConfig: NextConfig = {
  images: {
    remotePatterns: buildSupabaseStorageRemotePatterns(),
  },
};

export default withNextIntl(nextConfig);

