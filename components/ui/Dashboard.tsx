"use client";

import { Suspense, useCallback, useEffect, useRef } from "react";
import FileTreeSidebar from "components/fileTree/FileTreeSidebar";
import RenameFile from "components/fileTree/dialog/RenameFileDialog";
import NewItem from "components/fileTree/dialog/NewItemDialog";
import Notification from "components/ui/Notification";
import FileInfoDisplay from "components/editor/FileInfoDisplay";
import EditorFileOptions from "components/editor/EditorFileOptions";
import DeleteItem from "components/fileTree/dialog/DeleteConfirmDialog";
import EditorComponent from "components/editor/EditorComponent";
import Link from "next/link";
import {
  useDeleteToggleContext,
  useNewItemToggleContext,
  useNotifyToggleContext,
  useRenameToggleContext,
} from "components/providers/subproviders/ToggleProvider";
import { useSelectedIndexContext } from "components/providers/subproviders/SelectedIndexProvider";
import { useSelectedEditContext } from "components/providers/subproviders/SelectedEditIndexProvider";
import { useLogger } from "components/logging/LogWrapper";
import { LogEntryMetadata, LogLevel } from "types/types";

/**
 * Renders a welcome screen for new users in the Zettelkasten system
 *
 * @returns {JSX.Element} Welcome screen with instructions and project link
 * @category Components
 * @subcategory UI
 */
const coverScreen = () => {
  return (
    <div className="w-full h-[80vh] flex items-left border border-gray-200 rounded-lg bg-white">
      <p className="p-10 leading-loose">
        Welcome to your new Zettelkasten System. I am glad you are here. <br />
        To begin select a note labeled with .md by clicking on it. <br />
        Then click on the Menu dropdown marked with a down arrow and select Edit
        <br />
        <br />
        File Options will appear on the top of the editor.
        <br />
        Make sure to save all of your work.
        <span className="text-lg font-bold:">
          !! Linked Edges wont work unless they are saved first !!
        </span>
        <br />
        You can create new files and also create folders to store your notes
        <br />
        <br />
        Please enjoy!
        <br />
        <br />
        Developed by Ian Olmstead.
        <Link
          href="https://github.com/iolmstead23/Zettelkasten-LLM"
          className="font-bold text-lg text-purple-600"
        >
          Link to my project repo
        </Link>
      </p>
    </div>
  );
};

/**
 * Dashboard Component for Zettelkasten Note Management System
 *
 * Provides a comprehensive UI for file editing, management, and navigation
 *
 * @returns {JSX.Element} Comprehensive dashboard layout
 *
 * @category Components
 * @subcategory UI
 *
 * @example
 * ```tsx
 * <Dashboard />
 * ```
 *
 * @see FileTreeSidebar
 * @see EditorComponent
 * @see Notification
 */
export default function Dashboard() {
  /** Context for managing rename dialog state */
  const renameToggle = useRenameToggleContext();

  /** Context for managing delete dialog state */
  const deleteToggle = useDeleteToggleContext();

  /** Context for managing new item dialog state */
  const newItemToggle = useNewItemToggleContext();

  /** Context for tracking selected file tree item */
  const selectedInfo = useSelectedIndexContext();

  /** Context for managing notification system */
  const notifyToggle = useNotifyToggleContext();

  /** Current selected edit index from context */
  const { selectedEditIndex } = useSelectedEditContext();
  const selectedIndex = selectedEditIndex?.index;

  /** Logger hook for capturing system events */
  const { addLogs } = useLogger();

  /**
   * Handles logging of various events
   *
   * @param {Object} params - Logging parameters
   * @param {string} params.message - Log message
   * @param {LogLevel} params.level - Log level
   * @returns {Promise<void>}
   */
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
          metadata: { ...metadata, component: "Dashboard" },
        });
      } catch (error: any) {
        console.error("Log submission error", error.message);
      }
    },
    [addLogs]
  );

  /**
   * Logs component mount event when the Dashboard is first rendered
   */
  useEffect(() => {
    handleLogger({ message: "Dashboard Mounted", level: "DEBUG" });
  }, [handleLogger]);

  return (
    <main className="xl:pl-72 max-h-full">
      {/* Conditional rendering of dialogs and notifications */}
      <div>
        <RenameFile
          index={selectedInfo.selectedIndex.index}
          name={selectedInfo.selectedIndex.content_name}
        />
      </div>
      <div>
        <NewItem />
      </div>
      <div>
        <DeleteItem id={selectedInfo.selectedIndex.index} />
      </div>
      
      {notifyToggle.notifyToggle == true && (
        <div>
          <Notification />
        </div>
      )}

      <div className="px-4 py-10 sm:px-6 lg:px-8 lg:py-6">
        <div className="lg:pl-20">
          {selectedIndex != -1 ? (
            <div>
              <div className="my-2">
                <div className="relative items-center flex">
                  <EditorFileOptions />
                </div>
              </div>
              <div className="pt-5">
                <div className="border-2 border-slate-300 rounded-md overflow-y-auto">
                  <div className="h-[69vh] overflow-hidden hover:overflow-y-scroll shadow-md sticky">
                    <EditorComponent />
                  </div>
                </div>
                <div className="relative pt-5">
                  <FileInfoDisplay />
                </div>
              </div>
            </div>
          ) : (
            coverScreen()
          )}

          {/* File tree sidebar */}
          <aside
            className="absolute w-72 bottom-0 left-20 top-16 hidden overflow-y-auto border-r border-gray-200 px-4 py-6 sm:px-6 lg:px-8 xl:block"
            onContextMenu={(e) => {
              // prevent the default behavior when right clicked
              e.preventDefault();
            }}
          >
            <FileTreeSidebar />
          </aside>
        </div>
      </div>
    </main>
  );
}
