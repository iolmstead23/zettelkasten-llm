import {
  DeleteToggleState,
  NewItemToggleState,
  NotificationToggleState,
  RenameToggleState,
  SaveToggleState,
} from "types/types";
import { ReactNode, createContext, useContext, useState } from "react";

const RenameToggleContext = createContext<RenameToggleState | undefined>(
  undefined
);

const NewItemToggleContext = createContext<NewItemToggleState | undefined>(
  undefined
);

const DeleteToggleContext = createContext<DeleteToggleState | undefined>(
  undefined
);

const SaveToggleContext = createContext<SaveToggleState | undefined>(undefined);

const NotificationToggleContext = createContext<
  NotificationToggleState | undefined
>(undefined);


/**
 * Responsive navigation sidebar component
 * @component
 * @example
 * return (
 *   <Sidebars />
 * )
 * 
 * @remarks
 * Features:
 * - Responsive mobile/desktop layout
 * - Navigation links with icons
 * - Current page highlighting
 * - Collapsible mobile menu
 * 
 * @returns {JSX.Element} Sidebar navigation component
 */
const ToggleProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  /** This stores the toggle state of the Rename Dialog */
  const [renameIsOpen, setRenameIsOpen] = useState<boolean>(false);
  /** This stores the toggle state of the Create Dialog */
  const [newIsOpen, setNewIsOpen] = useState<boolean>(false);
  /** This stores the toggle state of the Delete Dialog */
  const [deleteIsOpen, setDeleteIsOpen] = useState<boolean>(false);
  /** This stores the toggle state of the Save Dialog */
  const [saveIsOpen, setSaveIsOpen] = useState<boolean>(false);

  /** This stores the toggle state of the Notification Box */
  const [notifyToggle, setNotifyToggle] = useState<boolean>(false);
  return (
    <>
      <RenameToggleContext.Provider value={{ renameIsOpen, setRenameIsOpen }}>
        <NewItemToggleContext.Provider value={{ newIsOpen, setNewIsOpen }}>
          <DeleteToggleContext.Provider
            value={{ deleteIsOpen, setDeleteIsOpen }}
          >
            <SaveToggleContext.Provider value={{ saveIsOpen, setSaveIsOpen }}>
              <NotificationToggleContext.Provider
                value={{ notifyToggle, setNotifyToggle }}
              >
                {children}
              </NotificationToggleContext.Provider>
            </SaveToggleContext.Provider>
          </DeleteToggleContext.Provider>
        </NewItemToggleContext.Provider>
      </RenameToggleContext.Provider>
    </>
  );
};

export default ToggleProvider;

/** This lets other child components toggle the rename dialog on and off */
export function useRenameToggleContext() {
  const context = useContext(RenameToggleContext);
  if (context === undefined) {
    throw new Error(
      "useRenameToggleContext must be used within a RenameToggleContextProvider"
    );
  }
  return context;
}

/** This lets other child components toggle the create dialog on and off */
export function useNewItemToggleContext() {
  const context = useContext(NewItemToggleContext);
  if (context === undefined) {
    throw new Error(
      "useNewItemToggleContext must be used within a NewItemToggleContextProvider"
    );
  }
  return context;
}

/** This lets other child components toggle the delete dialog on and off */
export function useDeleteToggleContext() {
  const context = useContext(DeleteToggleContext);
  if (context === undefined) {
    throw new Error(
      "useDeleteToggleContext must be used within a DeleteToggleContextProvider"
    );
  }
  return context;
}

/** This lets other child components toggle the delete dialog on and off */
export function useSaveToggleContext() {
  const context = useContext(SaveToggleContext);
  if (context === undefined) {
    throw new Error(
      "useSaveToggleContext must be used within a DeleteSaveContextProvider"
    );
  }
  return context;
}

/** This lets other child components toggle notification box on and off */
export function useNotifyToggleContext() {
  const context = useContext(NotificationToggleContext);
  if (context === undefined) {
    throw new Error(
      "useNotifyToggleContext must be used within a NotificationToggleContextProvider"
    );
  }
  return context;
}
