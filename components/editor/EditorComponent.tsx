import React, { useCallback, useEffect } from "react";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { $getRoot } from "lexical";
import { useSelectedEditContext } from "components/providers/subproviders/SelectedEditIndexProvider";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import Toolbar from "components/editor/Toolbar";
import { LogEntryMetadata, LogLevel, SelectedEditIndexType } from "types/types";
import { TextWrapperPlugin } from "components/editor/TextWrapperPlugin";
import { useLogger } from "components/logging/LogWrapper";

function EditorComponent() {
  const { selectedEditIndex, setSelectedEditIndex } = useSelectedEditContext();
  const [editor] = useLexicalComposerContext();

  const { addLogs } = useLogger();
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
          metadata: { ...metadata, component: "SaveProvider" },
        });
      } catch (error: any) {
        handleLogger({
          message: "Log submission error",
          level: "ERROR",
          metadata: { error: error.message },
        });
      }
    },
    [addLogs]
  );

  function onChange(editorState: any): void {
    try {
      editorState.read(() => {
        const root = $getRoot();
        if (!root) return;

        const serializedState = editorState.toJSON();

        if (selectedEditIndex?.index !== undefined) {
          const editData: SelectedEditIndexType = {
            index: selectedEditIndex.index,
            contents: { root: serializedState.root },
            name: selectedEditIndex.name || "",
          };

          setSelectedEditIndex(editData);
        }
      });
    } catch (error: any) {
      handleLogger({
        message: `Editor State Debug - ${editorState}:`,
        level: "DEBUG",
        metadata: {
            error: error.message,
          selectedEditIndex,
          contents: selectedEditIndex?.contents,
        },
      });
    }
  }

  useEffect(() => {
    if (!selectedEditIndex?.contents?.root) {
      handleLogger({
        message: "No root content available",
        level: "WARN",
      });
      return;
    }

    try {
      const serializedContent = JSON.stringify(selectedEditIndex.contents);
      const parsedEditorState = editor.parseEditorState(serializedContent);
      editor.setEditorState(parsedEditorState);
    } catch (error: any) {
      handleLogger({
        message: "Editor state error",
        level: "ERROR",
        metadata: { error: error.message },
      });
    }
  }, [selectedEditIndex?.index, editor]);

  return (
    <div>
      <RichTextPlugin
        contentEditable={<ContentEditable className="editor-content" />}
        ErrorBoundary={LexicalErrorBoundary}
      />
      <OnChangePlugin onChange={onChange} />
      <TextWrapperPlugin />
    </div>
  );
}

export default function Editor() {
  return (
    <div>
      <div id="editor-wrapper">
        <Toolbar />
        <EditorComponent />
      </div>
    </div>
  );
}