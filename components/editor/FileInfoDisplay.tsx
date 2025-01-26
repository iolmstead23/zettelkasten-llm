import { useSaveStateContext } from "components/providers/subproviders/SaveProvider";

/**
 * File information display component
 * @component
 * @returns {JSX.Element} Component showing file save information
 * @requires SaveProvider
 */
export default function FileInfoDisplay(): React.JSX.Element {
  const { saveState } = useSaveStateContext();

  return (
    <div className="bottom-10">
      Last Save:{" "}
      {saveState.lastSaveDate
        ? saveState.lastSaveDate.toLocaleString()
        : "Not saved yet"}
      {!saveState.saveIsCurrent && " *"}
    </div>
  );
}
