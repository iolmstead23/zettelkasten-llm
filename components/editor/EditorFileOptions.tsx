"use client";

import { Menu, Transition } from "@headlessui/react";
import { ChevronDownIcon } from "@heroicons/react/20/solid";
import {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  FileTreeObject,
  LogEntryMetadata,
  LogLevel,
  SelectedEditIndexType,
} from "types/types";
import { useSelectedEditContext } from "components/providers/subproviders/SelectedEditIndexProvider";
import { useFileLocationContext } from "components/providers/subproviders/FileLocationProvider";
import {
  useSaveContext,
  useSaveStateContext,
} from "components/providers/subproviders/SaveProvider";
import {
  useFiletreeContext,
  useSortIndexContext,
} from "components/providers/subproviders/FiletreeContextProvider";
import { useLogger } from "components/logging/LogWrapper";
import { useSaveToggleContext } from "components/providers/subproviders/ToggleProvider";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import SaveDialogueItem from "components/fileTree/dialog/SaveConfirmDialog";
import { useSelectedIndexContext } from "components/providers/subproviders/SelectedIndexProvider";

/**
 * @component
 * @remarks
 * Provides file operation menu for editor
 * Features:
 * - File operation dropdown (Save, Import)
 * - Current file location display
 * - Dynamic file path rendering
 * - Memoized menu options
 *
 * @returns {JSX.Element} File options menu with dropdown
 * @see useSelectedEditContext
 * @see useFileLocationContext
 */
export default function EditorFileOptions(): React.JSX.Element {
  const { selectedEditIndex, setSelectedEditIndex } = useSelectedEditContext();
  const { fileLocation, setFileLocation } = useFileLocationContext();
  const { saveState, setSaveState, getSavedContent } = useSaveStateContext();
  const { saveFile } = useSaveContext();
  const { state, dispatch } = useFiletreeContext();
  const { addLogs } = useLogger();
  const { saveIsOpen, setSaveIsOpen } = useSaveToggleContext();
  const [editor] = useLexicalComposerContext();
  const [isClosing, setIsClosing] = useState<boolean>(false);

  const selectedEditName = useRef<string>(selectedEditIndex?.name ?? "");

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
          metadata: { ...metadata, component: "EditorFileOptions" },
        });
      } catch (error: any) {
        console.error("Log submission error", error.message);
      }
    },
    [addLogs]
  );

  const performFileClose = useCallback(() => {
    setFileLocation([""]);
    setSelectedEditIndex({ index: -1, contents: "", name: "" });
  }, [setSelectedEditIndex, setFileLocation]);

  /**
   * State for pending file switch operation
   * @state
   */
  const [pendingFileSwitch, setPendingFileSwitch] = useState<boolean>(false);

  const checkUnsavedChanges = () => {
    if (editor.getEditorState().isEmpty()) {
      handleLogger({
        message: "File content validation - Empty editor",
        level: "DEBUG",
        metadata: {
          fileIndex: selectedEditIndex?.index,
          fileName: selectedEditIndex?.name,
        },
      });
      return false;
    }

    const currentContent = JSON.stringify(editor.getEditorState()?.toJSON());
    const savedContent = getSavedContent(selectedEditIndex.index);

    try {
      if (!savedContent) {
        handleLogger({
          message: "No saved content found",
          level: "WARN",
        });
        return false;
      }

      const hasUnsavedChanges = currentContent !== savedContent;

      if (hasUnsavedChanges) {
        handleLogger({
          message: "Unsaved changes detected",
          level: "WARN",
          metadata: {
            currentFile: selectedEditIndex,
            currentContent: currentContent,
            savedContent: savedContent,
          },
        });

        return true;
      }
    } catch (error: any) {
      handleLogger({
        message: "Error checking unsaved changes",
        level: "ERROR",
        metadata: {
          error: error.message,
        },
      });
    }
    return false;
  };

  /**
   * @title File Existence Checker
   * @remarks Recursively checks if a file exists within file tree
   *
   * @param {FileTreeObject[]} files - Array of files to search
   * @param {number} fileId - ID of the file to find
   * @returns {boolean} Whether the file exists in the file tree
   */
  const fileExists = useCallback(
    (files: FileTreeObject[], fileId: number): boolean => {
      for (const file of files) {
        // If the file is found, return true
        if (file.id === fileId) {
          return true;
        }
        // If the file is a folder, check if the file exists in the folder
        if (
          file.type === "folder" &&
          fileExists(file.contents as FileTreeObject[], fileId)
        ) {
          return true;
        }
      }
      return false;
    },
    []
  );

  /**
   * @title Selected File Name Updater
   * @remarks Updates the current selected file name
   */
  useEffect(() => {
    const noteIndex = selectedEditIndex?.index!;
    if (noteIndex === -1 || !fileExists(state, noteIndex)) {
      selectedEditName.current = "";
    } else {
      selectedEditName.current = (selectedEditIndex?.name as string) ?? "";
    }
  }, [
    selectedEditIndex,
    state,
    fileExists,
    selectedEditIndex?.index,
    selectedEditIndex?.name,
  ]);

  useEffect(() => {
    if (isClosing && !saveIsOpen) {
      setSelectedEditIndex({ index: -1, contents: "", name: "" });
    }

    setIsClosing(false);
  }, [isClosing, saveIsOpen, setSelectedEditIndex]);

  /**
   * @title Menu Labels
   * @type {Array}
   * @remarks Memoized menu action items
   */
  const menuLabels = useMemo(
    () => [
      {
        name: "Save",
        action: saveFile,
      },
      { name: "Import", action: () => {} },
      {
        name: "Close",
        action: () => !checkUnsavedChanges() && performFileClose(),
      },
    ],
    [saveFile, pendingFileSwitch, setSelectedEditIndex]
  );

  return (
    <>
      <div className="inline-flex">
        <button
          type="button"
          className="inline-flex items-center rounded-l-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
        >
          File Options
        </button>
        <Menu as="div" className="relative -ml-px block rounded-md shadow-sm">
          <Menu.Button className="relative z-10 inline-flex items-center rounded-r-md bg-white px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50">
            <span className="sr-only">Open options</span>
            <ChevronDownIcon aria-hidden="true" className="h-5 w-5" />
          </Menu.Button>
          <Transition
            as={Fragment}
            enter="transition ease-out duration-100"
            enterFrom="transform opacity-0 scale-95"
            enterTo="transform opacity-100 scale-100"
            leave="transition ease-in duration-75"
            leaveFrom="transform opacity-100 scale-100"
            leaveTo="transform opacity-0 scale-95"
          >
            <Menu.Items className="z-50 absolute right-0 -mr-1 mt-2 w-36 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5">
              <div className="py-1">
                {menuLabels.map((item) => (
                  <Menu.Item key={item.name}>
                    <button
                      onClick={item.action}
                      className="block px-4 py-2 text-sm text-gray-700 data-[focus]:bg-gray-100 data-[focus]:text-gray-900"
                    >
                      {item.name}
                    </button>
                  </Menu.Item>
                ))}
              </div>
            </Menu.Items>
          </Transition>
        </Menu>
        <div>
          <div className="px-5 pt-2">
            {`File Location / 
            ${fileLocation
              .map((item: any) => item || "")
              .filter(Boolean)
              .join(" / ")} 
            ${fileLocation.length > 0 ? " / " : ""}
            ${selectedEditName.current}
          `}
          </div>
        </div>
      </div>
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

            performFileClose();
          }
          setSaveIsOpen(false);
          setPendingFileSwitch(false);
        }}
        onDontSave={() => {
          if (pendingFileSwitch) {
            performFileClose();
          }
          setSaveIsOpen(false);
          setPendingFileSwitch(false);
        }}
      />
    </>
  );
}
