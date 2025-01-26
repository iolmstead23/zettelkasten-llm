"use client";

import { useLogger } from "components/logging/LogWrapper";
import {
  Edge,
  FileTreeObject,
  GraphData,
  KnowledgeGraphActionTypes,
  KnowledgeGraphContextType,
  LogEntryMetadata,
  LogLevel,
  Node
  
} from "types/types";
import {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useReducer,
} from "react";

/**
 * @title Knowledge Graph Context
 * @type Context for managing knowledge graph state
 */
const KnowledgeGraphContext = createContext<KnowledgeGraphContextType>({
  graphState: { nodes: [], edges: [] },
});

/**
 * @title Node Type Validator
 * @remarks Checks if payload is a valid Node object
 * @param {any} payload - Object to validate
 * @returns {boolean} Whether payload is a Node
 */
function isNode(payload: any): payload is Node {
  return (
    payload &&
    typeof payload === "object" &&
    "id" in payload &&
    "label" in payload
  );
}

function isEdge(payload: any): payload is Edge {
  return (
    payload &&
    typeof payload === "object" &&
    "source" in payload &&
    "target" in payload
  );
}

function isGraphData(payload: any): payload is GraphData {
  return (
    payload &&
    typeof payload === "object" &&
    "nodes" in payload &&
    "edges" in payload
  );
}

/**
 * @title Knowledge Graph Reducer
 * @remarks Central state management for knowledge graph operations
 * @param {KnowledgeGraphContextType} state - Current graph state
 * @param {KnowledgeGraphActionTypes} action - Action to perform
 * @returns {KnowledgeGraphContextType} Updated graph state
 */
function knowledgeGraphReducer(
  state: KnowledgeGraphContextType,
  action: KnowledgeGraphActionTypes
): KnowledgeGraphContextType {
  function get_nodes(data: FileTreeObject[] | Node[] | GraphData): GraphData {
    // Determine input type and process accordingly
    if (Array.isArray(data)) {
      // Distinguish between FileTreeObject[] and Node[]
      if (data.length > 0 && "type" in data[0]) {
        // FileTreeObject[]
        return processFileTreeObjects(data as FileTreeObject[]);
      } else if (data.length > 0 && "id" in data[0] && "label" in data[0]) {
        // Node[]
        return {
          nodes: data as Node[],
          edges: [],
        };
      }
    } else if (data && "nodes" in data && "edges" in data) {
      // GraphData
      return data;
    }

    // Fallback
    return { nodes: [], edges: [] };
  }

  function processFileTreeObjects(data: FileTreeObject[]): GraphData {
    const nodes: Node[] = [];
    const edges: Edge[] = [];

    data.forEach((item) => {
      if (item.type === "file") {
        nodes.push({
          id: item.id?.toString() || Date.now().toString(),
          label: item.name || "Unnamed",
          x: 0,
          y: 0,
          z: 0,
        });

        // Process edges if they exist
        if (item.edges) {
          item.edges.forEach((edge) => {
            edges.push({
              source: edge.source.toString(),
              target: edge.target.toString(),
            });
          });
        }
      }
    });

    return { nodes, edges };
  }

  function insert_edge() {
    const newState = {
      graphState: {
        nodes: [...state.graphState.nodes],
        edges: [...state.graphState.edges, action.payload],
      },
    };

    return newState;
  }

  switch (action.type) {
    case "get_nodes": {
      // Comprehensive type handling
      const payload = action.payload;
      let newNodes: GraphData;

      if (Array.isArray(payload)) {
        // Handle array of FileTreeObjects or Nodes
        newNodes = get_nodes(payload);
      } else if (isGraphData(payload)) {
        // If already GraphData
        newNodes = payload;
      } else if (isNode(payload)) {
        // If single Node
        newNodes = {
          nodes: [payload],
          edges: [],
        };
      } else {
        // Fallback
        newNodes = { nodes: [], edges: [] };
      }

      return { graphState: newNodes };
    }

    case "insert_node": {
      // Ensure payload is a Node
      if (!isNode(action.payload)) {
        return state;
      }
      return {
        graphState: {
          nodes: [...state.graphState.nodes, action.payload],
          edges: [...state.graphState.edges],
        },
      };
    }

    case "delete_node": {
      // Use type assertion to access id
      const nodeId = (action.payload as { id: string }).id;

      return {
        graphState: {
          nodes: state.graphState.nodes.filter((node) => node.id !== nodeId),
          edges: state.graphState.edges.filter(
            (edge) => edge.source !== nodeId && edge.target !== nodeId
          ),
        },
      };
    }

    case "delete_edge": {
      // Use type assertion to access source and target
      const { source, target } = action.payload as {
        source: string;
        target: string;
      };

      return {
        graphState: {
          nodes: [...state.graphState.nodes],
          edges: state.graphState.edges.filter(
            (edge) => edge.source !== source || edge.target !== target
          ),
        },
      };
    }

    default:
      return state;
  }
}

/**
 * @component
 * @remarks
 * Provides context and state management for knowledge graph
 * Features:
 * - Manages graph nodes and edges
 * - Supports node and edge operations
 *
 * @param {Object} props - Component properties
 * @param {ReactNode} props.children - Child components to render
 * @returns {JSX.Element} Knowledge graph context provider
 * @see useKnowledgeGraphContext
 */
const KnowledgeGraphProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const { addLogs } = useLogger();

  const initialState: KnowledgeGraphContextType = {
    graphState: {
      nodes: [],
      edges: [],
    },
  };

  /** This stores the state of the knowledge graph nodes */
  const [graphState, graphDispatch] = useReducer(
    knowledgeGraphReducer,
    initialState
  );

  /**
   * @title Logger Handler
   * @remarks Handles logging of graph-related events
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
          metadata: { ...metadata, component: "KnowledgeGraphProvider" },
        });
      } catch (error: any) {
        console.error("Log submission error", error.message);
      }
    },
    [addLogs]
  );

  /**
   * @title Initial Node Insertion
   * @remarks Ensures at least one node exists in the graph
   */
  useEffect(() => {
    if (graphState.graphState.nodes.length === 0) {
      graphDispatch({
        type: "insert_node",
        payload: {
          id: "new-file",
          label: "New File",
          x: 0,
          y: 0,
          z: 0,
        },
      });
    }
  }, [graphState.graphState.nodes.length]);

  /**
   * @title Mounting Logger
   * @remarks Logs provider initialization
   */
  useEffect(() => {
    handleLogger({ message: "KnowledgeGraphProvider mounted", level: "DEBUG" });
  }, [handleLogger]);

  return (
    <KnowledgeGraphContext.Provider
      value={{
        graphState: graphState.graphState,
        graphDispatch,
        // Export this method
      }}
    >
      {children}
    </KnowledgeGraphContext.Provider>
  );
};

export default KnowledgeGraphProvider;

/**
 * @title Knowledge Graph Context Hook
 * @remarks Provides access to knowledge graph context
 * @returns {KnowledgeGraphContextType} Knowledge graph context
 * @throws {Error} If used outside of provider
 */
export function useKnowledgeGraphContext() {
  const context = useContext(KnowledgeGraphContext);
  if (context === undefined) {
    throw new Error(
      "useKnowledgeGraphContext must be used within a KnowledgeGraphContextProvider"
    );
  }
  return context;
}
