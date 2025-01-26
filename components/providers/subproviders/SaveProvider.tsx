"use client";

import {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useState,
} from "react";
import {
  useSelectedEditContext,
} from "components/providers/subproviders/SelectedEditIndexProvider";
import { useFiletreeContext } from "components/providers/subproviders/FiletreeContextProvider";
import {
  FileTreeObject,
  LogEntryMetadata,
  LogLevel,
  SaveType,
} from "types/types";
import { useNotifyContentContext } from "components/providers/subproviders/NotificationProvider";
import { useNotifyToggleContext } from "components/providers/subproviders/ToggleProvider";
import { useLogger } from "components/logging/LogWrapper";

/**
 * Context for managing the save state of files
 * @remarks
 * Provides state and methods for tracking whether files have unsaved changes
 * and when they were last saved
 */
const SaveStateContext = createContext<{
  saveState: SaveType;
  setSaveState: React.Dispatch<React.SetStateAction<SaveType>>;
  getSavedContent: (fileIndex: number) => any;
}>({
  saveState: {
    saveIsCurrent: true,
    lastSaveDate: null,
  },
  setSaveState: () => {},
  getSavedContent: () => {},
});

/**
 * Context for triggering file save operations
 * @remarks
 * Provides methods for saving file contents to the file tree
 */
const SaveTriggerContext = createContext<
  | {
      saveFile: () => Promise<void>;
    }
  | undefined
>(undefined);

/**
 * Provider component that manages file saving functionality
 * @param props - Component props
 * @param props.children - Child components that will have access to save contexts
 * @returns Provider component wrapping children with save state management
 */
export const SaveProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const { selectedEditIndex, setSelectedEditIndex } = useSelectedEditContext();
  const { notifyContent, setNotifyContent } = useNotifyContentContext();
  const { notifyToggle, setNotifyToggle } = useNotifyToggleContext();
  const { state, dispatch } = useFiletreeContext();
  const [saveState, setSaveState] = useState<SaveType>({
    saveIsCurrent: true,
    lastSaveDate: null,
  });
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
          metadata: { ...metadata, component: "SaveProvider" },
        });
      } catch (error: any) {
        console.error("Log submission error", error.message);
      }
    },
    [addLogs]
  );

  /**
   * Saves the currently selected file's contents to the file tree
   * @remarks
   * - Updates the file contents in the file tree
   * - Updates the save state
   * - Shows a notification on success/failure
   * @returns Promise that resolves when save is complete
   */
  const saveFile = useCallback(async () => {
    try {
      if (selectedEditIndex.index === -1) {
        handleLogger({
          message: "No file selected to save",
          level: "WARN",
        });
        return;
      }

      dispatch!({
        type: "save_file",
        payload: {
          index: selectedEditIndex.index,
          contents: selectedEditIndex.contents,
          edges: [],
        },
      });

      handleLogger({
        message: "File saved successfully",
        level: "INFO",
        metadata: {
          fileName: selectedEditIndex.name,
        },
      });

      // Update save state immediately
      setSaveState({
        saveIsCurrent: true,
        lastSaveDate: new Date(),
      });

      handleLogger({
        message: "Save state updated",
        level: "INFO",
        metadata: {
          saveIsCurrent: true,
          lastSaveDate: new Date(),
        },
      });

      setNotifyContent({ type: "success", message: "Save success!" });
      setNotifyToggle(true);
    } catch (error: any) {
      handleLogger({
        message: "Save failed",
        level: "ERROR",
        metadata: {
          error: error.message,
          fileName: selectedEditIndex.name,
        },
      });
      setNotifyContent({ type: "error", message: "Save failed" });
    } finally {
      setNotifyContent({ type: "success", message: "Save success!" });
      setNotifyToggle(true);
    }
  }, [
    selectedEditIndex,
    dispatch,
    setNotifyContent,
    setNotifyToggle,
    setSaveState,
    handleLogger,
  ]);

  const getSavedContent = useCallback((fileIndex: number) => {
    const findFileContent = (files: FileTreeObject[]): any => {
      for (const file of files) {
        if (file.id === fileIndex) {
          return file.contents;
        }
        if (file.type === "folder") {
          const result = findFileContent(file.contents as FileTreeObject[]);
          if (result) return result;
        }
      }
      return null;
    };

    return findFileContent(state);
  }, []);

  return (
    <>
      <SaveStateContext.Provider
        value={{
          saveState,
          setSaveState,
          getSavedContent,
        }}
      >
        <SaveTriggerContext.Provider value={{ saveFile }}>
          {children}
        </SaveTriggerContext.Provider>
      </SaveStateContext.Provider>
    </>
  );
};

/**
 * Hook for accessing file save trigger functionality
 * @returns Context object containing the saveFile method
 * @throws Error if used outside of SaveProvider
 */
export function useSaveContext() {
  const context = useContext(SaveTriggerContext);
  if (context === undefined) {
    throw new Error("useSaveContext must be used within a SaveContextProvider");
  }
  return context;
}

/**
 * Hook for accessing file save state
 * @returns Context object containing save state and management methods
 * @throws Error if used outside of SaveProvider
 */
export function useSaveStateContext() {
  const context = useContext(SaveStateContext);
  if (context === undefined) {
    throw new Error(
      "useSaveStateContext must be used within a SaveStateContextProvider"
    );
  }
  return context;
}
