"use client";

import { LexicalComposer } from "@lexical/react/LexicalComposer";
import React, { Dispatch, ReactNode, SetStateAction, useCallback } from "react";
import {
  FileTreeObject,
  DeleteFileAction,
  InsertFilePayload,
  FiletreeActionTypes,
  KnowledgeGraphActionTypes,
  LogLevel,
  LogEntryMetadata,
} from "types/types";
import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { ListNode, ListItemNode } from "@lexical/list";
import { CodeNode } from "@lexical/code";
import { TableNode, TableCellNode, TableRowNode } from "@lexical/table";
import { AutoLinkNode } from "@lexical/link";
import FileTreeContextProvider, {
  useFiletreeContext,
} from "components/providers/subproviders/FiletreeContextProvider";
import SelectedIndexProvider, {
  useSelectedIndexContext,
} from "components/providers/subproviders/SelectedIndexProvider";
import SelectedEditIndexContextProvider, {
  useSelectedEditContext,
} from "components/providers/subproviders/SelectedEditIndexProvider";
import ToggleProvider from "components/providers/subproviders/ToggleProvider";
import NotificationProvider from "components/providers/subproviders/NotificationProvider";
import KnowledgeGraphProvider, {
  useKnowledgeGraphContext,
} from "components/providers/subproviders/KnowledgeGraphProvider";
import FileLocationProvider, {
  useFileLocationContext,
} from "components/providers/subproviders/FileLocationProvider";
import { SaveProvider } from "components/providers/subproviders/SaveProvider";
import { EdgeNode } from "components/editor/EdgeNode";
import { useLogger } from "components/logging/LogWrapper";

/**
 * Dispatches combined actions for file tree and graph state
 *
 * @param {React.Dispatch<FiletreeActionTypes>} fileDispatch - File tree dispatch function
 * @param {React.Dispatch<KnowledgeGraphActionTypes>} graphDispatch - Graph dispatch function
 * @param {FiletreeActionTypes} fileAction - File tree action
 * @param {KnowledgeGraphActionTypes} graphAction - Graph action
 */
function dispatchCombined(
  fileDispatch: React.Dispatch<FiletreeActionTypes>,
  graphDispatch: React.Dispatch<KnowledgeGraphActionTypes>,
  fileAction: FiletreeActionTypes,
  graphAction: KnowledgeGraphActionTypes
) {
  fileDispatch(fileAction);
  graphDispatch(graphAction);
}

/**
 * Main UI Provider component that wraps application with multiple context providers
 *
 * @param {Object} props - Component properties
 * @param {ReactNode} props.children - Child components to be wrapped
 * @returns {JSX.Element} Nested provider component
 */
const UIProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  /**
   * Initial configuration for Lexical editor
   *
   * @constant
   * @type {Object}
   */
  const initialConfig = {
    namespace: "lexical-editor",
    theme: {
      root: "p-4 min-h-[72.5vh] focus:outline-none outline-none",
      link: "cursor-pointer",
      text: {
        bold: "font-semibold",
        underline: "underline",
        italic: "italic",
        strikethrough: "line-through",
        underlineStrikethrough: "underlined-line-through",
      },
    },
    onError: (error: Error) => {
      console.error(error);
    },
    nodes: [
      HeadingNode,
      QuoteNode,
      ListNode,
      ListItemNode,
      CodeNode,
      TableNode,
      TableCellNode,
      TableRowNode,
      EdgeNode,
      AutoLinkNode,
    ],
  };

  return (
    <FileLocationProvider>
      <SelectedIndexProvider>
        <SelectedEditIndexContextProvider>
          <KnowledgeGraphProvider>
            <FileTreeContextProvider>
              <ToggleProvider>
                <NotificationProvider>
                  <LexicalComposer initialConfig={initialConfig}>
                    <SaveProvider>{children}</SaveProvider>
                  </LexicalComposer>
                </NotificationProvider>
              </ToggleProvider>
            </FileTreeContextProvider>
          </KnowledgeGraphProvider>
        </SelectedEditIndexContextProvider>
      </SelectedIndexProvider>
    </FileLocationProvider>
  );
};

/**
 * Hook for performing combined file tree and knowledge graph operations
 *
 * @returns {Object} Object containing file management methods
 */
export function useCombinedOperations() {
  const filetreeContext = useFiletreeContext();
  const { graphDispatch } = useKnowledgeGraphContext();
  const { selectedIndex } = useSelectedIndexContext();
  const { setSelectedEditIndex } = useSelectedEditContext();
  const { setFileLocation } = useFileLocationContext();

  const fileDispatch = filetreeContext.dispatch;
  const currentFiles = filetreeContext.state;

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
          metadata: { ...metadata, component: "UIProvider" },
        });
      } catch (error: any) {
        console.error("Log submission error", error.message);
      }
    },
    [addLogs]
  );

  /**no
   * Handles adding new files
   * @function
   * @param {Partial<FileTreeObject>} fileData - New file data
   */
  const handleAddFile = useCallback(
    (fileData: Partial<FileTreeObject>) => {
      const newId = Date.now();
      const selectedFolderIndex = selectedIndex.index || -1;

      const completeFileData: InsertFilePayload = {
        index: 0,
        id: newId,
        type: fileData.type || "file",
        name: fileData.name || "New File.md",
        contents: fileData.type === "file" ? fileData.contents || "" : [],
        edges: fileData.edges || [],
      };

      const fileAction: FiletreeActionTypes = {
        type: "insert_file",
        selectIndex: selectedFolderIndex,
        payload: completeFileData,
      };

      const graphAction: KnowledgeGraphActionTypes = {
        type: "insert_node",
        payload: {
          id: newId.toString(),
          label: completeFileData.name,
          x: Math.random() * 10 - 5,
          y: Math.random() * 10 - 5,
          z: Math.random() * 10 - 5,
        },
      };

      try {
        dispatchCombined(
          fileDispatch!,
          graphDispatch!,
          fileAction,
          graphAction
        );
      } catch (error: any) {
        handleLogger({
          message: `Cannot dispatch combined actions for insertion. ${error.message}`,
          level: "ERROR",
        });
      } finally {
        handleLogger({
          message: "Dispatched edge and note insertion.",
          level: "INFO",
        });
      }
    },
    [fileDispatch, graphDispatch, selectedIndex, handleLogger]
  );

  /**
   * Handles deleting files
   * @function
   * @param {number} id - ID of file to delete
   */
  const handleDeleteFile = useCallback(
    (id: number) => {
      const fileAction: DeleteFileAction = {
        type: "delete_file",
        payload: {
          index: id,
          editorIndex: { index: -1, contents: "", name: "" },
          setEditor: setSelectedEditIndex as Dispatch<
            SetStateAction<[number, string, string]>
          >,
          setSelectFileLocation: setFileLocation,
        },
      };

      // // Find the file to get its label and other details
      // const fileToDelete = state.find((file) => file.id === id);

      const graphAction: KnowledgeGraphActionTypes = {
        type: "delete_node",
        payload: {
          id: id.toString(),
        },
      };
      try {
        dispatchCombined(
          fileDispatch!,
          graphDispatch!,
          fileAction,
          graphAction
        );
      } catch (error: any) {
        handleLogger({
          message: `Cannot dispatch combined actions for insertion. ${error.message}`,
          level: "ERROR",
        });
      } finally {
        handleLogger({
          message: "Dispatched edge and note deletion.",
          level: "INFO",
        });
      }
    },
    [
      fileDispatch,
      graphDispatch,
      setSelectedEditIndex,
      setFileLocation,
      handleLogger,
    ]
  );

  /**
   * Handles adding edges between nodes
   * @function
   * @param {string} source - Source node ID
   * @param {string} target - Target node ID
   */
  const handleAddEdge = useCallback(
    (source: string, target: string) => {
      const findFile = (
        files: FileTreeObject[],
        id: string
      ): FileTreeObject | null => {
        for (const file of files) {
          if (file.type === "file" && file.id.toString() === id) {
            return file;
          }
          if (file.type === "folder" && Array.isArray(file.contents)) {
            const foundInFolder = findFile(file.contents, id);
            if (foundInFolder) return foundInFolder;
          }
        }
        return null;
      };

      const sourceFile = findFile(currentFiles, source);
      const targetFile = findFile(currentFiles, target);

      if (!sourceFile || !targetFile) {
        handleLogger({
          message: "Source or target file not found. Cannot add edge.",
          level: "ERROR",
        });
        return;
      }

      const newEdge = { source, target };
      const updateEdges = (file: FileTreeObject) => {
        const currentEdges = file.edges || [];
        const edgeExists = currentEdges.some(
          (edge) =>
            (edge.source === source && edge.target === target) ||
            (edge.source === target && edge.target === source)
        );

        if (!edgeExists) {
          currentEdges.push(newEdge);
        }

        return currentEdges;
      };

      const updatedSourceEdges = updateEdges(sourceFile);
      sourceFile.edges = updatedSourceEdges;

      const updatedTargetEdges = updateEdges(targetFile);
      targetFile.edges = updatedTargetEdges;

      try {
        fileDispatch!({
          type: "save_file",
          payload: {
            index: parseInt(source),
            edges: updatedSourceEdges,
            contents: sourceFile.contents,
          },
        });

        fileDispatch!({
          type: "save_file",
          payload: {
            index: parseInt(target),
            edges: updatedTargetEdges,
            contents: targetFile.contents,
          },
        });
      } catch (error: any) {
        handleLogger({
          message: `Error saving source and target files ${error.message}`,
          level: "ERROR",
        });
      } finally {
        handleLogger({ message: "Dispatched Edge Creation", level: "INFO" });
      }
    },
    [fileDispatch, currentFiles, handleLogger]
  );

  return { handleAddFile, handleDeleteFile, handleAddEdge };
}

export default UIProvider;
