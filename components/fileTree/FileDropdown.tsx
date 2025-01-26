"use client";

import { Fragment, useCallback, useEffect, useState } from "react";
import { Menu, Transition } from "@headlessui/react";
import { ChevronDownIcon } from "@heroicons/react/20/solid";
import { useSelectedEditContext } from "components/providers/subproviders/SelectedEditIndexProvider";
import {
  useDeleteToggleContext,
  useRenameToggleContext,
  useSaveToggleContext,
} from "components/providers/subproviders/ToggleProvider";
import { useFileLocationContext } from "components/providers/subproviders/FileLocationProvider";
import {
  useFiletreeContext,
  useSortIndexContext,
} from "components/providers/subproviders/FiletreeContextProvider";
import { useSaveStateContext } from "components/providers/subproviders/SaveProvider";
import SaveDialogueItem from "components/fileTree/dialog/SaveConfirmDialog";
import { useLogger } from "components/logging/LogWrapper";
import { LogEntryMetadata, LogLevel, SelectedEditIndexType } from "types/types";
import { EditorState, LexicalEditor, SerializedEditorState } from "lexical";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
/**
 * Utility function for combining class names
 * @function
 * @param {...string} classes - CSS class names to combine
 * @returns {string} Combined class names
 */
function classNames(...classes: any) {
  return classes.filter(Boolean).join(" ");
}

interface ValidationResult {
  isValid: boolean;
  statesMatch: boolean;
  error?: string;
}

/**
 * Validates file contents and editor state structure
 * @remarks Uses Lexical's built-in validation to check state structure
 *
 * @param contents - File contents to validate
 * @param editor - Current editor instance
 * @returns Validation result with status and comparison
 */
export function validateEditorContent(
  contents: SerializedEditorState,
  editor: LexicalEditor
): ValidationResult {
  try {
    // Check if contents has valid Lexical structure
    const isValidStructure =
      contents?.root?.children?.length >= 0 &&
      contents?.root?.type === "root" &&
      contents?.root?.direction;

    if (!isValidStructure) {
      return {
        isValid: false,
        statesMatch: false,
        error: "Invalid Lexical content structure",
      };
    }

    // Parse contents into editor state for comparison
    const newState = editor.parseEditorState(contents);
    const currentState = editor.getEditorState();

    // Compare states using Lexical's internal comparison
    const statesMatch =
      currentState.isEmpty() ||
      JSON.stringify(currentState.toJSON()) ===
        JSON.stringify(newState.toJSON());

    return {
      isValid: true,
      statesMatch,
      error: statesMatch ? undefined : "States do not match",
    };
  } catch (error: any) {
    return {
      isValid: false,
      statesMatch: false,
      error: `Validation failed: ${error.message}`,
    };
  }
}

/**
 * File dropdown menu component
 * @component
 * @param {Object} props - Component props
 * @param {number} props.index - File index
 * @param {any} props.data - File data
 * @param {string} props.name - File name
 * @returns {JSX.Element} File dropdown menu
 */
export default function FileDropdown({
  data,
}: {
  data: SelectedEditIndexType;
}): React.JSX.Element {
  const { selectedEditIndex, setSelectedEditIndex } = useSelectedEditContext();
  const { renameIsOpen, setRenameIsOpen } = useRenameToggleContext();
  const { deleteIsOpen, setDeleteIsOpen } = useDeleteToggleContext();
  const { fileLocation, setFileLocation } = useFileLocationContext();
  const { indexSort, setIndexSort } = useSortIndexContext();
  const { state, dispatch } = useFiletreeContext();
  const { saveState, setSaveState, getSavedContent } = useSaveStateContext();
  const { saveIsOpen, setSaveIsOpen } = useSaveToggleContext();
  const { addLogs } = useLogger();
  const [editor] = useLexicalComposerContext();

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
        addLogs({
          message,
          level,
          metadata: { ...metadata, component: "FileDropdown" },
        });
      } catch (error: any) {
        console.error("Log submission error", error.message);
      }
    },
    [addLogs]
  );

  /**
   * State for pending file switch operation
   * @state
   */
  const [pendingFileSwitch, setPendingFileSwitch] = useState<{
    index: number;
    contents: any;
    name: string;
  } | null>(null);

  const checkUnsavedChanges = (
    currentFile: SelectedEditIndexType,
    editorState: EditorState
  ) => {
    const currentContent = JSON.stringify(editorState?.toJSON());
    const savedContent = JSON.stringify(getSavedContent(currentFile.index));
    const hasUnsavedChanges = currentContent !== savedContent;

    handleLogger({
      message: "File content validation",
      level: "DEBUG",
      metadata: {
        currentContent,
        savedContent,
        hasUnsavedChanges,
      },
    });

    if (!currentFile || selectedEditIndex.index === -1) {
      handleLogger({
        message: "No file currently open in editor",
        level: "DEBUG",
        metadata: {
          component: "FileDropdown",
          selectedEditIndex: currentFile,
        },
      });
      return false;
    }

    if (editorState.isEmpty()) {
      handleLogger({
        message: "File content validation - Empty editor",
        level: "DEBUG",
        metadata: {
          fileIndex: currentFile?.index,
          fileName: currentFile?.name,
          hasUnsavedChanges,
        },
      });
      return false;
    }

    try {
      if (hasUnsavedChanges) {
        handleLogger({
          message: "File content validation - Unsaved changes",
          level: "DEBUG",
          metadata: {
            fileIndex: currentFile?.index,
            fileName: currentFile?.name,
            hasUnsavedChanges,
          },
        });
      }

      return hasUnsavedChanges;
    } catch (error: any) {
      handleLogger({
        message: "Error checking unsaved changes",
        level: "ERROR",
        metadata: {
          error: error.message,
        },
      });
      return false;
    }
  };

  const performFileSwitch = useCallback(
    (newIndex: number, newContents: any, newName: string) => {
      setSelectedEditIndex({
        index: newIndex,
        contents: newContents,
        name: newName,
      });

      setSaveState({
        saveIsCurrent: true,
        lastSaveDate: new Date(),
      });

      setFileLocation([""]);
      setIndexSort(true);

      handleLogger({
        message: "File switch validation",
        level: "DEBUG",
        metadata: {
          isValid: validateEditorContent(newContents, editor),
          activeFile: selectedEditIndex,
        },
      });
    },
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
    [
      handleLogger,
      selectedEditIndex,
      setSelectedEditIndex,
      setFileLocation,
      setIndexSort,
    ]
  );

  const handleFileSwitch = useCallback(
    (file: SelectedEditIndexType) => {
      try {
        const validation = validateEditorContent(file.contents, editor);

        const hasUnsavedChanges = checkUnsavedChanges(
          file?.contents,
          editor.getEditorState()
        );

        handleLogger({
          message: "File content validation",
          level: validation.isValid ? "DEBUG" : "ERROR",
          metadata: {
            fileIndex: file.index,
            fileName: file.name,
            ...validation,
          },
        });

        if (!validation.isValid) return;

        handleLogger({
          message: "Attempting file switch",
          level: "DEBUG",
          metadata: {
            currentFile: selectedEditIndex,
            newFile: file,
          },
        });

        if (!file || !file.index) {
          handleLogger({
            message: "Invalid file data received",
            level: "ERROR",
            metadata: { ...file },
          });
          return;
        }

        if (hasUnsavedChanges) {
          handleLogger({
            message: "Unsaved changes detected",
            level: "WARN",
            metadata: {
              currentFile: selectedEditIndex,
              component: "FileDropdown",
            },
          });

          setSaveIsOpen(true);
          setPendingFileSwitch(file);
          return;
        }

        if (!file?.contents) {
          handleLogger({
            message: "File contents missing",
            level: "ERROR",
            metadata: { fileIndex: file.index, type: typeof file },
          });
          return;
        }

        /** The data should work file as long as it is in SelectedEditIndexType */
        handleLogger({
          message: "Executing file switch",
          level: "DEBUG",
          metadata: { fileData: file, type: typeof file },
        });

        setSelectedEditIndex(file);
        performFileSwitch(file.index, file.contents, file.name);
      } catch (error: any) {
        handleLogger({
          message: "Error in file switch operation",
          level: "ERROR",
          metadata: {
            error: error.message,
          },
        });
      } finally {
        handleLogger({
          message: "File switch operation completed",
          level: "DEBUG",
          metadata: {
            fileIndex: file.index,
            fileName: file.name,
            type: typeof file,
          },
        });
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [performFileSwitch, handleLogger, selectedEditIndex]
  );

  return (
    <>
      <Menu as="div" className="block">
        <div>
          <Menu.Button className="inline-flex w-full justify-center gap-x-1.5 bg-white text-xs font-semibold text-gray-900 hover:bg-gray-50">
            <ChevronDownIcon
              className="-mr-1 h-5 w-5 text-gray-400"
              aria-hidden="true"
            />
          </Menu.Button>
        </div>
        <Transition
          as={Fragment}
          enter="transition ease-out duration-100"
          enterFrom="transform opacity-0 scale-95"
          enterTo="transform opacity-100 scale-100"
          leave="transition ease-in duration-75"
          leaveFrom="transform opacity-100 scale-100"
          leaveTo="transform opacity-0 scale-95"
        >
          <Menu.Items className="absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
            <div className="py-1">
              <Menu.Item>
                {({ active }) => (
                  <span
                    className={classNames(
                      active ? "bg-gray-100 text-gray-900" : "text-gray-700",
                      "block px-4 py-2 text-sm"
                    )}
                    onClick={() =>
                      handleFileSwitch({
                        index: data.index, // From props
                        contents: data.contents, // The file contents
                        name: data.name, // From props
                      })
                    }
                  >
                    Edit
                  </span>
                )}
              </Menu.Item>
              <Menu.Item>
                {({ active }) => (
                  <span
                    className={classNames(
                      active ? "bg-gray-100 text-gray-900" : "text-gray-700",
                      "block px-4 py-2 text-sm"
                    )}
                    onClick={() => {
                      setRenameIsOpen(true);
                      handleLogger({
                        message: "Rename clicked",
                        level: "DEBUG",
                      });
                    }}
                  >
                    Rename
                  </span>
                )}
              </Menu.Item>
              <Menu.Item>
                {({ active }) => (
                  <span
                    className={classNames(
                      active ? "bg-gray-100 text-gray-900" : "text-gray-700",
                      "block px-4 py-2 text-sm"
                    )}
                    onClick={() => {
                      setDeleteIsOpen(true);
                      handleLogger({
                        message: "Delete clicked",
                        level: "DEBUG",
                      });
                    }}
                  >
                    Delete
                  </span>
                )}
              </Menu.Item>
            </div>
          </Menu.Items>
        </Transition>
      </Menu>

      <SaveDialogueItem
        onSave={() => {
          if (pendingFileSwitch) {
            dispatch!({
              type: "save_file",
              payload: {
                index: selectedEditIndex.index,
                contents: JSON.stringify(editor.getEditorState().toJSON()),
                edges: [],
              },
            });

            setSaveState({
              saveIsCurrent: true,
              lastSaveDate: new Date(),
            });

            performFileSwitch(
              pendingFileSwitch.index,
              pendingFileSwitch.contents,
              pendingFileSwitch.name
            );
          }
          setSaveIsOpen(false);
          setPendingFileSwitch(null);
        }}
        onDontSave={() => {
          if (pendingFileSwitch) {
            performFileSwitch(
              pendingFileSwitch.index,
              pendingFileSwitch.contents,
              pendingFileSwitch.name
            );
          }
          setSaveIsOpen(false);
          setPendingFileSwitch(null);
        }}
      />
    </>
  );
}
