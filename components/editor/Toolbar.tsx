"use client";

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { mergeRegister } from "@lexical/utils";
import {
  $getSelection,
  $isRangeSelection,
  FORMAT_ELEMENT_COMMAND,
  FORMAT_TEXT_COMMAND,
  REDO_COMMAND,
  SELECTION_CHANGE_COMMAND,
  UNDO_COMMAND,
} from "lexical";
import { createEmptyHistoryState, registerHistory } from "@lexical/history";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  FaBold,
  FaUndo,
  FaRedo,
  FaItalic,
  FaUnderline,
  FaStrikethrough,
  FaAlignLeft,
  FaAlignRight,
  FaAlignCenter,
  FaAlignJustify,
  FaBook,
} from "react-icons/fa";
import { FileTreeObject, LogEntryMetadata, LogLevel } from "types/types";
import { WRAP_EDGE_COMMAND } from "components/editor/TextWrapperPlugin";
import { useCombinedOperations } from "components/providers/UIProvider";
import { useSelectedEditContext } from "components/providers/subproviders/SelectedEditIndexProvider";
import { useFiletreeContext } from "components/providers/subproviders/FiletreeContextProvider";
import { useLogger } from "components/logging/LogWrapper";

/** Priority level for editor commands */
const LowPriority = 1;

/**
 * @component
 * @remarks Visual separator for toolbar sections
 *
 * @returns {JSX.Element} Vertical divider element
 */
function Divider(): JSX.Element {
  return <div className="divider" />;
}

/**
 * @component
 * @remarks
 * Comprehensive toolbar for rich text editing
 * Features:
 * - Text formatting controls
 * - Undo/Redo functionality
 * - Text alignment options
 * - Note linking capabilities
 * - Knowledge graph integration
 *
 * @returns {JSX.Element} Fully configured editor toolbar
 * @see TextWrapperPlugin
 * @see KnowledgeGraphProvider
 */
function Toolbar(): React.JSX.Element {
  const [editor] = useLexicalComposerContext();
  const toolbarRef = useRef(null);
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [isStrikethrough, setIsStrikethrough] = useState(false);

  const { state } = useFiletreeContext();
  const selectedEditIndex = useSelectedEditContext();
  const history = createEmptyHistoryState();
  const { handleAddEdge } = useCombinedOperations();
  const { addLogs } = useLogger();

  /**
   * @title Toolbar State Updater
   * @remarks Updates toolbar formatting state based on text selection
   */
  const $updateToolbar = useCallback((): void => {
    const selection = $getSelection();
    if ($isRangeSelection(selection)) {
      setIsBold(selection.hasFormat("bold"));
      setIsItalic(selection.hasFormat("italic"));
      setIsUnderline(selection.hasFormat("underline"));
      setIsStrikethrough(selection.hasFormat("strikethrough"));
    }
  }, []);

  /**
   * @title Logger Handler
   * @remarks Handles logging of toolbar events with error handling
   *
   * @param {Object} params - Logging parameters
   * @param {string} params.message - Log message to be recorded
   * @param {LogLevel} params.level - Severity level of the log
   * @returns {Promise<void>} Asynchronous logging operation
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
          metadata: { ...metadata, component: "Toolbar" },
        });
      } catch (error: any) {
        console.error("Log submission error", error.message);
      }
    },
    [addLogs]
  );

  /**
   * @title Toolbar Mounting Logger
   * @remarks Logs initialization of the toolbar component
   * @see handleLogger
   */
  useEffect(() => {
    handleLogger({ message: "Toolbar mounted.", level: "INFO" });
  }, [handleLogger]);

  /**
   * @title Editor History and Command Registration
   * @remarks
   * Manages editor history and registers update listeners
   * Features:
   * - Register editor history
   * - Track toolbar updates
   * - Handle selection change commands
   *
   * @returns {Function} Cleanup function to unregister listeners
   * @see $updateToolbar
   */
  useEffect(() => {
    registerHistory(editor, history, 100);
    const unregister = mergeRegister(
      editor.registerUpdateListener(({ editorState }) => {
        editorState.read(() => {
          $updateToolbar();
        });
      }),
      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        (_payload, _newEditor) => {
          $updateToolbar();
          return false;
        },
        LowPriority
      )
    );

    return () => {
      unregister();
    };
  }, [editor, $updateToolbar, history]);

  /**
   * @title Note Existence Checker
   * @remarks Searches for existing notes in the file tree
   *
   * @param {string} noteName - Name of the note to find
   * @returns {FileTreeObject | null} Found file object or null
   */
  const checkIfNoteExists = useCallback(
    (noteName: string) => {
      const searchFiles: any = (files: FileTreeObject[]) => {
        for (const file of files) {
          const filenameCleaned = file.name.split(".")[0].toLowerCase().trim();
          const noteNameCleaned = noteName.toLowerCase().trim();

          if (file.type === "file" && filenameCleaned === noteNameCleaned) {
            return file;
          }
          if (file.type === "folder" && Array.isArray(file.contents)) {
            const found = searchFiles(file.contents);
            if (found) {
              return found;
            }
          }
        }
        return null;
      };

      return searchFiles(state);
    },
    [state]
  );

  /**
   * @title Edge Creation Handler
   * @remarks Creates edge connection between nodes in knowledge graph
   *
   * @param {string} fromId - Source node ID
   * @param {string} toId - Target node ID
   */
  const createEdge = useCallback(
    (fromId: string, toId: string) => {
      handleAddEdge(fromId, toId);
    },
    [handleAddEdge]
  );

  /**
   * @title Note Linking Handler
   * @remarks
   * Manages creation of links between notes
   * - Checks for existing notes
   * - Prompts for edge creation
   * - Wraps selected text in edge node
   */
  const handleLinkButtonClick = useCallback(() => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        const selectedText = selection.getTextContent().trim();
        const existingNote = checkIfNoteExists(selectedText);

        if (existingNote && selectedEditIndex.selectedEditIndex.index !== -1) {
          const connectNotes = confirm(
            `Note "${selectedText}" exists. Would you like to link these notes together?`
          );
          if (connectNotes) {
            const sourceId = String(existingNote.id || crypto.randomUUID());
            const targetId = String(
              selectedEditIndex.selectedEditIndex.index || crypto.randomUUID()
            );

            createEdge(sourceId, targetId);

            editor.dispatchCommand(WRAP_EDGE_COMMAND, {
              text: selectedText,
              sourceId: sourceId,
              targetId: targetId,
            });
          }
        }
      }
    });

    handleLogger({ message: "Link button clicked", level: "DEBUG" });
  }, [checkIfNoteExists, createEdge, editor, selectedEditIndex, handleLogger]);

  return (
    <div className="toolbar" ref={toolbarRef}>
      <button
        onClick={() => {
          editor.dispatchCommand(UNDO_COMMAND, undefined);
          handleLogger({ message: "Undo executed", level: "DEBUG" });
        }}
        className="toolbar-item spaced"
        aria-label="Undo"
      >
        <FaUndo />
      </button>
      <button
        onClick={() => {
          editor.dispatchCommand(REDO_COMMAND, undefined);
          handleLogger({ message: "Redo executed", level: "DEBUG" });
        }}
        className="toolbar-item"
        aria-label="Redo"
      >
        <FaRedo />
      </button>
      <Divider />
      <button
        onClick={() => {
          editor.dispatchCommand(FORMAT_TEXT_COMMAND, "bold");
          handleLogger({ message: "Bold formatting executed", level: "DEBUG" });
        }}
        className={"toolbar-item spaced " + (isBold ? "active" : "")}
        aria-label="Format Bold"
      >
        <FaBold />
      </button>
      <button
        onClick={() => {
          editor.dispatchCommand(FORMAT_TEXT_COMMAND, "italic");
          handleLogger({
            message: "Italic formatting executed",
            level: "DEBUG",
          });
        }}
        className={"toolbar-item spaced " + (isItalic ? "active" : "")}
        aria-label="Format Italics"
      >
        <FaItalic />
      </button>
      <button
        onClick={() => {
          editor.dispatchCommand(FORMAT_TEXT_COMMAND, "underline");
          handleLogger({
            message: "Underline formatting executed",
            level: "DEBUG",
          });
        }}
        className={"toolbar-item spaced " + (isUnderline ? "active" : "")}
        aria-label="Format Underline"
      >
        <FaUnderline />
      </button>
      <button
        onClick={() => {
          editor.dispatchCommand(FORMAT_TEXT_COMMAND, "strikethrough");
          handleLogger({
            message: "Strikethrough formatting executed",
            level: "DEBUG",
          });
        }}
        className={"toolbar-item spaced " + (isStrikethrough ? "active" : "")}
        aria-label="Format Strikethrough"
      >
        <FaStrikethrough />
      </button>
      <Divider />
      <button
        onClick={() => {
          editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, "left");
          handleLogger({ message: "Left alignment executed", level: "DEBUG" });
        }}
        className="toolbar-item spaced"
        aria-label="Left Align"
      >
        <FaAlignLeft />
      </button>
      <button
        onClick={() => {
          editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, "center");
          handleLogger({
            message: "Center alignment executed",
            level: "DEBUG",
          });
        }}
        className="toolbar-item spaced"
        aria-label="Center Align"
      >
        <FaAlignCenter />
      </button>
      <button
        onClick={() => {
          editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, "right");
          handleLogger({ message: "Right alignment executed", level: "DEBUG" });
        }}
        className="toolbar-item spaced"
        aria-label="Right Align"
      >
        <FaAlignRight />
      </button>
      <button
        onClick={() => {
          editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, "justify");
          handleLogger({
            message: "Justify alignment executed",
            level: "DEBUG",
          });
        }}
        className="toolbar-item spaced"
        aria-label="Justify Align"
      >
        <FaAlignJustify />
      </button>
      <button
        onClick={handleLinkButtonClick}
        className="toolbar-item"
        aria-label="Link"
      >
        <FaBook />
      </button>
    </div>
  );
}

export default Toolbar;
