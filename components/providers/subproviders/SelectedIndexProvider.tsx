import { SelectedIndexState, SelectedIndexType } from "types/types";
import { ReactNode, createContext, useContext, useState } from "react";

const SelectedIndexContext = createContext<SelectedIndexState | undefined>(
  undefined
);

/**
 * Provider for managing file tree selection state
 * @component
 * 
 * @remarks
 * Manages:
 * - Currently selected file/folder in file tree
 * - Selection index and content name
 */
const SelectedIndexProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  /** This stores the state of the file tree selection */
  const [selectedIndex, setSelectedIndex] = useState<SelectedIndexType>({ index: -1, content_name: "" })

  return (
    <>
      <SelectedIndexContext.Provider
        value={{ selectedIndex, setSelectedIndex }}
      >
        {children}
      </SelectedIndexContext.Provider>
    </>
  );
};

export default SelectedIndexProvider;

/** This lets other child components change the file tree selection */
export function useSelectedIndexContext() {
  const context = useContext(SelectedIndexContext);
  if (context === undefined) {
    throw new Error(
      "useSelectedIndexContext must be used within a selectedIndexContextProvider"
    );
  }
  return context;
}
