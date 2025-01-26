"use client";

import {
  FileTreeObject,
  FileTreeState,
  IndexSortState,
  InsertFilePayload,
  FiletreeActionTypes,
  RenameFileAction,
  GetFilesAction,
  SaveFileAction,
  InsertFileAction,
  DeleteFileAction,
  SortIndexAction,
  Node,
  LogLevel,
  LogEntryMetadata,
} from "types/types";
import React, {
  ReactNode,
  useReducer,
  useState,
  useContext,
  useEffect,
  createContext,
  useRef,
  useCallback,
} from "react";
import { useSelectedEditContext } from "components/providers/subproviders/SelectedEditIndexProvider";
import { useSelectedIndexContext } from "components/providers/subproviders/SelectedIndexProvider";
import { useFileLocationContext } from "components/providers/subproviders/FileLocationProvider";
import { UserContext, useUser } from "@auth0/nextjs-auth0/client";
import { useKnowledgeGraphContext } from "components/providers/subproviders/KnowledgeGraphProvider";
import { useLogger } from "components/logging/LogWrapper";

/**
 * Context for managing file tree state
 * @context
 * @type {React.Context<FileTreeState>}
 */
const FileTreeContext = createContext<FileTreeState>({
  state: [],
  dispatch: undefined,
});

/**
 * Context for managing index sorting state
 * @context
 * @type {React.Context<IndexSortState | undefined>}
 */
const IndexSortContext = createContext<IndexSortState | undefined>(undefined);

/**
 * Default content structure for new files
 * @constant
 * @type {Object}
 */
const defaultContent = {
  root: {
    children: [
      {
        children: [
          {
            detail: 0,
            format: 0,
            mode: "normal",
            style: "",
            text: "",
            type: "text",
            version: 1,
          },
        ],
        direction: "ltr",
        format: "",
        indent: 0,
        type: "paragraph",
        version: 1,
      },
    ],
    direction: "ltr",
    format: "",
    indent: 0,
    type: "root",
    version: 1,
  },
};

/**
 * @title File Tree Reducer
 * @remarks
 * Central state management function for file tree operations
 *
 * @param {FileTreeState} state - Current file tree state
 * @param {FiletreeActionTypes} action - Action to perform on state
 * @returns {FileTreeState} Updated file tree state
 *
 * @example
 * // Example of a file insertion action
 * const action = {
 *   type: 'insert_file',
 *   payload: {
 *     id: 123,
 *     name: 'New File.md',
 *     type: 'file'
 *   }
 * }
 */
function reducer(
  state: FileTreeState,
  action: FiletreeActionTypes
): FileTreeState {
  /**
   * Handles file and folder renaming operations
   * @function
   * @param {FileTreeState} state - Current file tree state
   * @param {RenameFileAction} action - Rename action payload
   * @returns {FileTreeState} Updated file tree state
   */
  function rename_file(
    state: FileTreeState,
    action: RenameFileAction
  ): FileTreeState {
    const { index, newName } = action.payload;

    return {
      state: state.state.map((item: FileTreeObject) => {
        if (item.index == index) {
          if (item.type == "file") {
            return { ...item, name: newName };
          } else if (item.type == "folder") {
            return { ...item, name: newName.split(".")[0] };
          }
        } else {
          if (item.type == "file") {
            return item;
          } else if (item.type == "folder") {
            return {
              ...item,
              contents: item.contents,
            };
          }
        }
        return item;
      }),
    };
  }

  /**
   * Creates new files and folders in the file tree
   * @function
   * @param {FileTreeState} state - Current file tree state
   * @param {FiletreeActionTypes} action - Create action payload
   * @returns {FileTreeState} Updated file tree state
   */
  function create_file(
    state: FileTreeState,
    action: FiletreeActionTypes
  ): FileTreeState {
    if (action.type !== "insert_file") {
      return state;
    }

    /**
     * Updates folder contents recursively
     * @function
     * @param {FileTreeObject[]} files - Current files array
     * @param {number} index - Target folder index
     * @param {InsertFilePayload} payload - New file/folder data
     * @returns {FileTreeObject[]} Updated files array
     */
    function updateFolderContent(
      files: FileTreeObject[],
      index: number,
      payload: InsertFilePayload
    ): FileTreeObject[] {
      const updatedPayload: FileTreeObject = {
        id: payload.id,
        index: payload.index,
        type: payload.type,
        name: payload.name,
        contents:
          payload.type === "folder"
            ? (payload.contents as FileTreeObject[]) || []
            : payload.contents || JSON.stringify(defaultContent),
        edges: payload.edges || [],
      };

      return files.map((item: FileTreeObject) => {
        if (item.type === "folder") {
          if (item.id === index) {
            return {
              ...item,
              contents: [
                ...(item.contents as FileTreeObject[]),
                updatedPayload,
              ],
            };
          } else {
            return {
              ...item,
              contents: updateFolderContent(
                item.contents as FileTreeObject[],
                index,
                updatedPayload
              ),
            };
          }
        }
        return item;
      });
    }

    try {
      if (action.selectIndex === -1) {
        const updatedPayload: FileTreeObject = {
          ...action.payload,
          contents:
            action.payload.type === "folder"
              ? (action.payload.contents as FileTreeObject[]) || []
              : action.payload.contents || JSON.stringify(defaultContent),
        };
        return {
          state: [
            ...(Array.isArray(state.state) ? state.state : []),
            updatedPayload,
          ],
        };
      }

      return {
        state: updateFolderContent(
          Array.isArray(state.state) ? state.state : [],
          action.selectIndex,
          action.payload
        ),
      };
    } catch (error) {
      console.error("Error in create_file:", error);
      return state || [];
    }
  }

  /**
   * Handles saving file content and edges
   * @function
   * @param {FileTreeState} state - Current file tree state
   * @param {FiletreeActionTypes} action - Save action payload
   * @returns {FileTreeState} Updated file tree state
   */
  function save_file(
    state: FileTreeState,
    action: FiletreeActionTypes
  ): FileTreeState {
    if (action.type !== "save_file") {
      return state;
    }
    const { index, contents, edges } = action.payload;

    const updatedFiles = state.state.map((item: FileTreeObject) => {
      if (item.type === "file" && item.id === index) {
        const currentEdges = item.edges || [];
        const newEdges = edges || [];

        const mergedEdges = [
          ...currentEdges,
          ...newEdges.filter(
            (newEdge: any) =>
              !currentEdges.some(
                (existingEdge) =>
                  existingEdge.source === newEdge.source &&
                  existingEdge.target === newEdge.target
              )
          ),
        ];

        const deepCopyContents = JSON.parse(
          JSON.stringify(contents || item.contents)
        );

        return {
          ...item,
          contents: deepCopyContents,
          edges: mergedEdges,
        };
      } else if (item.type === "folder") {
        return {
          ...item,
          contents: save_file(
            { state: item.contents as FileTreeObject[] },
            action
          ).state,
        };
      }
      return item;
    });

    return { ...state, state: updatedFiles };
  }

  /**
   * Handles file and folder deletion
   * @function
   * @param {FileTreeState} state - Current file tree state
   * @param {FiletreeActionTypes} action - Delete action payload
   * @returns {FileTreeState} Updated file tree state
   */
  function delete_file(
    state: FileTreeState,
    action: FiletreeActionTypes
  ): FileTreeState {
    if (action.type !== "delete_file") {
      return state;
    }
    const {
      index,
      editorIndex,
      setEditor: setEditorIndex,
      setSelectFileLocation: setFileLocation,
    } = action.payload;

    /**
     * Checks and resets editor if deleted file is being edited
     * @function
     * @param {FileTreeObject[]} folders - Folders to check
     */
    const checkEditor = (folders: FileTreeObject[]) => {
      folders.forEach((item: FileTreeObject) => {
        if (item.type === "file" && item.id === editorIndex.index) {
          setEditorIndex({ index: -1, contents: "", name: "" });
          setFileLocation([""]);
        } else if (item.type === "folder") {
          checkEditor(item.contents as FileTreeObject[]);
        }
      });
    };

    /**
     * Checks if a folder contains the file being edited
     * @function
     * @param {FileTreeObject} item - Item to check
     * @returns {boolean} Whether folder contains edited file
     */
    function checkFolderContents(item: FileTreeObject): boolean {
      if (item.type === "file") {
        return item.id === editorIndex.index;
      } else if (item.type === "folder") {
        const contents = item.contents as FileTreeObject[];
        return contents.some((child) => checkFolderContents(child));
      }
      return false;
    }

    try {
      if (editorIndex?.index === index) {
        setEditorIndex([-1, "", ""]);
        setFileLocation([""]);
      } else if (Array.isArray(state.state)) {
        const itemToDelete = state.state.find((item) => item.id === index);
        if (itemToDelete && itemToDelete.type === "folder") {
          if (checkFolderContents(itemToDelete)) {
            setEditorIndex([-1, "", ""]);
            setFileLocation([""]);
          }
        }
      }

      /**
       * Recursively filters out deleted files/folders
       * @function
       * @param {FileTreeObject[]} items - Items to filter
       * @returns {FileTreeObject[]} Filtered items
       */
      const filterItems = (items: FileTreeObject[]): FileTreeObject[] => {
        return items
          .map((item: FileTreeObject) => {
            if (item.type === "folder") {
              const filteredContents = filterItems(
                item.contents as FileTreeObject[]
              );
              return {
                ...item,
                contents: filteredContents,
              };
            }
            return item;
          })
          .filter((item: FileTreeObject) => {
            return item.id !== index;
          });
      };

      const newFiles = filterItems(state.state);

      return {
        ...state,
        state: newFiles,
      };
    } catch (error) {
      console.error("Error in delete_file:", error);
      return state;
    }
  }

  /**
   * Handles index sorting and file tree reorganization
   * @function
   * @param {FileTreeState} state - Current state
   * @param {FiletreeActionTypes} action - Sort action payload
   * @returns {FileTreeState} Updated state
   */
  function sort_index(
    state: FileTreeState,
    action: FiletreeActionTypes
  ): FileTreeState {
    const startTime = performance.now();

    if (action.type !== "sort_index") return state;

    const {
      editorIndex,
      setEditorIndex,
      selectIndex,
      setSelectIndex,
      selectFileLocation,
      setSelectFileLocation,
    } = action.payload;
    action.fileFound = false;

    /**
     * Alphabetizes files within their folders
     * @function
     * @param {FileTreeObject[]} files - Files to sort
     * @returns {FileTreeObject[]} Sorted files
     */
    const alphabetizeFiles = (files: FileTreeObject[]): FileTreeObject[] => {
      /**
       * Sorts files in current directory
       * @function
       * @param {FileTreeObject[]} files - Files to sort
       * @returns {FileTreeObject[]} Sorted files
       */
      const sorted_dir = (files: FileTreeObject[]) =>
        files
          .filter((file): file is FileTreeObject => {
            if ("newFileData" in file) {
              const newFileData = (file as any).newFileData;
              return (
                newFileData &&
                typeof newFileData === "object" &&
                "name" in newFileData &&
                "type" in newFileData
              );
            }
            return (
              "name" in file &&
              "type" in file &&
              typeof file.name === "string" &&
              typeof file.type === "string"
            );
          })
          .map((file) => {
            if ("newFileData" in file) {
              const newFileData = (file as any).newFileData;
              return {
                id: newFileData.id || Date.now(),
                type: newFileData.type,
                name: newFileData.name,
                contents: newFileData.contents || "",
                edges: newFileData.edges || [],
              } as FileTreeObject;
            }
            return file;
          })
          .sort((a: FileTreeObject, b: FileTreeObject) => {
            return a.name.localeCompare(b.name);
          });

      const sorted_root = sorted_dir(files);

      return sorted_root.map((item: FileTreeObject) => {
        if (item.type === "folder" && Array.isArray(item.contents)) {
          return {
            ...item,
            contents: alphabetizeFiles(item.contents),
          };
        }
        return item;
      });
    };
    /**
     * Gets the folder path for a selected file
     * @function
     * @param {FileTreeObject[]} fileTreeObjects - File tree to search
     * @param {number} selectedIndex - Index of selected file
     * @returns {string[]} Array of folder names in path
     */
    function getFilePath(
      fileTreeObjects: FileTreeObject[],
      selectedIndex: number
    ): string[] {
      let fileFound = false;
      let filePath: string[] = [];

      const mapFileTree = (objects: FileTreeObject[]): string[] => {
        function mapFolders(objects: FileTreeObject[]): string[] {
          objects.forEach((obj: FileTreeObject): any => {
            if (!fileFound) {
              if (obj.type === "file") {
                if (obj.id === selectedIndex && !fileFound) {
                  fileFound = true;
                }
              } else {
                filePath = [...filePath, obj.name];
                const folderContent: FileTreeObject[] = [
                  ...(obj.contents as FileTreeObject[]),
                ];
                mapFolders(folderContent);
                if (!fileFound) {
                  filePath.pop();
                }
              }
            } else {
              return;
            }
          });
          return filePath;
        }
        return mapFolders(objects);
      };
      return mapFileTree(fileTreeObjects);
    }

    /**
     * Sorts and reindexes the file tree
     * @function
     * @param {FileTreeState} state - Current state
     * @param {FiletreeActionTypes} action - Sort action payload
     * @returns {FileTreeObject[]} Sorted and reindexed files
     */
    function sortFiles(
      state: FileTreeState,
      action: FiletreeActionTypes
    ): FileTreeObject[] {
      const fileMap: FileTreeObject[] = state.state.map(
        (item: FileTreeObject) => {
          if (item.type === "file") {
            action.count! += 1;
            const currentCount = action.count!;

            if (editorIndex && editorIndex.index === item.index) {
              setEditorIndex({
                index: currentCount,
                contents: editorIndex.contents,
                name: editorIndex.name,
              });
            }

            if (selectIndex && selectIndex.index === item.index) {
              setSelectIndex({
                index: currentCount,
                content_name: selectIndex.content_name,
              });
            }

            return {
              ...item,
              index: currentCount,
            };
          } else if (item.type === "folder") {
            action.count! += 1;
            const currentCount = action.count!;

            const sortedContent = sortFiles(
              { state: item.contents as FileTreeObject[] },
              action
            );

            return {
              ...item,
              index: currentCount,
              contents: sortedContent,
            };
          }

          return {
            ...item,
            id: action.count! + 1,
            index: action.count! + 1,
          };
        }
      );

      try {
        return fileMap.map((file) => ({
          ...file,
          contents:
            file.type === "folder"
              ? sortFiles({ state: file.contents as FileTreeObject[] }, action)
              : file.contents,
        }));
      } catch (error) {
        console.error("Error in sort_index:", error);
        return state.state;
      }
    }

    // First alphabetize the files
    const alphabetized = alphabetizeFiles(state.state);
    let newPath: string[] = [];
    if (editorIndex && editorIndex.index !== -1) {
      newPath = getFilePath(alphabetized, editorIndex.index);
      // Don't call setSelectFileLocation here
    }

    // Then sort and reindex them
    const sorted = sortFiles({ state: alphabetized }, action);

    return {
      state: sorted,
    };
  }

  /**
   * Main reducer switch statement for handling file tree actions
   * @function
   */
  switch (action.type) {
    default:
      return state;

    case "get_files": {
      const startTime = performance.now();
      try {
        const { files } = (action as GetFilesAction).payload;

        console.log({
          message: "Processing get_files action",
          level: "DEBUG",
          metadata: {
            fileCount: files.length,
            dataTypes: files.map((f) => ({ name: f.name, type: f.type })),
          },
        });

        return { state: files };
      } catch (error: any) {
        console.error({
          message: "get_files action failed",
          level: "ERROR",
          metadata: {
            error: error.message,
            stack: error.stack,
          },
        });
        return state;
      } finally {
        console.log({
          message: "get_files operation completed",
          level: "DEBUG",
          metadata: {
            executionTime: performance.now() - startTime,
          },
        });
      }
    }
    case "save_file": {
      const { index, contents, edges } = (action as SaveFileAction).payload;
      return save_file(state, action as SaveFileAction);
    }

    case "insert_file": {
      const { id, index, type, name, contents, edges } = (
        action as InsertFileAction
      ).payload;
      return create_file(state, action as InsertFileAction);
    }

    case "rename_file": {
      const { index, newName } = (action as RenameFileAction).payload;
      return rename_file(state, action as RenameFileAction);
    }

    case "delete_file": {
      const { index, editorIndex, setEditor, setSelectFileLocation } = (
        action as DeleteFileAction
      ).payload;
      return delete_file(state, action as DeleteFileAction);
    }

    case "sort_index": {
      const {
        editorIndex,
        setEditorIndex,
        selectIndex,
        setSelectIndex,
        selectFileLocation,
        setSelectFileLocation,
      } = (action as SortIndexAction).payload;
      return sort_index(state, { ...(action as SortIndexAction), count: 0 });
    }
  }
}

/**
 * Default Lexical editor content structure
 * @constant
 * @type {string}
 */
const fileContents: any = {
  root: {
    children: [
      {
        children: [
          {
            detail: 0,
            format: 0,
            mode: "normal",
            style: "",
            text: "Please enjoy -Ian.",
            type: "text",
            version: 1,
          },
        ],
        direction: "ltr",
        format: "",
        indent: 0,
        type: "paragraph",
        version: 1,
      },
    ],
    direction: "ltr",
    format: "",
    indent: 0,
    type: "root",
    version: 1,
  },
};

/**
 * @component
 * @remarks
 * Manages file tree state, providing context for file operations
 * Features:
 * - File and folder management
 * - State persistence
 * - Recursive file tree operations
 *
 * @param {Object} props - Component properties
 * @param {ReactNode} props.children - Child components to render
 * @returns {JSX.Element} File tree context provider
 * @see useFiletreeContext
 * @see useSortIndexContext
 */
const FileTreeContextProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  /** Reducer state and dispatch for file tree operations */
  const [state, dispatch] = useReducer(
    (state: FileTreeState, action: FiletreeActionTypes) =>
      reducer(state, action),
    { state: [] }
  );

  /** State for triggering index sort operations */
  const [indexSort, setIndexSort] = useState<boolean>(false);

  /** Auth0 user context */
  const { user, isLoading } = useUser();

  /** Editor and selection contexts */
  const { selectedEditIndex, setSelectedEditIndex } = useSelectedEditContext();
  const { selectedIndex, setSelectedIndex } = useSelectedIndexContext();
  const { fileLocation, setFileLocation } = useFileLocationContext();
  const { graphState, graphDispatch } = useKnowledgeGraphContext();
  const { addLogs } = useLogger();
  const renderCount = useRef(0);

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
          metadata: { ...metadata, renderCount: renderCount.current },
        });
      } catch (error: any) {
        console.error("Log submission error", error.message);
      }
    },
    [addLogs]
  );

  /**
   * Effect for handling index sort operations
   * @effect
   */
  useEffect(() => {
    if (indexSort) {
      try {
        const result = dispatch({
          type: "sort_index",
          payload: {
            editorIndex: selectedEditIndex,
            setEditorIndex: setSelectedEditIndex,
            selectIndex: selectedIndex,
            setSelectIndex: setSelectedIndex,
            selectFileLocation: fileLocation,
            setSelectFileLocation: setFileLocation,
          },
        });
      } catch (error: any) {
        handleLogger({
          message: `Error in sort_index: ${error.message}`,
          level: "ERROR",
        });
      } finally {
        handleLogger({ message: "Sort operation completed", level: "DEBUG" });
      }
      setIndexSort(false);
    }
  }, [
    indexSort,
    fileLocation,
    selectedEditIndex,
    selectedIndex,
    setFileLocation,
    setSelectedEditIndex,
    setSelectedIndex,
    handleLogger,
  ]);

  useEffect(() => {
    handleLogger({
      message: "FiletreeContextProvider mounted.",
      level: "INFO",
    });
    renderCount.current += 1;
  }, [handleLogger]);

  /**
   * Effect for initializing file tree data
   * @effect
   */
  useEffect(() => {
    /**
     * Fetches file tree data from database
     * @async
     */
    const getData = async () => {
      const startTime = performance.now();
      try {
        await addLogs({
          message: "Starting file tree data fetch",
          level: "DEBUG",
          metadata: { user },
        });

        const response = await fetch("/api/db", { method: "GET" });
        if (!response.ok) throw new Error(response.statusText);

        if (response.ok) {
          const result = await response.json();
          const parsedData = JSON.parse(result);

          await addLogs({
            message: "File tree data fetched successfully",
            level: "INFO",
            metadata: {
              dataLength: parsedData.length,
              executionTime: performance.now() - startTime,
            },
          });

          const processedData = parsedData.map((file: FileTreeObject) => {
            if (
              file.type === "file" &&
              (!file.contents || Object.keys(file.contents).length === 0)
            ) {
              return { ...file, contents: fileContents };
            }
            return file;
          });

          dispatch({
            type: "get_files",
            selectIndex: 0,
            payload: { files: processedData },
          });
        } else {
          handleLogger({
            message: `Error fetching data: ${response.statusText}`,
            level: "ERROR",
          });
          console.error("Error fetching data");
        }
      } catch (error: any) {
        await addLogs({
          message: "Failed to fetch file tree data",
          level: "ERROR",
          metadata: {
            error: error.message,
            stack: error.stack,
            executionTime: performance.now() - startTime,
          },
        });
        console.error("getData error:", error);
      } finally {
        await addLogs({
          message: "getData operation completed",
          level: "DEBUG",
          metadata: {
            totalExecutionTime: performance.now() - startTime,
          },
        });
      }
    };

    if (user) {
      getData().catch((e: unknown) => {
        handleLogger({
          message: `Uncaught error in getData: ${e instanceof Error ? e.message : String(e)}`,
          level: "ERROR",
        });
      });
    } else {
      const initialFile: FileTreeObject = {
        index: 0,
        id: Date.now(),
        type: "file",
        name: "New File.md",
        contents: fileContents,
        edges: [],
      };

      dispatch({
        type: "get_files",
        selectIndex: 0,
        payload: {
          files: [initialFile],
        },
      });

      const initialNode: Node = {
        id: initialFile.id.toString(),
        label: initialFile.name,
        x: 0,
        y: 0,
        z: 0,
      };

      graphDispatch &&
        graphDispatch({
          type: "get_nodes",
          payload: initialNode,
        });
    }

    setIndexSort(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, graphDispatch]);

  useEffect(() => {
    renderCount.current += 1;
  }, []);

  return (
    <>
      {!isLoading && (
        <FileTreeContext.Provider value={{ state: state.state, dispatch }}>
          <IndexSortContext.Provider value={{ indexSort, setIndexSort }}>
            {children}
          </IndexSortContext.Provider>
        </FileTreeContext.Provider>
      )}
    </>
  );
};

export default FileTreeContextProvider;

/**
 * @title File Tree Context Hook
 * @remarks
 * Provides access to file tree context and dispatch methods
 *
 * @returns {FileTreeState} File tree context value
 * @throws {Error} If used outside of FileTreeContextProvider
 *
 * @example
 * const { state, dispatch } = useFiletreeContext();
 */
export function useFiletreeContext() {
  const context = useContext(FileTreeContext);
  if (context === undefined) {
    throw new Error(
      "useFileTreeContext must be used within a FileTreeContextProvider"
    );
  }
  return context;
}

/**
 * Hook for accessing index sort context
 * @hook
 * @returns {IndexSortState} Index sort context value and setter
 * @throws {Error} If used outside of IndexSortContextProvider
 */
export function useSortIndexContext() {
  const context = useContext(IndexSortContext);
  if (context === undefined) {
    throw new Error(
      "useSortIndexContext must be used within a IndexSortContextProvider"
    );
  }
  return context;
}
