// scripts/metaLoader.js
import { fileURLToPath } from "node:url";
import { dirname, join, basename } from "node:path";
import fs from "node:fs/promises";
import path from "node:path";

export function getStaticMeta() {
  return {
    title: "Documentation",
    type: "page",
    description: "Zettelkasten LLM Documentation",
  };
}

export async function getMeta(filePath) {
  const defaultMeta = getStaticMeta();

  try {
    const normalizedPath = filePath.replace(/\.mdx$/, "");
    const dirPath = dirname(normalizedPath);
    const fileName = basename(normalizedPath);

    const metaJsonPath = path.join(dirPath, "_meta.json");
    const metaJsPath = path.join(dirPath, "_meta.js");

    let meta = {};

    // Statically defined meta files
    const staticMetaFiles = {
      // Add specific route mappings here
      "/": { title: "Home" },
      "/api/mongodb": { title: "MongoDB" },
      "/api/auth0": { title: "Auth0" },
      // Add more routes as needed
    };

    // Check if the route has a static meta definition
    if (staticMetaFiles[filePath]) {
      return {
        ...defaultMeta,
        ...staticMetaFiles[filePath],
      };
    }

    // Try to read JSON meta file first
    try {
      const metaContent = await fs.readFile(metaJsonPath, "utf-8");
      meta = JSON.parse(metaContent);
    } catch {
      // Fallback to static import if JSON fails
      try {
        // Use synchronous require for webpack compatibility
        const metaModule = require(metaJsPath);
        meta = metaModule.default || {};
      } catch (importError) {
        console.warn(`No meta file found for ${filePath}:`, importError);
      }
    }

    const itemMeta = meta[fileName] || {};

    return {
      ...defaultMeta,
      ...itemMeta,
    };
  } catch (error) {
    console.error(`Error processing meta for ${filePath}:`, error);
    return defaultMeta;
  }
}

// Export as default for easier importing
const metaFiles = { getStaticMeta, getMeta };
export default metaFiles;
