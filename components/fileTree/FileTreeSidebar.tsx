"use client";

import React, { use, useCallback, useEffect, useState } from "react";
import { AiOutlineFile, AiOutlineFolder } from "react-icons/ai";
import { BiPencil } from "react-icons/bi";
import {
  DiJavascript1,
  DiCss3Full,
  DiHtml5,
  DiReact,
  DiMarkdown,
} from "react-icons/di";
import FileDropdown from "components/fileTree/FileDropdown";
import FolderDropdown from "components/fileTree/FolderDropdown";
import {
  CollapsableComponent,
  FileIcons,
  LogEntryMetadata,
  LogLevel,
  RootValues,
  SelectedEditIndexType,
} from "types/types";
import { useSelectedEditContext } from "components/providers/subproviders/SelectedEditIndexProvider";
import { useFiletreeContext } from "components/providers/subproviders/FiletreeContextProvider";
import { useSelectedIndexContext } from "components/providers/subproviders/SelectedIndexProvider";
import { useNewItemToggleContext } from "components/providers/subproviders/ToggleProvider";
import Image from "next/legacy/image";
import { GoQuestion } from "react-icons/go";
import { useLogger } from "components/logging/LogWrapper";

/**
 * @title File Icons Mapping
 * @type Mapping of file extensions to their corresponding icons
 */
const fileIcons: FileIcons = {
  js: <DiJavascript1 />,
  css: <DiCss3Full />,
  html: <DiHtml5 />,
  jsx: <DiReact />,
  md: <DiMarkdown />,
  default: <GoQuestion />,
} as const satisfies Record<string, React.ReactNode>;

/**
 * @title Collapsible Section Component
 * @component
 * @remarks Renders a collapsible section with dynamic height
 *
 * @param {CollapsableComponent} props - Component properties
 * @param {ReactNode} props.children - Child components to render
 * @param {boolean} props.isOpen - Determines section visibility
 * @returns {JSX.Element} Collapsible section
 */
const Collapsible: React.FC<CollapsableComponent> = ({ children, isOpen }) => {
  return (
    <ul
      role="list"
      className={`flex flex-1 flex-col gap-y-7 overflow-hidden \${
        isOpen ? "h-0" : "h-full"
      }`}
    >
      <li>
        <ul role="list" className="-mx-2 space-y-1">
          {children}
        </ul>
      </li>
    </ul>
  );
};

/**
 * @title File Component
 * @component
 * @remarks Renders individual file with icon and selection state
 *
 * @param {Object} props - Component properties
 * @param {number} props.index - Unique file index
 * @param {string} props.name - File name
 * @param {Object} props.selection - File selection context
 * @param {Object} props.contents - File contents
 * @returns {JSX.Element} File display component
 */
const File = ({
  index,
  name,
  contents,
}: {
  index: number;
  name: string;
  selection: any;
  contents: SelectedEditIndexType["contents"];
}) => {
  const ext = name.split(".")[1]?.toLowerCase() || "default";
  const { selectedEditIndex, setSelectedEditIndex } = useSelectedEditContext();
  const { selectedIndex, setSelectedIndex } = useSelectedIndexContext();
  const { addLogs } = useLogger();

  const handleLogger = useCallback(
    async ({
      message,
      level,
      metadata,
    }: {
      message: string;
      level: LogLevel;
      metadata?: LogEntryMetadata;
    }) => {
      try {
        await addLogs({
          message,
          level,
          metadata: { ...metadata, component: "FileTreeSidebar - File" },
        });
      } catch (error: any) {
        console.error("Log submission error", error.message);
      }
    },
    [addLogs]
  );

  /**
   * Handles file selection
   * @function
   */
  const handleSelection = () => {
    try {
      setSelectedIndex({
        index: index,
        content_name: name,
      });

      // Don't parse if already an object
      const contentData =
        contents === "string" ? JSON.parse(contents) : contents;

      handleLogger({
        message: "File selection successful",
        level: "DEBUG",
        metadata: {
          selectedData: {
            index,
            name,
          },
          selectedDataConents: !!contentData ? "Valid" : "Empty",
        },
      });
    } catch (error: any) {
      handleLogger({
        message: "File selection failed",
        level: "ERROR",
        metadata: {
          error: error.message,
          failedContentType: typeof contents,
        },
      });
    }
  };

  const isSelected: boolean = selectedIndex?.index == index;
  const isBeingEdited: boolean = selectedEditIndex?.index === index;

  return (
    <div
      onContextMenu={(e) => {
        e.preventDefault();
      }}
    >
      <div className="pl-5 flex items-center justify-between pr-4">
        <div className="flex items-center">
          {fileIcons[ext] || fileIcons["default"]}
          <div onClick={handleSelection} className="flex items-center">
            <span
              className={`${isSelected ? "text-purple-500" : "text-black"} ml-5`}
            >
              {name}
            </span>
            {isBeingEdited && (
              <BiPencil className="ml-2 text-gray-500" size={14} />
            )}
          </div>
        </div>
        {isSelected && (
          <div className="absolute right-4">
            <FileDropdown
              data={{
                index,
                contents,
                name,
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * @title Folder Component
 * @component
 * @remarks Renders folder with collapsible children and dropdown
 *
 * @param {Object} props - Component properties
 * @param {number} props.index - Unique folder index
 * @param {string} props.name - Folder name
 * @param {Object} props.selection - Folder selection context
 * @param {ReactNode} props.children - Child components
 * @returns {JSX.Element} Folder display component
 */
const Folder = ({
  index,
  name,
  children,
}: {
  index: number;
  name: string;
  selection: any;
  children: any;
}) => {
  const [isOpen, setIsOpen] = useState<boolean | number>(+false);
  const { selectedEditIndex, setSelectedEditIndex } = useSelectedEditContext();
  const { selectedIndex, setSelectedIndex } = useSelectedIndexContext();
  const { addLogs } = useLogger();
  const handleLogger = useCallback(
    async ({
      message,
      level,
      metadata,
    }: {
      message: string;
      level: LogLevel;
      metadata?: LogEntryMetadata;
    }) => {
      try {
        await addLogs({
          message,
          level,
          metadata: { ...metadata, component: "FileTreeSidebar - Folder" },
        });
      } catch (error) {
        console.error("Log submission error", error);
      }
    },
    [addLogs]
  );

  /**
   * Handles file selection
   * @function
   */
  // Add file switch tracking
  const handleSelection = () => {
    try {
      setSelectedIndex({
        index: index,
        content_name: name,
      });

      // Only log file selection, not content changes
      handleLogger({
        message: "File selection successful",
        level: "DEBUG",
        metadata: {
          selectedData: { index, name },
        },
      });
    } catch (error: any) {
      handleLogger({
        message: "File selection failed",
        level: "ERROR",
        metadata: { error: error.message },
      });
    }
  };

  const isSelected: boolean = selectedEditIndex?.index == index;

  return (
    <div
      onContextMenu={(e) => {
        e.preventDefault();
      }}
    >
      <div className="pl-5 flex-col">
        <div className="flex items-center justify-between pr-4">
          <div className="flex items-center" onClick={handleSelection}>
            <AiOutlineFolder />
            <span
              className={`\${
                isSelected ? "text-purple-500" : "text-black"
              } pl-5`}
            >
              {name}
            </span>
          </div>
          {isSelected && (
            <div className="absolute right-4">
              <FolderDropdown isOpen={isOpen} setIsOpen={setIsOpen} />
            </div>
          )}
        </div>
        <Collapsible isOpen={isOpen}>{children}</Collapsible>
      </div>
    </div>
  );
};

/**
 * @title Tree Component
 * @component
 * @remarks Wrapper for rendering file tree structure
 *
 * @param {Object} props - Component properties
 * @param {ReactNode} props.children - Child components to render
 * @returns {JSX.Element} Tree structure container
 */
const Tree = ({ children }: any) => {
  return <div className="leading-[1.5]">{children}</div>;
};

/**
 * @title Root Component
 * @component
 * @remarks Renders root-level file and folder structure
 *
 * @param {Object} props - Component properties
 * @param {any} props.data - File tree data
 * @param {Object} props.selection - Selection context
 * @returns {JSX.Element} Recursive file tree rendering
 */
const Root = ({ data, selection }: any) => {
  // const fileArray = Array.isArray(data)
  //   ? data
  //   : data.files && Array.isArray(data.files)
  //     ? data.files
  //     : null;

  return (
    <div
      onContextMenu={(e) => {
        e.preventDefault();
      }}
    >
      {data.map((item: any, index: number) => {
        const { id, type, name, contents }: RootValues = item;

        return (
          <div key={index} className="min-h-5">
            {item.type === "file" ? (
              <File
                key={id}
                index={id}
                name={name}
                selection={selection}
                contents={contents as Object}
              />
            ) : item.type === "folder" ? (
              <Folder key={id} index={id} name={name} selection={selection}>
                <Root data={contents} selection={selection} />
              </Folder>
            ) : null}
          </div>
        );
      })}
    </div>
  );
};

// Attach components to Tree
Tree.File = File;
Tree.Folder = Folder;
Tree.Root = Root;

/**
 * @component
 * @remarks
 * Main sidebar component for file tree navigation
 * Features:
 * - Dynamic file and folder rendering
 * - Create new item functionality
 * - Selection and context management
 *
 * @returns {JSX.Element} File tree sidebar component
 * @see FileDropdown
 * @see FolderDropdown
 */
export default function FileTreeSidebar(): React.JSX.Element {
  const logger = useLogger();
  const { addLogs } = logger;
  const files = useFiletreeContext();
  const selection = useSelectedIndexContext();
  const newItemToggle = useNewItemToggleContext();
  const fileData = files?.state;

  const handleLogger = useCallback(
    async ({
      message,
      level,
      metadata,
    }: {
      message: string;
      level: LogLevel;
      metadata?: LogEntryMetadata;
    }) => {
      try {
        await addLogs({
          message,
          level,
          metadata: { ...metadata, component: "FileTreeSidebar" },
        });
      } catch (error) {
        console.error("Log submission error", error);
      }
    },
    [addLogs]
  );

  useEffect(() => {
    // Log mounting
    handleLogger({
      message: "FileTreeSidebar mounting",
      level: "DEBUG",
    });

    // Only log data if files exist
    if (files.state.length > 0) {
      handleLogger({
        message: "FileTree data loaded",
        level: "DEBUG",
        metadata: {
          fileCount: files.state.length,
        },
      });
    }
  }, [files.state, handleLogger]);

  try {
    return (
      <div className="z-10">
        <div>
          <div
            className="pl-5 flex items-center"
            onClick={() => {
              selection?.setSelectedIndex({ index: -1, content_name: "" });
              newItemToggle?.setNewIsOpen(true);
            }}
          >
            Create New
            <div className="pl-2">
              <Image
                src="/plus-circle-svgrepo-com.svg"
                alt="New Item"
                width={15}
                height={15}
              />
            </div>
          </div>

          {fileData && (
            <Tree>
              <Tree.Root
                data={Array.isArray(fileData) ? fileData : []}
                selection={selection}
              />
            </Tree>
          )}
        </div>
      </div>
    );
  } catch (error: any) {
    handleLogger({
      message: "FileTreeSidebar error",
      level: "ERROR",
      metadata: { error: error.message },
    });
    throw error;
  }
}
