import createNextIntlPlugin from 'next-intl/plugin';
import type { NextConfig } from "next";

const withNextIntl = createNextIntlPlugin(
  './src/i18n/request.ts'
);

const nextConfig: NextConfig = {
  transpilePackages: ["@course-platform/api", "@course-platform/db"],
  serverExternalPackages: ["@libsql/client", "drizzle-orm"],
};

export default withNextIntl(nextConfig);
