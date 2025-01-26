/** Dashboard component loaded dynamically with client-side rendering
 * @component
 * @type {React.ComponentType}
 */
import Dashboard from "components/ui/Dashboard";

/**
 * Home page component for Zettelkasten LLM
 * @component
 *
 * @remarks
 * Root page that:
 * - Dynamically imports Dashboard component
 * - Disables server-side rendering for editor compatibility
 * - Provides main application interface
 *
 * @returns {JSX.Element} Home page wrapper with Dashboard
 */
export default function Home(): React.JSX.Element {
  return (
    <div className="p-4 bg-white rounded-lg shadow-sm m-4">
      <Dashboard />
    </div>
  );
}
