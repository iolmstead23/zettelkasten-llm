"use client";

import React, { useCallback, useEffect, useRef } from "react";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { $getRoot, EditorState } from "lexical";
import { useSelectedEditContext } from "components/providers/subproviders/SelectedEditIndexProvider";
import { TextWrapperPlugin } from "components/editor/TextWrapperPlugin";
import { LogEntryMetadata, LogLevel } from "types/types";
import { useLogger } from "components/logging/LogWrapper";
import { useSaveStateContext } from "components/providers/subproviders/SaveProvider";

/**
 * @component
 * @remarks
 * Rich text editor using Lexical framework
 * Features:
 * - Real-time content editing
 * - State management
 * - Error boundary
 * - Change tracking
 *
 * @returns {JSX.Element} Configured Lexical editor
 * @see TextWrapperPlugin
 * @see useSelectedEditContext
 */
export function LexicalEditorComponent(): React.JSX.Element {
  const { selectedEditIndex, setSelectedEditIndex } = useSelectedEditContext();
  const { addLogs } = useLogger();
  const { saveState, setSaveState } = useSaveStateContext();

  /**
   * @title Logger Handler
   * @remarks Handles logging of editor events
   *
   * @param {Object} params - Logging parameters
   * @param {string} params.message - Log message
   * @param {LogLevel} params.level - Log severity level
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
          metadata: { ...metadata, component: "LexicalEditor" },
        });
      } catch (error: any) {
        console.error("Log submission error", error.message);
      }
    },
    [addLogs]
  );

  // Add flag to prevent updates during file switches
  const isFileSwitch = useRef(false);

  // Modify onChange to only trigger on actual content changes
  const onChange = useCallback(
    (editorState: EditorState) => {
      isFileSwitch.current = false;

      editorState.read(() => {
        /** Prevent updates during file switches */
        if (isFileSwitch.current) return;

        const root = $getRoot();
        if (!root) return;

        const serializedState = {
          root: editorState.toJSON().root,
        };

        // Only update if this isn't a file switch operation
        if (!isFileSwitch.current) {
          setSelectedEditIndex({
            index: selectedEditIndex.index,
            contents: serializedState,
            name: selectedEditIndex.name,
          });
        }

        if (saveState.saveIsCurrent) {
          setSaveState({
            ...saveState,
            saveIsCurrent: false,
          });
        }
      });
    },
    [selectedEditIndex?.index]
  );

  /**
   * @title Editor Mounting Logger
   * @remarks Logs when the Lexical editor is initialized
   */
  useEffect(() => {
    handleLogger({ message: "LexicalEditor mounted.", level: "INFO" });
  }, [handleLogger]);

  return (
    <div className="editor-container">
      <RichTextPlugin
        contentEditable={<ContentEditable className="editor-input" />}
        placeholder={
          <div className="editor-placeholder">Error Loading Content</div>
        }
        ErrorBoundary={LexicalErrorBoundary}
      />
      <OnChangePlugin onChange={onChange} />
      <TextWrapperPlugin />
    </div>
  );
}
