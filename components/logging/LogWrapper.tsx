"use client";

import {
  createContext,
  useState,
  useCallback,
  ReactNode,
  useContext,
  useEffect,
  useRef,
} from "react";
import UIProvider from "components/providers/UIProvider";
import { LogContextType, LogEntry, SanitizedLogEntry } from "types/types";

/**
 * Context for managing application logging
 */
const LoggingWrapperContext = createContext<LogContextType | undefined>(
  undefined
);

/**
 * Generates a unique filename for logging sessions
 * @returns {string} Unique log filename with timestamp and random identifier
 */
const generateUniqueSessionFileName = () => {
  const date = new Date();
  const signature = date
    .toISOString()
    .replace(/:/g, "-")
    .replace(/\./g, "_")
    .split("Z")[0]
    .concat(`_${Math.random().toString(36).substring(2, 7)}`);

  return `devlog-${signature}.log`;
};

const loggerInstance = {
  current: null as string | null,
  initialized: false,
};

/**
 * Wrapper component for logging functionality
 * Provides logging context to child components
 *
 * @component
 * @param {Object} props - Component properties
 * @param {ReactNode} props.children - Child components to be wrapped
 * @returns {JSX.Element} Logging-enabled component tree
 */
export default function LogWrapper({ children }: { children: ReactNode }) {
  const [sessionLogFilename, setSessionLogFilename] = useState<string>("");

  useEffect(() => {
    // Only generate filename if not already initialized
    if (!loggerInstance.initialized) {
      const filename = generateUniqueSessionFileName();
      loggerInstance.current = filename;
      loggerInstance.initialized = true;
      setSessionLogFilename(filename);
      console.log("Logger initialized with filename:", filename);
    } else {
      // Use existing filename
      setSessionLogFilename(loggerInstance.current!);
      console.log("Logger using existing session:", loggerInstance.current);
    }
  }, []);

  /**
   * Safely extracts relevant data from event objects
   * @param {any} event - Event object to sanitize
   * @returns {Object} Sanitized event data
   */
  const createSafeEventData = (event: any) => {
    if (event && event._reactName) {
      return {
        type: event.type,
        name: event._reactName,
        timestamp: new Date().toISOString(),
        target: event.target
          ? {
              id: event.target.id,
              className: event.target.className,
              tagName: event.target.tagName,
            }
          : null,
      };
    }
    return event;
  };

  /**
   * Sanitizes objects to remove circular references
   * @param {any} obj - Object to sanitize
   * @returns {any} Sanitized object safe for JSON.stringify
   */
  const sanitizeForLogging = (obj: any): any => {
    const seen = new WeakSet();

    return JSON.parse(
      JSON.stringify(obj, (key, value) => {
        if (typeof value === "object" && value !== null) {
          // Handle React events
          if (value._reactName) {
            return createSafeEventData(value);
          }

          // Handle circular references
          if (seen.has(value)) {
            return "[Circular Reference]";
          }
          seen.add(value);

          // Handle DOM nodes
          if (value instanceof Node) {
            return "[DOM Node]";
          }

          // Handle React elements
          if (value.$$typeof) {
            return "[React Element]";
          }
        }
        return value;
      })
    );
  };

  /**
   * Adds a log entry and sends it to the server asynchronously
   * @param {LogEntry} log - Log entry to be added
   * @returns {Promise<void>}
   */
  const addLogs = useCallback(
    async (logEntry: LogEntry): Promise<void> => {
      console.group("Logging Process");
      console.log("Input log:", { logEntry });
      console.log("Session filename:", sessionLogFilename);

      try {
        /** Packages the filename into the metadata */
        const sanitizedLogEntry: SanitizedLogEntry = sanitizeForLogging({
          ...logEntry,
          level: logEntry.level || "INFO",
          metadata: {
            ...logEntry.metadata,
            filename: sessionLogFilename,
          },
        });

        const response = await fetch("/api/logs", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(sanitizedLogEntry),
        });

        console.log("Fetch response:", response);

        if (!response.ok) {
          throw new Error(`Logging failed: ${response.statusText}`);
        }

        const responseData = await response.json();
        console.log("Log response:", responseData);
      } catch (error) {
        console.error("Detailed logging error:", error);
        throw error;
      } finally {
        console.groupEnd();
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sessionLogFilename]
  );

  return (
    <LoggingWrapperContext.Provider
      value={{
        addLogs,
        sessionLogFilename,
      }}
    >
      <UIProvider>{children}</UIProvider>
    </LoggingWrapperContext.Provider>
  );
}

/**
 * Custom hook to access logging context
 * @returns {LogContextType} Logging context
 * @throws {Error} If used outside of LoggingWrapperContext
 */
export function useLogger() {
  const context = useContext(LoggingWrapperContext);
  if (context === undefined) {
    throw new Error("useLogger must be used within a LoggingWrapperContext");
  }
  return context;
}
