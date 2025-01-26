"use client";

import { NotificationContentState, NotificationContentType } from "types/types";
import { ReactNode, createContext, useContext, useState } from "react";

/**
 * Context for managing application-wide notifications
 * @remarks
 * Provides state management for notification messages and their types
 */
const NotificationContentContext = createContext<
  NotificationContentState | undefined
>(undefined);

/**
 * Context provider for application notifications
 * @component
 * @example
 * return (
 *   <NotificationProvider>
 *     {children}
 *   </NotificationProvider>
 * )
 * 
 * @remarks
 * Provides:
 * - Notification message state
 * - Notification type (success/error)
 * - State management methods
 */

const NotificationProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [notifyContent, setNotifyContent] = useState<NotificationContentType>({
    type: "success",
    message: "",
  });

  return (
    <>
      <NotificationContentContext.Provider
        value={{ notifyContent, setNotifyContent }}
      >
        {children}
      </NotificationContentContext.Provider>
    </>
  );
};

export default NotificationProvider;

/**
 * Hook for accessing notification context
 * @returns Context object containing notification state and setter function
 * @throws Error if used outside of NotificationProvider
 * @example
 * ```tsx
 * const { notifyContent, setNotifyContent } = useNotifyContentContext();
 * 
 * // Show a success notification
 * setNotifyContent({
 *   type: "success",
 *   message: "Operation completed successfully"
 * });
 * ```
 */
export function useNotifyContentContext(): NotificationContentState {
  const context = useContext(NotificationContentContext);
  if (context === undefined) {
    throw new Error(
      "useNotifyContentContext must be used within a NotificationContentProvider"
    );
  }
  return context;
}
