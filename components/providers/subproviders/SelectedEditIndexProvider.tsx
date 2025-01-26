"use client";

import { useLogger } from "components/logging/LogWrapper";
import {
  LogEntryMetadata,
  LogLevel,
  SelectedEditIndexState,
  SelectedEditIndexType,
} from "types/types";
import {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useState,
  useEffect,
  useMemo,
} from "react";
import { T } from "nextra/dist/types-c8e621b7";

/**
 * Context for managing the currently selected file in the editor
 * @remarks
 * Provides state and methods for tracking which file is currently being edited
 */
const SelectedEditIndexContext = createContext<
  SelectedEditIndexState | undefined
>(undefined);

/**
 * Initial state for the selected edit index
 */
const initialEditState: SelectedEditIndexType = {
  index: -1,
  contents: null,
  name: "",
};

/**
 * Type guard to check if a value is a valid SelectedEditIndexType
 */
function isValidEditIndex(value: any): value is SelectedEditIndexType {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof value.index === "number" &&
    typeof value.name === "string"
  );
}

interface SelectedEditIndexProviderProps {
  children: ReactNode;
  /**
   * Optional callback to be called when selection changes
   */
  onSelectionChange?: (selection: SelectedEditIndexType) => void;
}

/**
 * Provider component for managing editor file selection state
 * @param props - Component props including children and optional callbacks
 * @returns Provider component wrapping children
 */
const SelectedEditIndexContextProvider: React.FC<
  SelectedEditIndexProviderProps
> = ({ children, onSelectionChange }) => {
  const [selectedEditIndex, setSelectedEditIndex] =
    useState<SelectedEditIndexType>(initialEditState);
  const [selectionHistory, setSelectionHistory] = useState<
    SelectedEditIndexType[]
  >([initialEditState]);

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
          metadata: { ...metadata, component: "SelectedEditIndexProvider" },
        });
      } catch (error: any) {
        console.error("Log submission error", error.message);
      }
    },
    [addLogs]
  );

  useEffect(() => {
    if (onSelectionChange) {
      onSelectionChange(selectedEditIndex);
    }
  }, [selectedEditIndex, onSelectionChange]);

  useEffect(() => {
    handleLogger({
      message: "SelectedEditIndexProvider mounted",
      level: "INFO",
    });
  }, [handleLogger]);

  /**
   * Validates and sanitizes the input value for the editor selection
   */
  const validateAndSanitize = useCallback(
    (value: SelectedEditIndexType): SelectedEditIndexType | null => {
      if (!isValidEditIndex(value)) {
        handleLogger({
          message: "Invalid edit index provided",
          level: "ERROR",
          metadata: { value: value },
        });
        return initialEditState;
      }

      return {
        index: Number(value.index),
        contents: value.contents,
        name: String(value.name || "").trim(),
      };
    },
    []
  );

  /**
   * Safely updates the selected edit index with validation
   */
  const safeSetSelectedEditIndex = useCallback(
    (newValue: SelectedEditIndexType) => {
      try {
        const sanitizedValue = validateAndSanitize(newValue);

        setSelectedEditIndex(sanitizedValue!);
        setSelectionHistory((prev: T) => [...prev, sanitizedValue]);

        return true;
      } catch (error) {
        console.error("Error setting selected edit index:", error);
        return false;
      }
    },
    [validateAndSanitize]
  );

  /**
   * Clears the current selection
   */
  const clearSelection = useCallback(() => {
    setSelectedEditIndex(initialEditState);
    setSelectionHistory((prev) => [...prev, initialEditState]);
  }, []);

  /**
   * Returns to the previous selection
   */
  const goToPreviousSelection = useCallback(() => {
    if (selectionHistory.length > 1) {
      setSelectionHistory((prev) => {
        const newHistory = [...prev];
        newHistory.pop(); // Remove current
        const previousSelection = newHistory[newHistory.length - 1];
        setSelectedEditIndex(previousSelection);
        return newHistory;
      });
      return true;
    }
    return false;
  }, [selectionHistory]);

  /**
   * Checks if the current selection is valid
   */
  const isValidSelection = useCallback(() => {
    return selectedEditIndex.index !== -1 && selectedEditIndex.name !== "";
  }, [selectedEditIndex]);

  const contextValue = useMemo(
    () => ({
      selectedEditIndex,
      setSelectedEditIndex: safeSetSelectedEditIndex,
      clearSelection,
      goToPreviousSelection,
      isValidSelection,
      selectionHistory,
    }),
    [
      selectedEditIndex,
      safeSetSelectedEditIndex,
      clearSelection,
      goToPreviousSelection,
      isValidSelection,
      selectionHistory,
    ]
  );

  return (
    <SelectedEditIndexContext.Provider value={contextValue}>
      {children}
    </SelectedEditIndexContext.Provider>
  );
};

export default SelectedEditIndexContextProvider;

/**
 * Hook for accessing the selected edit index context
 * @returns Context object containing selection state and management methods
 * @throws Error if used outside of SelectedEditIndexContextProvider
 */
export function useSelectedEditContext() {
  const context = useContext(SelectedEditIndexContext);
  if (context === undefined) {
    throw new Error(
      "useSelectedEditContext must be used within a SelectedEditIndexContextProvider"
    );
  }
  return context;
}
