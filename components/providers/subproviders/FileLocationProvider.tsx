"use client";

import { FileLocationContextType, FileLocationState } from "types/types";
import {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

const FileLocationContext = createContext<FileLocationContextType>({
  fileLocation: [],
  setFileLocation: () => {},
});
const FileLocationProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  /** This stores the state of the file location */
  const [fileLocation, setFileLocation] = useState<string[]>([]);

  return (
    <>
      <FileLocationContext.Provider value={{ fileLocation, setFileLocation }}>
        {children}
      </FileLocationContext.Provider>
    </>
  );
};

export default FileLocationProvider;

/** This lets other child components to set the edited files subdirectory folder */
export function useFileLocationContext() {
  const context = useContext(FileLocationContext);
  if (context === undefined) {
    throw new Error(
      "useFileLocationContext must be used within a FileLocationContextProvider"
    );
  }
  return context;
}
