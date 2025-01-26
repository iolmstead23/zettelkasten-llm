import { MagnifyingGlassIcon } from "@heroicons/react/20/solid";
import NotificationBell from "components/ui/NotificationBell";

/**
 * Search interface component for file system
 * @component
 * @example
 * return (
 *   <Search />
 * )
 *
 * @remarks
 * Currently a dummy component:
 * - Search input field with icon
 * - Form structure in place
 * - No active search functionality
 * - Includes NotificationBell component
 * - Placeholder for future search implementation
 *
 * @returns {JSX.Element} Search bar with notification bell
 */
export default function Search() {
  return (
    <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
      <form className="relative flex flex-1" action="#" method="GET">
        <label htmlFor="search-field" className="sr-only">
          Search
        </label>
        <MagnifyingGlassIcon
          className="pointer-events-none absolute inset-y-0 left-0 h-full w-5 text-gray-400"
          aria-hidden="true"
        />
        <input
          id="search-field"
          className="block h-full w-full border-0 py-0 pl-8 pr-0 text-gray-900 placeholder:text-gray-400 focus:ring-0 sm:text-sm"
          placeholder="Search..."
          type="search"
          name="search"
        />
      </form>
      <NotificationBell />
    </div>
  );
}
