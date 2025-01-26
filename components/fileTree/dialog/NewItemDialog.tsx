import { Fragment, useEffect, useRef, useState } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import { useNewItemToggleContext } from "components/providers/subproviders/ToggleProvider";
import { useSortIndexContext } from "components/providers/subproviders/FiletreeContextProvider";
import { useSelectedIndexContext } from "components/providers/subproviders/SelectedIndexProvider";
import { useCombinedOperations } from "components/providers/UIProvider";

/**
 * Dialog component for creating new files and folders
 * @component
 * @example
 * return (
 *   <NewItem />
 * )
 *
 * @remarks
 * Features:
 * - File/folder name input
 * - Type selection (file/folder)
 * - Automatic .md extension for files
 * - Input validation
 * - Auto-sort after creation
 *
 * @returns {JSX.Element} New item creation dialog
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
            text: "Hello, this is the initial state of the editor.",
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
 * New item dialog component
 * @component
 * @returns {JSX.Element} New item dialog
 */
export default function NewItem(): React.JSX.Element {
  /** Context for dialog visibility */
  const { newIsOpen, setNewIsOpen } = useNewItemToggleContext();

  /** Context for index sorting */
  const sortIndex = useSortIndexContext();

  /** Context for selection management */
  const selectionIDContext = useSelectedIndexContext();

  /** Reference for cancel button focus */
  const cancelButtonRef = useRef(null);

  /** State for new item name */
  const [newName, setNewName] = useState<string>("");

  /** State for item type (file/folder) */
  const [newType, setNewType] = useState<string>("File");

  /** Combined operations hook */
  const { handleAddFile } = useCombinedOperations();

  /**
   * Handles input changes for new item name
   * @function
   * @param {React.ChangeEvent<HTMLInputElement>} event - Input change event
   */
  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setNewName(event.target.value);
  };

  /**
   * Handles changes for item type selection
   * @function
   * @param {React.ChangeEvent<HTMLSelectElement>} event - Select change event
   */
  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setNewType(event.target.value);
  };

  /**
   * Handles creation of new item
   * @function
   */
  const handleCreateItem = () => {
    const fileName = newName || "New File";

    if (newType === "File") {
      const fileData = {
        type: "file",
        name: fileName.endsWith(".md") ? fileName : `${fileName}.md`,
        contents: fileContents, // Direct object, not array
        selectIndex: selectionIDContext.selectedIndex.index,
      };

      handleAddFile(fileData);
    } else {
      const folderData = {
        type: "folder",
        name: newName || "New Folder",
        contents: [],
        selectIndex: selectionIDContext.selectedIndex.index,
      };

      handleAddFile(folderData);
    }

    sortIndex.setIndexSort(true);
    setNewIsOpen(false);
  };

  /**
   * Effect for monitoring dialog state changes
   */
  useEffect(() => {
    console.log("New dialog State Changed:", newIsOpen);
  }, [newIsOpen]);

  return (
    <Transition.Root show={newIsOpen} as={Fragment}>
      <Dialog
        as="div"
        className="relative z-40"
        initialFocus={cancelButtonRef}
        onClose={() => setNewIsOpen(false)}
      >
        <Transition.Child
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-gray-500 bg-opacity-75"
            aria-hidden="true"
          />
        </Transition.Child>

        <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                    <ExclamationTriangleIcon
                      className="h-6 w-6 text-red-600"
                      aria-hidden="true"
                    />
                  </div>
                  <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                    <Dialog.Title
                      as="h3"
                      className="text-base font-semibold leading-6 text-gray-900"
                    >
                      Create New
                    </Dialog.Title>
                    <div className="mt-2">
                      <div className=" flex items-center">
                        <label htmlFor="new" className="sr-only">
                          Add file or folder name without extension
                        </label>
                        <input
                          type="text"
                          name="new"
                          id="new"
                          className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                          placeholder="Filename"
                          onChange={handleInputChange}
                        />

                        <div className="px-2">
                          <select
                            id="type"
                            name="type"
                            className="block min-w-fit rounded-md border-0 py-1.5 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm sm:leading-6"
                            defaultValue="File"
                            onChange={handleChange}
                          >
                            <option>File</option>
                            <option>Folder</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                  <button
                    type="button"
                    className="inline-flex w-full justify-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 sm:ml-3 sm:w-auto"
                    onClick={handleCreateItem}
                  >
                    Create {newType}
                  </button>

                  <button
                    type="button"
                    className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
                    onClick={() => setNewIsOpen(false)}
                    ref={cancelButtonRef}
                  >
                    Cancel
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
