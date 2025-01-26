"use client";

import { Fragment, useCallback } from "react";
import { Menu, Transition } from "@headlessui/react";
import { ChevronDownIcon } from "@heroicons/react/20/solid";
import {
  useDeleteToggleContext,
  useNewItemToggleContext,
  useRenameToggleContext,
} from "components/providers/subproviders/ToggleProvider";
import { useLogger } from "components/logging/LogWrapper";
import { LogEntryMetadata, LogLevel } from "types/types";

/**
 * @title Folder Dropdown Menu
 * @component
 * @remarks
 * Provides a dropdown menu for folder-related actions
 * Features:
 * - Expand/Collapse folder
 * - Create new item
 * - Rename folder
 * - Delete folder
 *
 * @param {Object} props - Component properties
 * @param {boolean | number} props.isOpen - Current folder open state
 * @param {Function} props.setIsOpen - Function to toggle folder open state
 * @returns {JSX.Element} Folder dropdown menu component
 */
function classNames(...classes: any) {
  return classes.filter(Boolean).join(" ");
}

/**
 * @component
 * @remarks
 * Provides a dropdown menu for folder-related actions
 * Features:
 * - Expand/Collapse folder
 * - Create new item
 * - Rename folder
 * - Delete folder
 *
 * @param {Object} props - Component properties
 * @param {boolean | number} props.isOpen - Current folder open state
 * @param {Function} props.setIsOpen - Function to toggle folder open state
 * @returns {JSX.Element} Folder dropdown menu component
 */
export default function FolderDropdown({
  isOpen,
  setIsOpen,
}: {
  isOpen: boolean | number;
  setIsOpen: (e: boolean | number) => void;
}): React.JSX.Element {
  /** Toggle contexts for various dialogs */
  const renameContext = useRenameToggleContext();
  const newContext = useNewItemToggleContext();
  const deleteContext = useDeleteToggleContext();
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
          metadata: { ...metadata, component: "FolderDropdown" },
        });
      } catch (error: any) {
        console.error("Log submission error", error.message);
      }
    },
    [addLogs]
  );

  return (
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
                  onClick={() => {
                    setIsOpen(+!isOpen);
                  }}
                >
                  {isOpen ? "Expand" : "Collapse"}
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
                    newContext.setNewIsOpen(true);
                  }}
                >
                  New
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
                    renameContext?.setRenameIsOpen(true);
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
                    deleteContext.setDeleteIsOpen(true);
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
  );
}
