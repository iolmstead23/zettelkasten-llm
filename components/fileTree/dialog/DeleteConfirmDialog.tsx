import { Fragment, useRef, useState } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  useDeleteToggleContext,
  useNotifyToggleContext,
} from "components/providers/subproviders/ToggleProvider";
import {
  useFiletreeContext,
  useSortIndexContext,
} from "components/providers/subproviders/FiletreeContextProvider";
import { useNotifyContentContext } from "components/providers/subproviders/NotificationProvider";
import { useSelectedEditContext } from "components/providers/subproviders/SelectedEditIndexProvider";
import { useFileLocationContext } from "components/providers/subproviders/FileLocationProvider";


/**
 * Delete confirmation dialog component
 * @component
 * @example
 * return (
 *   <DeleteItem id={1} />
 * )
 * 
 * @remarks
 * Displays a modal dialog for confirming file/folder deletion
 * Features:
 * - Confirmation message
 * - Delete/Cancel actions
 * - Notification feedback
 * - Auto file tree refresh
 * 
 * @param {object} props
 * @param {number} props.id - ID of the item to delete
 * @returns {JSX.Element} Delete confirmation dialog
 */
const DeleteItem = ({ id }: { id: number }): React.JSX.Element => {
  const { deleteIsOpen, setDeleteIsOpen } = useDeleteToggleContext();
  const sortIndex = useSortIndexContext();
  const fileContext: any = useFiletreeContext();
  const cancelButtonRef = useRef(null);
  const notifyToggle = useNotifyToggleContext();
  const notifyContent = useNotifyContentContext();
  const editorIndex = useSelectedEditContext();
  const [editor] = useLexicalComposerContext();
  const fileLocationContext = useFileLocationContext();
  // State to force re-render
  const [forceRender, setForceRender] = useState(false);

  return (
    <Transition.Root show={deleteIsOpen} as={Fragment} appear={true}>
      <Dialog
        as="div"
        className="relative z-40"
        initialFocus={cancelButtonRef}
        onClose={() => setDeleteIsOpen(false)}
      >
        <Transition.Child
          as={Fragment}
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

        <div className="fixed inset-0 flex items-center justify-center p-4">
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
                  <Dialog.Title className="text-lg font-semibold">
                    Delete Confirmation
                  </Dialog.Title>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">
                      Are you sure you want to delete this item? This action
                      cannot be undone.
                    </p>
                  </div>
                  <div className="mt-2">
                    <div>
                      <label htmlFor="delete" className="sr-only">
                        Delete
                      </label>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="inline-flex w-full justify-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 sm:ml-3 sm:w-auto"
                  onClick={() => {
                    // delete
                    fileContext.dispatch({
                      type: "delete_file",
                      payload: {
                        id: id,
                        editorIndex: editorIndex.selectedEditIndex,
                        setEditor: editorIndex.setSelectedEditIndex,
                        editorContents: editor,
                        setSelectFileLocation:
                          fileLocationContext.setFileLocation,
                      },
                    });
                    // notify user of successful save
                    notifyContent.setNotifyContent({
                      type: "success",
                      message: "Delete success!",
                    });
                    notifyToggle.setNotifyToggle(true);
                    // resort the filetree
                    sortIndex.setIndexSort(true);
                    setDeleteIsOpen(false);
                    // Force re-render so the filetree updates
                    setForceRender(!forceRender);
                  }}
                >
                  Delete
                </button>
                <button
                  type="button"
                  className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
                  onClick={() => {
                    setDeleteIsOpen(false);
                  }}
                  ref={cancelButtonRef}
                >
                  Cancel
                </button>
              </div>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition.Root>
  );
};

export default DeleteItem;
