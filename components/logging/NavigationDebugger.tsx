"use client";

import { LogEntryMetadata, LogLevel } from "types/types";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useLogger } from "components/logging/LogWrapper";

/**
 * Navigation Debugger Utility
 *
 * A utility component that logs navigation events and prefetches routes
 * Provides debugging information about page navigation and route prefetching
 *
 * @returns {null} Utility component that doesn't render anything
 */
export function NavigationDebugger(): null {
  const router = useRouter();
  const pathname = usePathname();
  const [previousPath, setPreviousPath] = useState<string | null>(null);
  const { addLogs } = useLogger();

  /**
   * Handles logging of navigation events
   *
   * @param {Object} params - Logging parameters
   * @param {string} params.message - Log message
   * @param {LogLevel} params.level - Log level
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
          metadata: { ...metadata, component: "NavigationDebugger" },
        });
      } catch (error: any) {
        console.error("Log submission error", error.message);
      }
    },
    [addLogs]
  );

  /**
   * Log initial mount of NavigationDebugger
   */
  useEffect(() => {
    handleLogger({ message: "NavigationDebugger mounted.", level: "INFO" });
  }, [handleLogger]);

  /**
   * Monitor and log navigation changes
   * Prefetch predefined routes
   */
  useEffect(() => {
    // Log navigation changes
    if (pathname !== previousPath) {
      handleLogger({
        message: `Navigation change logged. Current Path ${pathname} and ${previousPath}`,
        level: "DEBUG",
      });
      setPreviousPath(pathname);
    }

    // Predefined routes to prefetch
    const routes = [
      "/",
      "/dashboard",
      "/calender",
      "/analytics",
      "/knowledge-graph",
    ];

    // Attempt to prefetch routes
    // routes.forEach((route) => {
    //   try {
    //     router.prefetch(route);
    //     handleLogger({
    //       message: `Prefetched Route Successfully route: ${route}`,
    //       level: "DEBUG",
    //     });
    //   } catch (error) {
    //     handleLogger({
    //       message: "Prefetched Route Failed",
    //       level: "ERROR",
    //     });
    //   }
    // });
  }, [pathname, router, previousPath, handleLogger]);

  return null;
}
