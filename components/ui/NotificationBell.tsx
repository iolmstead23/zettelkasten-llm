import { BellIcon } from "@heroicons/react/20/solid";

/**
 * Notification bell component for displaying system notifications
 * @component
 * @example
 * return (
 *   <NotificationBell />
 * )
 *
 * @remarks
 * Currently a dummy component:
 * - Displays notification bell icon
 * - No active functionality
 * - Placeholder for future notification system
 * - Visual separator included for desktop layout
 *
 * @returns {JSX.Element} Notification bell button with separator
 */
export default function NotificationBell() {
  return (
    <div className="flex items-center gap-x-4 lg:gap-x-6">
      <button
        type="button"
        className="-m-2.5 p-2.5 text-gray-400 hover:text-gray-500"
      >
        <span className="sr-only">View notifications</span>
        <BellIcon className="h-6 w-6" aria-hidden="true" />
      </button>

      {/* Separator */}
      <div
        className="hidden lg:block lg:h-6 lg:w-px lg:bg-gray-900/10"
        aria-hidden="true"
      />
    </div>
  );
}
