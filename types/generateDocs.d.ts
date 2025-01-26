// types/generateDocs.d.ts

import { ComponentDoc, MethodParameter, Method } from "react-docgen-typescript";
import { LogLevel } from "types/types";

export interface DocLogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
}

export interface DocLogBook {
  entries: LogEntry[];
  startTime: string;
}

export interface DocumentationComponent extends Omit<ComponentDoc, "methods"> {
  displayName?: string;
  tags?: {
    remarks?: string;
    example?: string;
    returns?: string;
    throws?: string;
  };
  props?: {
    [key: string]: {
      type?: {
        name?: string;
        raw?: string;
      };
      required?: boolean;
      defaultValue?: {
        value: string;
      };
    };
  };
  methods?: Array<{
    name: string;
    params?: string[];
    returns?: string;
  }>;
  interface?: string;
}

export interface DirectoryTree {
  [key: string]:
    | {
        title: string;
        type: string;
      }
    | DirectoryTree;
}

export interface Documentation {
  [category: string]: {
    [filePath: string]: ComponentDoc[];
  };
}

export interface MetaContent {
  [key: string]: string | {
    title?: string;
    type?: "page" | "doc" | "menu";
    theme?: {
      layout?: string;
      toc?: boolean;
      pagination?: boolean;
      sidebar?: boolean;
    };
    display?: string;
    items?: Record<string, MetaContent>;
  };
}

export interface DocgenOptions {
  savePropValueAsString: boolean;
  shouldExtractLiteralValuesFromEnum: boolean;
  shouldRemoveUndefinedFromOptional: boolean;
  skipPropsWithoutDoc: boolean;
  shouldIncludePropTagMap: boolean;
  shouldIncludeExpression: boolean;
  shouldExtractInlineDescriptions: boolean;
  includeHooks: boolean;
  includeExports: true;
  propFilter: (p: any, c: any) => boolean;
  parserOptions: {
    propFilter: (p: any) => boolean;
  };
}

export interface FileOperations {
  cleanDirectory: (d: string) => Promise<void>;
  generateRootIndex: () => Promise<void>;
  generateTypeDocumentation: (typeFile: string) => Promise<boolean>;
  generateMarkdownFiles: (documentation: Documentation) => Promise<void>;
  generateMetaFiles: (documentation: Documentation) => Promise<void>;
}

export interface GlobResult {
  [key: string]: string[];
}

export interface MarkdownComponent {
  displayName?: string;
  description?: string;
  tags?: {
    remarks?: string;
    example?: string;
    returns?: string;
    throws?: string;
  };
  props?: {
    [key: string]: {
      type?: {
        name?: string;
        raw?: string;
      };
      required?: boolean;
      defaultValue?: {
        value: string;
      };
    };
  };
  methods?: Array<{
    name: string;
    params?: string[];
    returns?: string | { type: string };
  }>;
  interface?: string;
}

export interface NextraMetaItem {
  title: string;
  type: "page" | "doc";
  display?: "hidden" | "normal";
  theme?: {
    toc?: boolean;
    pagination?: boolean;
    sidebar?: boolean;
  };
}

export interface NextraMetaFile {
  "*"?: {
    theme?: {
      pagination?: boolean;
      sidebar?: boolean;
      toc?: boolean;
    };
  };
  [key: string]: NextraMetaItem | { theme?: Record<string, unknown> } | undefined;
}