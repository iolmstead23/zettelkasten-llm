"use client";

import {
  CalendarIcon,
  ChartPieIcon,
  ChartBarIcon,
  HomeIcon,
  Bars3Icon,
} from "@heroicons/react/24/outline";
import { Dialog, Transition } from "@headlessui/react";
import { Fragment, useCallback, useEffect, useRef, useState } from "react";
import { XMarkIcon } from "@heroicons/react/20/solid";
import Profile from "components/ui//Profile";
import Link from "next/link";
import Image from "next/image";
import Search from "components/ui/Searchbar";
import { usePathname, useRouter } from "next/navigation";
import { useLogger } from "components/logging/LogWrapper";
import { LogEntryMetadata, LogLevel } from "types/types";

const navigation = [
  // Turn on more features as they are developed
  //{ name: 'Team', href: '#', icon: UsersIcon, current: false },
  //{ name: 'Projects', href: '#', icon: FolderIcon, current: false },
  //{ name: 'Documents', href: '#', icon: DocumentDuplicateIcon, current: false },
  { name: "Dashboard", href: "/", icon: HomeIcon, current: true },
  { name: "Calendar", href: "/calender", icon: CalendarIcon, current: false },
  { name: "Reports", href: "/analytics", icon: ChartBarIcon, current: false },
  {
    name: "Graph",
    href: "/knowledge-graph",
    icon: ChartPieIcon,
    current: false,
  },
];

/** I have no idea what this does */
function classNames(...classes: any) {
  return classes.filter(Boolean).join(" ");
}

/**
 * @component
 * @remarks
 * Provides a responsive sidebar navigation system with:
 * - Mobile and desktop layouts
 * - Dynamic navigation links
 * - Current page highlighting
 * - Collapsible mobile menu
 *
 * @returns {JSX.Element} Fully responsive sidebar navigation
 * @see Profile
 * @see Search
 */
export default function Sidebars() {
  /** This allows us to toggle the sidebar open and close */
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { addLogs } = useLogger();

  /**
   * Determines if the current navigation item is the active page
   *
   * @param {string} href - Navigation link href
   * @returns {boolean} Whether the item is the current page
   */
  const isCurrentPage = (href: string) => {
    if (pathname === null) return false;
    if (href === pathname) {
      return true;
    }
    return pathname.startsWith(href);
  };

  /**
   * Handles logging of navigation and component events
   *
   * @param {Object} params - Logging parameters
   * @param {string} params.message - Log message
   * @param {LogLevel} params.level - Log severity level
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
          metadata: { ...metadata, component: "Sidebar" },
        });
      } catch (error) {
        console.error("Log submission error", error);
      }
    },
    [addLogs]
  );

  /**
   * Logs component mount event
   */
  useEffect(() => {
    handleLogger({ message: "Sidebar Mounted", level: "DEBUG" });
  }, [handleLogger]);

  return (
    <>
      <Transition.Root show={sidebarOpen} as={Fragment}>
        <Dialog
          as="div"
          className="relative z-40 lg:hidden"
          onClose={setSidebarOpen}
        >
          <Transition.Child
            as={Fragment}
            enter="transition-opacity ease-linear duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity ease-linear duration-300"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-gray-900/80" />
          </Transition.Child>

          <div className="fixed inset-0 flex">
            <Transition.Child
              as={Fragment}
              enter="transition ease-in-out duration-300 transform"
              enterFrom="-translate-x-full"
              enterTo="translate-x-0"
              leave="transition ease-in-out duration-300 transform"
              leaveFrom="translate-x-0"
              leaveTo="-translate-x-full"
            >
              <Dialog.Panel className="relative mr-16 flex w-full max-w-xs flex-1">
                <Transition.Child
                  as={Fragment}
                  enter="ease-in-out duration-300"
                  enterFrom="opacity-0"
                  enterTo="opacity-100"
                  leave="ease-in-out duration-300"
                  leaveFrom="opacity-100"
                  leaveTo="opacity-0"
                >
                  <div className="absolute left-full top-0 flex w-16 justify-center pt-5">
                    <button
                      type="button"
                      className="-m-2.5 p-2.5"
                      onClick={() => setSidebarOpen(false)}
                    >
                      <span className="sr-only">Close sidebar</span>
                      <XMarkIcon
                        className="h-6 w-6 text-white"
                        aria-hidden="true"
                      />
                    </button>
                  </div>
                </Transition.Child>

                <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-gray-900 px-6 pb-2 ring-1 ring-white/10">
                  <div className="flex h-16 shrink-0 items-center">
                    <Image
                      className="h-8 w-auto"
                      src="/avatar.jpg"
                      alt="Your Company"
                      width={100}
                      height={100}
                    />
                  </div>
                  <nav className="flex flex-1 flex-col">
                    <ul role="list" className="-mx-2 flex-1 space-y-1">
                      {navigation.map((item) => (
                        <li key={item.name}>
                          <Link
                            href={item.href}
                            className={classNames(
                              isCurrentPage(item.href)
                                ? "bg-gray-800 text-white"
                                : "text-gray-400 hover:text-white hover:bg-gray-800",
                              "group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold"
                            )}
                            onClick={(e) => {
                              setSidebarOpen(false);
                              try {
                                handleLogger({
                                  message: `Navigating to ${item.href}`,
                                  level: "INFO",
                                });
                                e.preventDefault();
                                router.push(item.href);
                              } catch (error) {
                                handleLogger({
                                  message: "Navigation error".concat(
                                    JSON.stringify({
                                      href: item.href,
                                      error:
                                        error instanceof Error
                                          ? error.message
                                          : null,
                                    })
                                  ),
                                  level: "ERROR",
                                });
                              }
                            }}
                          >
                            <item.icon
                              className="h-6 w-6 shrink-0"
                              aria-hidden="true"
                            />
                            {item.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </nav>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition.Root>

      {/* Static sidebar for desktop */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-50 lg:block lg:w-20 lg:overflow-y-auto lg:bg-gray-900 lg:pb-4">
        <div className="flex h-16 shrink-0 items-center justify-center">
          <Image
            className="h-8 w-auto"
            src="/avatar.jpg"
            alt="Your Company"
            width={100}
            height={100}
          />
        </div>
        <nav className="mt-8">
          <ul role="list" className="flex flex-col items-center space-y-1">
            {navigation.map((item) => (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={classNames(
                    isCurrentPage(item.href)
                      ? "bg-gray-800 text-white"
                      : "text-gray-400 hover:text-white hover:bg-gray-800",
                    "group flex gap-x-3 rounded-md p-3 text-sm leading-6 font-semibold"
                  )}
                >
                  <item.icon className="h-6 w-6 shrink-0" aria-hidden="true" />
                  <span className="sr-only">{item.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <div className="lg:pl-20">
        <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
          <button
            type="button"
            className="-m-2.5 p-2.5 text-gray-700 lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <span className="sr-only">Open sidebar</span>
            <Bars3Icon className="h-6 w-6" aria-hidden="true" />
          </button>

          {/* Separator */}
          <div
            className="h-6 w-px bg-gray-900/10 lg:hidden"
            aria-hidden="true"
          />

          <Search />
          <Profile />
        </div>
      </div>
    </>
  );
}
