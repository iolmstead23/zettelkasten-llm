import { ComponentDoc, withCustomConfig } from "react-docgen-typescript/lib";
import { promises, readdirSync, mkdir, writeFileSync, Dirent } from "fs";
import path from "path";
import { globSync } from "glob";
import {
  DocLogEntry,
  DocLogBook,
  Documentation,
  DocgenOptions,
  GlobResult,
  MarkdownComponent,
} from "types/generateDocs";
import { readFile, rm } from "fs/promises";

/**
 * @component
 * @example
 * // Run documentation generation
 * node generateDocs.js
 *
 * @remarks
 * Documentation generation script features:
 * - Parses TypeScript/React components
 * - Generates Markdown files
 * - Creates navigation structure
 * - Handles type definitions
 * - Processes API routes
 *
 * @module DocumentationGenerator
 */

const options: DocgenOptions = {
  savePropValueAsString: true,
  shouldExtractLiteralValuesFromEnum: true,
  shouldRemoveUndefinedFromOptional: true,
  skipPropsWithoutDoc: false,
  shouldIncludePropTagMap: true,
  shouldIncludeExpression: true,
  shouldExtractInlineDescriptions: true,
  includeHooks: true,
  includeExports: true,
  propFilter: (p: any, c: any): boolean =>
    p.declarations !== undefined && p.declarations.length > 0
      ? Boolean(
          p.declarations.find((d: any) => !d.fileName.includes("node_modules"))
        )
      : true,
  parserOptions: {
    propFilter: (p: any): boolean =>
      p.declarations !== undefined && p.declarations.length > 0
        ? Boolean(
            p.declarations.find(
              (d: any) => !d.fileName.includes("node_modules")
            )
          )
        : true,
  },
};

const docgenParser = withCustomConfig("./tsconfig.json", options);

const getTypeStructure = (data: unknown): string => {
  if (data === null) return "null";
  if (Array.isArray(data)) {
    const sample = data[0];
    return `Array<${getTypeStructure(sample)}>`;
  }
  if (typeof data === "object") {
    const entries = Object.entries(data as object).map(
      ([key, value]) => `${key}: ${getTypeStructure(value)}`
    );
    return `{${entries.join(", ")}}`;
  }
  return typeof data;
};

const logBook: DocLogBook = {
  entries: [],
  startTime: new Date().toISOString(),
};

const isVerbose = (): boolean =>
  process.argv.includes("-verbose") || process.argv.includes("-v");

const log = (level: DocLogEntry["level"], message: string): void => {
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] [${level}] ${message}`;

  logBook.entries.push({
    timestamp,
    level,
    message,
  });

  console.log(logEntry);
};

const saveLogFile = async (): Promise<void> => {
  try {
    const fileName = `build_docs-${logBook.startTime.replace(/[:.]/g, "-")}.json`;
    const logFilePath = path.join("./logs", fileName);

    await mkdir(".logs", { recursive: true }, (err) => {
      if (err) throw err;
    });
    await writeFileSync(
      logFilePath,
      JSON.stringify(
        {
          startTime: logBook.startTime,
          endTime: new Date().toISOString(),
          entries: logBook.entries,
        },
        null,
        2
      )
    );
  } catch (error) {
    console.error("Error saving log file:", error);
  }
};

const logInfo = (message: string): void => log("INFO", message);
const logError = (message: string): void => log("ERROR", message);
const logDebug = (message: string): void => {
  if (isVerbose()) {
    log("DEBUG", message);
  }
};

const logDebugDetailed = (message: string, data: unknown): void => {
  if (isVerbose()) {
    const timestamp = new Date().toISOString();
    console.log(
      `[${timestamp}] [DEBUG] ${message}: ${JSON.stringify(data, null, 2)}`
    );
  }
};

const cleanDirectory = async (d: string): Promise<void> => {
  try {
    await rm(d, { recursive: true, force: true });
    await mkdir(d, { recursive: true }, (err) => {
      if (err) throw err;
    });
    logDebug(`Cleaned directory: ${d}`);
  } catch (e) {
    console.error(`Error cleaning directory ${d}:`, e);
  }
};

const cleanDocDirectories = async (): Promise<void> => {
  const directories = [
    "./pages/docs/components",
    "./pages/docs/api",
    "./pages/docs/pages",
    "./pages/docs/types",
  ];

  const filesToPreserve = new Map<string, string | null>([
    ["./pages/docs/metaLoader.js", null],
    ["./pages/docs/index.mdx", null],
    ["./pages/docs/_meta.js", null],
  ]);

  for (const [file, _] of Array.from(filesToPreserve.entries())) {
    try {
      const content = await readFile(file, "utf-8");
      filesToPreserve.set(file, content);
    } catch (e) {
      logDebug(`${file} not found, will be generated if needed`);
    }
  }

  for (const dir of directories) {
    await cleanDirectory(dir);
  }

  for (const [file, content] of Array.from(filesToPreserve.entries())) {
    if (content !== null) {
      await writeFileSync(file, content);
    }
  }
};

function generateTableOfContents(component: any): string {
  const sections = [
    component.props && Object.keys(component.props).length > 0
      ? "- [Props](#props)"
      : "",
    component.methods && component.methods.length > 0
      ? "- [Methods](#methods)"
      : "",
    component.tags?.example ? "- [Examples](#examples)" : "",
    component.tags?.remarks ? "- [Remarks](#remarks)" : "",
    component.interface ||
    (component.props && Object.keys(component.props).length > 0)
      ? "- [Types](#types)"
      : "",
  ].filter(Boolean);

  return sections.length > 0
    ? `## Table of Contents\n\n${sections.join("\n")}`
    : "";
}

async function generateRootIndex() {
  const indexPath = "./pages/docs/index.mdx";
  const content = `---\ntitle: Zettelkasten Documentation\ntype: page\n---\n\nimport { Callout } from 'nextra-theme-docs'\n\n# Zettelkasten Documentation\n\n<Callout type="info">\n  Comprehensive documentation for the Zettelkasten project\n</Callout>\n\n## Documentation Sections\n\n- [Components](/docs/components)\n- [Pages](/docs/pages)\n- [API Routes](/docs/api)\n- [Type Definitions](/docs/types)\n`;

  try {
    await mkdir(path.dirname(indexPath), { recursive: true }, (err) => {
      if (err) throw err;
    });
    await writeFileSync(indexPath, content, "utf8");
  } catch (e) {
    console.error("Error generating root index:", e);
    throw e;
  }
}

function serializeDocumentation(doc: Documentation): string {
  const seen = new WeakSet();
  return JSON.stringify(
    doc,
    (key: string, value: any) =>
      typeof value === "object" && value !== null
        ? seen.has(value)
          ? "[Circular]"
          : (seen.add(value), value)
        : value,
    2
  );
}

function generateTypeDefinitions(component: MarkdownComponent): string | null {
  if (!component.props || Object.keys(component.props).length === 0) {
    if (!component.interface) {
      return null;
    }
  }

  return `
### Types

\`\`\`typescript
${component.interface || ""}
${Object.entries(component.props || {})
  .map(([name, prop]) => `${name}: ${prop.type?.raw || prop.type?.name}`)
  .join("\n")}
\`\`\`
`;
}

async function generateTypeDocumentation(typeFile: string): Promise<boolean> {
  try {
    const typesDir = "./pages/docs/types";

    // Use fsPromises.mkdir for type-safe recursive directory creation
    await promises.mkdir(typesDir, { recursive: true });

    // Define type categories with their interfaces
    const typeCategories = {
      "graph-types": ["Node", "Edge", "GraphData", "GraphState"],
      "file-system-types": [
        "FileTreeObject",
        "FileTreeState",
        "SaveFilePayload",
      ],
      "action-types": ["KnowledgeGraphActionTypes", "FiletreeActionTypes"],
      "state-management-types": ["SaveType", "NotificationContentType"],
      "ui-state-types": [
        "RenameToggleState",
        "NewItemToggleState",
        "DeleteToggleState",
      ],
    };

    // Generate index page with category links
    const indexMdx = `# Type Definitions

${Object.keys(typeCategories)
  .map(
    (category) =>
      `- [${category
        .replace("-", " ")
        .replace(/\b\w/g, (l) => l.toUpperCase())}](./types/${category})`
  )
  .join("\n")}
`;

    await promises.writeFile(path.join(typesDir, "index.mdx"), indexMdx);

    // Generate individual category pages
    for (const [category, interfaces] of Object.entries(typeCategories)) {
      const categoryDir = path.join(typesDir, category);

      await promises.mkdir(categoryDir, { recursive: true });

      const categoryMdx = interfaces
        .map(
          (interfaceName) =>
            `## ${interfaceName}

\`\`\`typescript
export interface ${interfaceName} {
  // Interface details would be parsed from original type file
}
\`\`\`
`
        )
        .join("\n");

      await promises.writeFile(
        path.join(categoryDir, "index.mdx"),
        categoryMdx
      );
    }

    return true;
  } catch (error) {
    logError(`Error generating type documentation: ${error}`);
    return false;
  }
}

const generateMetaFiles = async (
  documentation: Documentation
): Promise<void> => {
  const generateMetaFile = (metaContent: Record<string, any>) => {
    const metaTemplate = `const meta = ${JSON.stringify(metaContent, null, 2)};
  
  export default meta;`;

    return metaTemplate;
  };

  try {
    const rootMetaPath = "./pages/docs/_meta.js";
    const rootMeta = `const modules = {
      "*": {
        theme: {
          pagination: true,
          sidebar: true,
        }
      },
      home: "Documentation Home",
      components: "Components",
      pages: "Pages",
      api: "API Routes",
      types: "Type Definitions"
    }`;

    await writeFileSync(rootMetaPath, rootMeta);

    for (const [category, files] of Object.entries(documentation)) {
      if (category === "components") {
        const generateComponentMetaRecursive = async (
          basePath: string,
          componentPath: string
        ) => {
          const componentMeta: any = {
            "*": {
              theme: {
                pagination: true,
                sidebar: true,
              },
            },
          };

          const dirEntries = await readdirSync(componentPath, {
            withFileTypes: true,
          });

          for (const entry of dirEntries) {
            if (entry.isDirectory()) {
              componentMeta[entry.name] = {
                title: entry.name.split(/(?=[A-Z])/).join(" "),
                type: "menu",
              };

              await generateComponentMetaRecursive(
                basePath,
                path.join(componentPath, entry.name)
              );
            }
          }

          const componentMDXFiles: string[] = dirEntries
            .filter(
              (entry: Dirent) => entry.isFile() && entry.name.endsWith(".mdx")
            )
            .map((file: Dirent) => file.name.replace(".mdx", ""));

          componentMDXFiles.forEach((file: string) => {
            componentMeta[file] = {
              title: file.split(/(?=[A-Z])/).join(" "),
              type: "doc",
            };
          });

          const metaPath = path.join(componentPath, "_meta.js");
          await writeFileSync(metaPath, generateMetaFile(componentMeta));
        };

        await generateComponentMetaRecursive(
          "./pages/docs/components",
          "./pages/docs/components"
        );
        // -------------------------------------------------------
      } else {
        // const generateCategoryMetaRecursive = async (
        //   basePath: string,
        //   categoryPath: string
        // ) => {
        //   const categoryMeta: any = {
        //     "*": {
        //       theme: {
        //         pagination: true,
        //         sidebar: true,
        //       },
        //     },
        //   };

        //   const dirEntries = await readdirSync(categoryPath, {
        //     withFileTypes: true,
        //   });

        //   for (const entry of dirEntries) {
        //     if (entry.isDirectory()) {
        //       categoryMeta[entry.name] = {
        //         title: entry.name.split(/(?=[A-Z])/).join(" "),
        //         type: "menu",
        //       };

        //       await generateCategoryMetaRecursive(
        //         basePath,
        //         path.join(categoryPath, entry.name)
        //       );
        //     }
        //   }

        //   const categoryMDXFiles: any[] = dirEntries
        //     .filter(
        //       (entry: Dirent) => entry.isFile() && entry.name.endsWith(".mdx")
        //     )
        //     .map((file: Dirent) => file.name.replace(".mdx", ""));

        //   categoryMDXFiles.forEach((file) => {
        //     const safeKey = file.name.toLowerCase().replace(/[^a-z0-9-]/g, "-");
        //     categoryMeta[safeKey] = {
        //       title: file.name.split(/(?=[A-Z])/).join(" "),
        //       type: "doc",
        //     };
        //   });
        //   // await readdirSync(categoryPath, {
        //   //   withFileTypes: true,
        //   // });
        //   const metaPath = path.join(categoryPath, "_meta.js");
        //   await writeFileSync(metaPath, generateMetaFile(categoryMeta));
        // };

        // const generateFlatCategoryMeta = async (category: string) => {
        //   const categoryPath = path.join("./pages/docs", category);

        //   const categoryMeta: any = {
        //     "*": {
        //       theme: {
        //         pagination: true,
        //         sidebar: true,
        //       },
        //     },
        //   };

        //   // Special handling for API routes
        //   if (category === "api") {
        //     // Explicitly define API route pages
        //     categoryMeta["mongodb"] = {
        //       title: "MongoDB Database Routes",
        //       type: "doc",
        //     };
        //     categoryMeta["auth0"] = {
        //       title: "Authentication Routes",
        //       type: "doc",
        //     };
        //   } else {
        //     // For pages category, create a flat structure
        //     const mdxFiles = await readdirSync(categoryPath, {
        //       withFileTypes: true,
        //     }).filter(
        //       (entry: Dirent) => entry.isFile() && entry.name.endsWith(".mdx")
        //     );

        //     mdxFiles.forEach((file: Dirent) => {
        //       const safeKey = file.name
        //         .toLowerCase()
        //         .replace(/[^a-z0-9-]/g, "-");
        //       categoryMeta[safeKey] = {
        //         title: file.name
        //           .replace(".mdx", "")
        //           .split("-")
        //           .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        //           .join(" "),
        //         type: "doc",
        //       };
        //     });
        //   }

        //   const metaPath = path.join(categoryPath, "_meta.js");
        //   await writeFileSync(metaPath, generateMetaFile(categoryMeta));
        // };
        const categoryPath = path.join("./pages/docs", category);

        const categoryMeta: any = {
          "*": {
            theme: {
              pagination: true,
              sidebar: true,
            },
          },
        };

        // Centralized API route meta generation
        if (category === "api") {
          categoryMeta["mongodb"] = {
            title: "MongoDB Database Routes",
            type: "doc",
          };
          categoryMeta["auth0"] = {
            title: "Authentication Routes",
            type: "doc",
          };
        } else if (category === "pages") {
          // For pages category, create a flat structure
          const mdxFiles = await readdirSync(categoryPath, {
            withFileTypes: true,
          }).filter(
            (entry: Dirent) => entry.isFile() && entry.name.endsWith(".mdx")
          );

          mdxFiles.forEach((file: Dirent) => {
            const safeKey = file.name.toLowerCase().replace(/[^a-z0-9-]/g, "-");
            categoryMeta[safeKey] = {
              title: file.name
                .replace(".mdx", "")
                .split("-")
                .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                .join(" "),
              type: "doc",
            };
          });
        }

        const metaPath = path.join(categoryPath, "_meta.js");
        await writeFileSync(metaPath, generateMetaFile(categoryMeta));
      }
    }

    logInfo("Meta files generated successfully");
  } catch (error) {
    logError(`Error generating meta files: ${error}`);
    throw error;
  }
};

function convertToMarkdownComponent(
  component: ComponentDoc
): MarkdownComponent {
  return {
    description: component.description,
    displayName: component.displayName,
    tags: component.tags as MarkdownComponent["tags"],
    props: component.props,
    methods: component.methods?.map((method: any) => ({
      name: method.name,
      params: method.params?.map((param: any) => {
        const typeStr =
          typeof param.type === "string"
            ? param.type
            : param.type?.name || "unknown";
        return `${param.name}: ${typeStr}`;
      }),
      returns: method.returns?.type || "",
    })),
    interface: (component as any).interface,
  };
}

const findRouteFiles = (dir: string): string[] => {
  const routes: string[] = [];
  const entries = readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      routes.push(...findRouteFiles(fullPath));
    } else if (entry.name === "route.tsx") {
      routes.push(fullPath);
    }
  }
  return routes;
};

async function generateMarkdownFiles(
  documentation: Documentation
): Promise<void> {
  const generatedFiles = new Set<string>();

  for (const [category, files] of Object.entries(documentation)) {
    for (const [filePath, components] of Object.entries(files)) {
      try {
        const cleanPath = filePath
          .replace(/\.tsx?$/, "")
          .replace(/\\/g, "/")
          .replace(/[^a-zA-Z0-9-_/]/g, "");

        let outputDir;
        let fileName;
        let pageTitle;

        const baseDocsDir = path.resolve("./pages/docs");

        if (category === "components") {
          outputDir = path.join(
            baseDocsDir,
            "components",
            path.dirname(cleanPath)
          );
          fileName = path.basename(cleanPath);
          pageTitle = fileName;
        } else if (category === "api") {
          outputDir = path.join(baseDocsDir, "api");
          const apiBaseDir = path.join(process.cwd(), "app", "api");

          const routeFiles = findRouteFiles(apiBaseDir);
          log("DEBUG", `Found ${routeFiles.length} route files`);

          for (const routeFile of routeFiles) {
            const routePath = path.relative(apiBaseDir, routeFile);
            log("DEBUG", `Processing route file: ${routeFile}`);
            log("DEBUG", `Route relative path: ${routePath}`);

            // Read file content directly instead of using docgenParser
            const fileContent = await readFile(routeFile, "utf-8");

            // Parse JSDoc comments
            const jsDocRegex = /\/\*\*\s*([\s\S]*?)\s*\*\//g;
            const matches = Array.from(fileContent.matchAll(jsDocRegex));

            let fileName;
            let pageTitle;
            let description = "";
            let remarks = "";
            let returns = "";
            let throws = "";

            // Extract JSDoc information
            matches.forEach((match) => {
              const comment = match[1];
              if (comment.includes("")) {
                description = comment.match(/\s+(.*)/)?.[1] || "";
              }
              if (comment.includes("@remarks")) {
                remarks =
                  comment.match(/@remarks\s+([\s\S]*?)(?=@|$)/)?.[1].trim() ||
                  "";
              }
              if (comment.includes("@returns")) {
                returns = comment.match(/@returns\s+{(.*)}\s+(.*)/)?.[2] || "";
              }
              if (comment.includes("@throws")) {
                throws = comment.match(/@throws\s+{(.*)}\s+(.*)/)?.[2] || "";
              }
            });

            if (routePath.includes("auth")) {
              fileName = "auth0";
              pageTitle = "Auth0";
            } else if (routePath.includes("db")) {
              fileName = "mongodb";
              pageTitle = "MongoDB";
            } else {
              fileName = routePath.split(path.sep)[0];
              pageTitle = fileName.charAt(0).toUpperCase() + fileName.slice(1);
            }

            const outputPath = path.join(outputDir, `${fileName}.mdx`);

            if (!generatedFiles.has(outputPath)) {
              const mockComponent: MarkdownComponent = {
                displayName: pageTitle,
                description: description,
                props: {},
                methods: [],
                tags: {
                  remarks: remarks,
                  returns: returns,
                  throws: throws,
                },
                interface: `${pageTitle}API`,
              };

              const content = generateCombinedMarkdownContent(
                [mockComponent],
                routePath,
                pageTitle
              );

              await writeFileSync(outputPath, content);
              generatedFiles.add(outputPath);

              logDebugDetailed("Generated markdown file", {
                category,
                filePath: routePath,
                fullPath: outputPath,
                pageTitle,
                componentsCount: 1,
              });
            }
          }
        } else if (category === "pages") {
          outputDir = path.join(baseDocsDir, "pages");

          // Normalize the entire filePath first
          const normalizedPath = filePath
            .replace(/\\/g, "/")
            .replace(/^\.\//, "")
            .replace(/^app\//, "");

          // Create a unique key for the root page that's the same regardless of path format
          const uniqueKey =
            normalizedPath === "page.tsx" ? "root-page" : normalizedPath;

          if (!generatedFiles.has(uniqueKey)) {
            generatedFiles.add(uniqueKey);

            if (normalizedPath === "page.tsx") {
              fileName = "home";
              pageTitle = "Home";
            } else {
              const dirName = path
                .dirname(normalizedPath)
                .split("/")
                .filter(Boolean)
                .pop();

              if (!dirName) continue;

              fileName = dirName;
              pageTitle = dirName
                .split("-")
                .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                .join(" ");
            }
          } else {
            continue; // Skip if we've already processed this file
          }
        } else {
          throw new Error(
            `Invalid category: ${category}. Cannot determine output directory.`
          );
        }

        if (!outputDir || !fileName) {
          throw new Error(
            `Failed to determine output path for ${filePath} in category ${category}`
          );
        }

        // Ensure output directory exists
        await mkdir(outputDir, { recursive: true }, (err) => {
          if (err) throw err;
        });

        const fullPath = path.join(outputDir, `${fileName}.mdx`);
        const uniqueFileKey = `${category}:${fullPath}`;

        // Validate path is within the docs directory
        const normalizedFullPath = path.normalize(fullPath);
        const normalizedDocsDir = path.normalize(baseDocsDir);

        if (!normalizedFullPath.startsWith(normalizedDocsDir)) {
          logError(
            `Path validation failed: ${fullPath} is outside of ${baseDocsDir}`
          );
          continue;
        }

        if (!generatedFiles.has(uniqueFileKey)) {
          generatedFiles.add(uniqueFileKey);

          const markdownComponents = components.map(convertToMarkdownComponent);

          const mdContent = generateCombinedMarkdownContent(
            markdownComponents,
            filePath,
            pageTitle
          );

          await writeFileSync(fullPath, mdContent);

          logDebugDetailed("Generated markdown file", {
            category,
            filePath,
            fullPath,
            pageTitle,
            componentsCount: components.length,
          });
        }
      } catch (err: any) {
        logError(`Error generating markdown for ${filePath}: ${err.message}`);
      }
    }
  }
}

function generateCombinedMarkdownContent(
  components: MarkdownComponent[],
  filePath: string,
  pageTitle?: string
): string {
  const mainComponent: MarkdownComponent =
    components.find((c) => c.displayName === path.basename(filePath, ".tsx")) ||
    components[0];
  const otherComponents = components.filter((c) => c !== mainComponent);

  // Special handling for API routes
  if (filePath.includes("api/")) {
    const routeType = filePath.includes("auth")
      ? "Auth0"
      : filePath.includes("db")
        ? "MongoDB"
        : filePath.includes("test")
          ? "Test"
          : "API";

    return `---
title: ${routeType} API
---

# ${routeType} API Documentation

${mainComponent.description ? mainComponent.description + "\n\n" : ""}

## API Route
\`${filePath}\`

${generateComponentContent(mainComponent)}

${
  otherComponents.length > 0
    ? "## Related Functions\n\n" +
      otherComponents.map((comp) => generateComponentContent(comp)).join("\n\n")
    : ""
}`;
  }

  // Original content generation for non-API files
  return `
${mainComponent.description ? mainComponent.description + "\n\n" : ""}
---\n
title: ${mainComponent.displayName}\n---\n\n# ${mainComponent.displayName}\n\n
${generateComponentContent(mainComponent)}\n\n${
    otherComponents.length > 0 ? "## Exported Functions & Hooks\n" : ""
  }\n
${otherComponents
  .map(
    (component) =>
      `\n### ${component.displayName}\n\n${generateComponentContent(
        component
      )}\n`
  )
  .join("\n")}\n\n## Source\n\n\`\`\`tsx\n${filePath}\n\`\`\``;
}

function generateComponentContent(component: MarkdownComponent): string {
  const tags = component.tags || {};
  const props = component.props || {};
  const methods = component.methods || [];

  // Only generate type definitions if they exist
  const typeDefinitions = generateTypeDefinitions(component);

  return `
${generateTableOfContents(component)}

${typeDefinitions ? typeDefinitions : ""}

${tags.remarks ? `### Remarks\n\n${tags.remarks}\n` : ""}

${tags.example ? `### Example\n\n\`\`\`tsx\n${tags.example}\n\`\`\`\n` : ""}

${
  Object.keys(props).length > 0
    ? `### Props\n\n${Object.entries(props)
        .map(
          ([name, prop]) =>
            `#### \`${name}\`\n\n- **Type**: \`${
              prop.type?.name || "unknown"
            }\`\n${
              prop.type?.raw ? `- **Raw Type**: \`${prop.type.raw}\`` : ""
            }\n- **Required**: ${prop.required ? "Yes" : "No"}\n${
              prop.defaultValue
                ? `- **Default**: \`${prop.defaultValue.value}\``
                : ""
            }\n`
        )
        .join("\n")}`
    : ""
}

${
  methods.length > 0
    ? `### Methods\n\n${methods
        .map(
          (method) =>
            `#### \`${method.name}\`\n\n${
              method.params
                ? `**Parameters**\n\n${method.params.join("\n")}`
                : ""
            }\n`
        )
        .join("\n")}`
    : ""
}

${tags.returns ? `### Returns\n\n${tags.returns}\n` : ""}
${tags.throws ? `### Throws\n\n${tags.throws}\n` : ""}`;
}

async function generateDocs(): Promise<void> {
  logInfo("Starting documentation generation...");

  try {
    await cleanDocDirectories();
    logInfo("Cleaned documentation directories.");

    await generateRootIndex();
    logInfo("Generated root index.");

    const componentFiles = globSync("./components/**/*.{tsx,ts}", {
      ignore: ["**/*.d.ts", "**/*.test.tsx", "**/*.test.ts"],
    });

    const appFiles = [
      "./app/page.tsx",
      ...globSync("./app/**/page.{tsx,ts}", {
        ignore: [
          "**/node_modules/**",
          "**/*.d.ts",
          "**/*.test.tsx",
          "**/*.test.ts",
          "./app/api/**",
        ],
        absolute: false,
      }),
    ];

    const apiFiles = globSync("./app/api/**/{route,*.route}.{ts,tsx}", {
      ignore: [
        "**/node_modules/**",
        "**/*.d.ts",
        "**/*.test.tsx",
        "**/*.test.ts",
      ],
      absolute: false,
      windowsPathsNoEscape: true,
      dot: true,
    });

    const typeFiles = globSync("./**/*.d.ts", {
      ignore: ["./node_modules/**", "./.next/**"],
      absolute: false,
    });

    const allFiles: GlobResult = {
      components: componentFiles,
      pages: appFiles,
      api: apiFiles,
      types: typeFiles,
    };

    const documentation: Documentation = {};

    for (const [category, files] of Object.entries(allFiles)) {
      logInfo(`Processing category: ${category}`);

      if (category === "types") {
        for (const typeFile of files) {
          try {
            if (typeFile.split("/").length <= 2) {
              await generateTypeDocumentation(typeFile);
              const typeDoc = docgenParser.parse(typeFile);
              documentation[category] = documentation[category] || {};
              documentation[category][typeFile] = typeDoc;
              logDebug(`Processed types file: ${typeFile}`);
            }
          } catch (error) {
            logError(`Error processing types file: ${error}`);
          }
        }
      } else {
        for (const file of files) {
          try {
            const componentDocs = docgenParser.parse(file);
            if (componentDocs.length > 0) {
              const basePath =
                category === "components"
                  ? "./components"
                  : category === "api"
                    ? "./app/api"
                    : "./app";
              const relativePath = path.relative(basePath, file);
              documentation[category] = documentation[category] || {};
              documentation[category][relativePath] = componentDocs;
              logDebug(`Processed file: ${file}`);
            }
          } catch (error) {
            logError(`Error processing ${file}: ${error}`);
          }
        }
      }
    }

    await mkdir("./docs", { recursive: true }, (err) => {
      if (err) throw err;
    });
    await mkdir("./pages/docs/components", { recursive: true }, (err) => {
      if (err) throw err;
    });
    await mkdir("./pages/docs/pages", { recursive: true }, (err) => {
      if (err) throw err;
    });
    await mkdir("./pages/docs/api", { recursive: true }, (err) => {
      if (err) throw err;
    });
    await mkdir("./pages/docs/types", { recursive: true }, (err) => {
      if (err) throw err;
    });

    await writeFileSync(
      "./docs/components.json",
      serializeDocumentation(documentation)
    );
    logInfo("Serialized documentation to components.json.");

    await generateMarkdownFiles(documentation);
    logInfo("Generated markdown files.");

    await generateMetaFiles(documentation);
    logInfo("Generated meta files.");

    logInfo("Documentation generated successfully!");
    await saveLogFile();
  } catch (error) {
    logError(`Error generating documentation: ${error}`);
    await saveLogFile();
    process.exit(1);
  }
}

(async () => {
  await generateDocs();
})();
