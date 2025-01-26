import {
  TextNode,
  EditorConfig,
  NodeKey,
  SerializedLexicalNode,
  TextModeType,
} from "lexical";

/**
 * Interface for EdgeNode properties
 * @interface EdgeNodeProperties
 */
interface EdgeNodeProperties {
  /** Source node identifier */
  sourceId: string;
  /** Target node identifier */
  targetId: string;
  /** Optional node key */
  key?: NodeKey;
  /** Text content */
  text?: string;
}

/**
 * Interface for serialized EdgeNode data
 * @interface SerializedEdgeNode
 */
interface SerializedEdgeNode extends SerializedLexicalNode {
  /** Source node identifier */
  sourceId: string;
  /** Target node identifier */
  targetId: string;
  /** Node type */
  type: string;
  /** Serialization version */
  version: number;
}

interface SerializedEdgeNode extends SerializedLexicalNode {
  sourceId: string;
  targetId: string;
  type: string;
  version: number;
  detail: number;
  format: number;
  mode: TextModeType;
  style: string;
  text: string;
}

/**
 * EdgeNode class for representing connections between nodes in the editor
 * @extends TextNode
 */
export class EdgeNode extends TextNode {
  /** Source node identifier */
  __sourceId: string;
  /** Target node identifier */
  __targetId: string;

  static getType(): string {
    return "edge";
  }

  static clone(node: EdgeNode): EdgeNode {
    return new EdgeNode({
      sourceId: node.__sourceId,
      targetId: node.__targetId,
      key: node.__key,
      text: node.__text,
    });
  }

  /**
   * Create a new EdgeNode instance
   * @param {EdgeNodeProperties} properties - The node properties
   */
  constructor(properties: EdgeNodeProperties) {
    // Pass empty string as text if none provided
    super(properties.text || "", properties.key);
    this.__sourceId = properties.sourceId;
    this.__targetId = properties.targetId;
  }

  createDOM(config: EditorConfig): HTMLElement {
    const dom = document.createElement("span");
    dom.classList.add("edge-node", "text-gray-600", "px-2");
    dom.setAttribute("data-source", this.__sourceId);
    dom.setAttribute("data-target", this.__targetId);
    return dom;
  }

  updateDOM(): boolean {
    return false;
  }

  isInline(): boolean {
    return true;
  }

  /**
   * Import EdgeNode from serialized JSON
   * @param {SerializedEdgeNode} serializedNode - The serialized node data
   * @returns {EdgeNode} Reconstructed EdgeNode instance
   */
  static importJSON(serializedNode: SerializedEdgeNode): EdgeNode {
    const node = $createEdgeNode(
      serializedNode.sourceId,
      serializedNode.targetId,
      serializedNode.text || ""
    );

    // Apply additional properties from serialized node
    node.setDetail(serializedNode.detail);
    node.setFormat(serializedNode.format);
    node.setMode(serializedNode.mode);
    node.setStyle(serializedNode.style);

    return node;
  }

  exportJSON(): SerializedEdgeNode {
    return {
      ...super.exportJSON(),
      sourceId: this.__sourceId,
      targetId: this.__targetId,
      type: "edge",
      version: 1,
      detail: 0,
      format: 0,
      mode: "normal",
      style: "",
      text: this.__text,
    };
  }
}

/**
 * Helper function to create an EdgeNode
 * @param {string} sourceId - The source node identifier
 * @param {string} targetId - The target node identifier
 * @returns {EdgeNode} A new EdgeNode instance
 */
export function $createEdgeNode(
  sourceId: string,
  targetId: string,
  text: string
): EdgeNode {
  return new EdgeNode({
    sourceId,
    targetId,
    text, // Use the provided text instead of generating it
  });
}

/**
 * Type guard to check if a node is an EdgeNode
 * @param {unknown} node - The node to check
 * @returns {boolean} Whether the node is an EdgeNode
 */
export function $isEdgeNode(node: unknown): node is EdgeNode {
  return node instanceof EdgeNode;
}
