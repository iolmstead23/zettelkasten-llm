import metaLoader from "./scripts/metaLoader.js";

const modules = {
  theme: "nextra-theme-docs",
  themeConfig: "theme.config.js",
  defaultShowCopyCode: true,
  mdxOptions: {
    remarkPlugins: [],
    rehypePlugins: [],
  },
  staticImage: true,
  generateDocumentationJson: true,
  documentationOptions: {
    excludeRootPage: true,
    componentJsonPath: "docs/components.json",
    routes: {
      mongodb: "MongoDB Integration",
      auth0: "Authentication",
    },
  },
  loader: {
    ".js": metaLoader,
  },
  webpack: (config) => {
    config.resolve.fallback = { fs: false };
    return config;
  },
};

export default modules;
