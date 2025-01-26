// next.config.js
import nextra from "nextra";
import path from "path";
import { fileURLToPath } from "url";

// Helper to get __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Dynamically import configurations
const themeConfig = await import("./theme.config.js");
const nextraConfig = await import("./nextra.config.js");

/** @type {import('next').NextConfig} */
const nextConfig = () => {
  const withNextra = nextra({
    theme: "nextra-theme-docs",
    themeConfig: themeConfig.default,
    defaultShowCopyCode: true,
    ...nextraConfig.default,

    // Customizing documentation routes
    documentationOptions: {
      routes: {
        mongodb: "MongoDB Integration",
        auth0: "Authentication",
      },
    },
  });

  return withNextra({
    reactStrictMode: true,
    pageExtensions: ["ts", "tsx", "js", "jsx", "md", "mdx"],
    images: {
      remotePatterns: [
        {
          protocol: "https",
          hostname: "lh3.googleusercontent.com",
        },
        {
          protocol: "https",
          hostname: "avatars.githubusercontent.com",
        },
      ],
    },
    webpack: (config, { isServer }) => {
      config.resolve.extensionAlias = {
        ".js": [".ts", ".tsx", ".js", ".jsx"],
      };

      config.resolve.fallback = {
        fs: false,
        net: false,
        tls: false,
      };

      // if (!isServer) {
      //   config.resolve.fallback = {
      //     ...config.resolve.fallback,
      //     path: path.resolve(__dirname, "node_modules/path-browserify"),
      //   };
      // }

      if (!isServer) {
        config.resolve.fallback = { fs: false };
      }
      return config;
    },
  });
};

export default nextConfig;
