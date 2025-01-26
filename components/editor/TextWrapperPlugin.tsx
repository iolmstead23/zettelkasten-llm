// TextWrapperPlugin.tsx
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  $createParagraphNode,
  $getRoot,
  $getSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_EDITOR,
  createCommand,
  LexicalCommand,
} from "lexical";
import { useEffect } from "react";
import { $createEdgeNode } from "components/editor/EdgeNode";

/**
 * Command for wrapping text with edge nodes
 * @type {LexicalCommand<{text: string, sourceId: string, targetId: string}>}
 */
export const WRAP_EDGE_COMMAND: LexicalCommand<{
  text: string;
  sourceId: string;
  targetId: string;
}> = createCommand();

/**
 * Lexical editor plugin for wrapping text with edge nodes
 * @component
 * @example
 * return (
 *   <TextWrapperPlugin />
 * )
 *
 * @remarks
 * Features:
 * - Custom command registration for edge wrapping
 * - Paragraph node creation
 * - Edge node insertion
 * - Selection handling
 *
 * @returns {null} Plugin returns null as it only provides functionality
 */
export function TextWrapperPlugin(): null {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    const removeCommand = editor.registerCommand(
      WRAP_EDGE_COMMAND,
      (payload) => {
        // Ensure a completely fresh update
        editor.update(() => {
          const selection = $getSelection();
          const root = $getRoot();
          const edgeNode = $createEdgeNode(
            payload.sourceId,
            payload.targetId,
            payload.text
          );
          if (!$isRangeSelection(selection)) {
            // If no selection, insert at the end of the root
            const paragraphNode = $createParagraphNode();
            paragraphNode.append(edgeNode);
            root.append(paragraphNode);
            return true;
          }

          try {
            // Create a paragraph node to wrap the EdgeNode
            const paragraphNode = $createParagraphNode();

            paragraphNode.append(edgeNode);

            selection.insertNodes([paragraphNode]);
            return true;
          } catch (error) {
            console.error("Error inserting EdgeNode:", error);
            return false;
          }
        });

        return true;
      },
      COMMAND_PRIORITY_EDITOR
    );

    return removeCommand;
  }, [editor]);

  return null;
}
