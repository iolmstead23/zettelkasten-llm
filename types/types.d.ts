import {
  EditorState,
  SerializedLexicalNode,
  SerializedTextNode,
  NodeKey,
  TextModeType,
} from "lexical";

declare module "types/types" {
  /**
   * @type Defines the severity levels for logging
   * @remarks Represents different logging severity levels
   * @example
   * ```typescript
   * const level: LogLevel = "INFO";
   * ```
   */
  export type LogLevel = "DEBUG" | "ERROR" | "INFO" | "WARN";

  export interface LogEntryMetadata {
    [key: string]: string | number | boolean | undefined | Object;
    filename?: string;
  }

  /**
   * @interface Represents a structured log entry
   * @remarks Defines the shape of a log message with metadata
   * @property {string} [timestamp] - Optional timestamp of the log entry
   * @property {LogLevel} level - Severity level of the log
   * @property {string} message - Descriptive log message
   * @property {LogEntryMetadata} [metadata] - Additional contextual information
   * @example
   * ```typescript
   * const logEntry: LogEntry = {
   *   level: "INFO",
   *   message: "Application started",
   *   metadata: { context: "Initialization" }
   * }
   * ```
   */
  export interface LogEntry {
    timestamp?: string;
    level: LogLevel;
    message: string;
    metadata?: LogEntryMetadata;
  }

  /**
   * File icon mapping interface
   * @interface
   */
  export interface FileIcons {
    [key: string]: React.ReactNode;
  }

  /**
   * Collapsible component props interface
   * @interface
   */
  export interface CollapsableComponent {
    isOpen: boolean | number;
    children: any;
  }

  /**
   * Root values interface for file tree items
   * @interface
   */
  export interface RootValues {
    id: number;
    type: string;
    name: string;
    contents: Object | string | number | boolean | null;
  }

  export interface FileContent {
    root: {
      children: SerializedLexicalNode[];
      direction: string;
      format: string;
      indent: number;
      type: string;
      version: number;
    };
  }

  /**
   * A node in the knowledge graph with position coordinates.
   * @remarks Used for visualizing nodes in the 3D graph space
   * @property {Object} Node - A node in the knowledge graph with position coordinates
   * @property {string} Node.id - Unique identifier for the node
   * @property {string} Node.label - Display label for the node
   * @property {number} [Node.x] - X coordinate position in 3D space
   * @property {number} [Node.y] - Y coordinate position in 3D space
   * @property {number} [Node.z] - Z coordinate position in 3D space
   * @example
   * ```typescript
   * const node: Node = {
   *   id: "node1",
   *   label: "Concept",
   *   x: 0,
   *   y: 0,
   *   z: 0
   * }
   * ```
   */
  export interface Node {
    id: string;
    label: string;
    x?: number;
    y?: number;
    z?: number;
  }

  /**
   * A connection between two nodes in the knowledge graph.
   * @remarks Defines relationships between concepts in the graph
   * @property {Object} Edge - A connection between two nodes in the knowledge graph
   * @property {string} Edge.source - Identifier of the source node
   * @property {string} Edge.target - Identifier of the target node
   * @example
   * ```typescript
   * const edge: Edge = {
   *   source: "node1",
   *   target: "node2"
   * }
   * ```
   */
  export interface Edge {
    source: string;
    target: string;
  }

  /**
   * Complete graph data structure containing both nodes and edges.
   * @remarks Main data structure used for graph visualization and manipulation
   * @property {Object} GraphData - Complete graph data structure containing both nodes and edges
   * @property {Edge[]} GraphData.edges - Array of edge connections in the graph
   * @property {Node[]} GraphData.nodes - Array of nodes in the graph
   * @example
   * ```typescript
   * const graphData: GraphData = {
   *   nodes: [],
   *   edges: []
   * }
   * ```
   */
  export interface GraphData {
    edges: Edge[];
    nodes: Node[];
  }

  /**
   * Configuration state for the 3D graph visualization
   * @remarks Contains all Plotly-specific configuration for rendering the graph
   * @property {Object[]} data - Array of Plotly trace objects for visualization
   * @property {Object} data[0] - Line trace configuration for edges
   * @property {Object} data[1] - Marker trace configuration for nodes
   * @property {Object} layout - Plotly layout configuration
   * @property {number} layout.height - Height of the plot in pixels
   * @property {number} layout.width - Width of the plot in pixels
   * @property {string} layout.hovermode - Hover interaction mode
   * @property {Object} layout.margin - Plot margins
   * @property {Object} layout.scene - 3D scene axes configuration
   * @property {boolean} layout.showlegend - Whether to show the legend
   * @property {Object} layout.title - Plot title configuration
   * @example
   * ```typescript
   * const graphState: GraphState = {
   *   data: [{
   *     type: "scatter3d",
   *     mode: "lines",
   *     hoverinfo: "none",
   *     line: { color: "#000000", width: 1 },
   *     x: [0, 1], y: [0, 1], z: [0, 1]
   *   }, {
   *     type: "scatter3d",
   *     mode: "markers",
   *     hoverinfo: "text",
   *     marker: {
   *       color: [1, 2],
   *       line: { color: "#000000", width: 1 },
   *       size: 8,
   *       symbol: "circle"
   *     },
   *     text: ["Node 1", "Node 2"],
   *     x: [0, 1], y: [0, 1], z: [0, 1]
   *   }],
   *   layout: {
   *     height: 600,
   *     width: 800,
   *     hovermode: "closest",
   *     margin: { t: 0 },
   *     scene: {
   *       xaxis: {}, yaxis: {}, zaxis: {}
   *     },
   *     showlegend: false,
   *     title: { text: "Knowledge Graph" }
   *   }
   * }
   * ```
   */
  export interface GraphState {
    data: [
      {
        type: string;
        mode: string;
        hoverinfo: string;
        line: {
          color: string;
          width: number;
        };
        x: number[];
        y: number[];
        z: number[];
      },
      {
        type: string;
        mode: string;
        hoverinfo: string;
        marker: {
          color: number[];
          line: {
            color: string;
            width: number;
          };
          size: number;
          symbol: string;
        };
        text: string[];
        x: number[];
        y: number[];
        z: number[];
      },
    ];
    layout: {
      height: number;
      width: number;
      hovermode: string;
      margin: {
        t: number;
      };
      scene: {
        xaxis: any;
        yaxis: any;
        zaxis: any;
      };
      showlegend: boolean;
      title: {
        text: string;
      };
    };
  }

  /**
   * Available action types for knowledge graph operations
   * @remarks Defines all possible actions that can be dispatched to modify the graph
   * @type {string}
   * @property {"get_nodes"} - Retrieve all nodes from the graph
   * @property {"get_edges"} - Retrieve all edges from the graph
   * @property {"insert_node"} - Add a new node to the graph
   * @property {"insert_edge"} - Add a new edge between nodes
   * @property {"delete_node"} - Remove a node from the graph
   * @property {"delete_edge"} - Remove an edge from the graph
   * @property {"save_graph"} - Persist the current graph state
   */
  export type GraphActionType =
    | "get_nodes" // Retrieve all nodes from the graph
    | "get_edges" // Retrieve all edges from the graph
    | "insert_node" // Add a new node to the graph
    | "insert_edge" // Add a new edge between existing nodes
    | "delete_node" // Remove a node and its connected edges
    | "delete_edge" // Remove a single edge connection
    | "save_graph"; // Persist current graph state to storage

  /**
   * Action structure for knowledge graph operations
   * @remarks Defines the shape of actions that can be dispatched to modify the graph
   * @property {GraphActionType} type - The type of operation to perform
   * @property {Node | Edge | GraphData} [payload] - Optional data for the operation
   * @example
   * ```typescript
   * const action: KnowledgeGraphActionTypes = {
   *   type: "insert_node",
   *   payload: {
   *     id: "node1",
   *     label: "Concept",
   *     x: 0,
   *     y: 0,
   *     z: 0
   *   }
   * }
   * ```
   */
  export type KnowledgeGraphActionTypes =
    | {
        type: "get_nodes";
        payload: FileTreeObject[] | Node[] | GraphData | Node;
      }
    | {
        type: "insert_node";
        payload: Node;
      }
    | {
        type: "delete_node";
        payload: { id: string };
      }
    | {
        type: "delete_edge";
        payload: { source: string; target: string };
      };

  /**
   * Context type for the knowledge graph state and dispatch
   * @remarks Provides graph state access throughout the component tree
   * @property {GraphData} graphState - Current state of the graph
   * @property {Function} graphDispatch - Dispatch function for graph actions
   * @example
   * ```typescript
   * const graphContext: KnowledgeGraphContextType = {
   *   graphState: {
   *     nodes: [],
   *     edges: []
   *   },
   *   graphDispatch: (action) => void
   * }
   * ```
   */
  export interface KnowledgeGraphContextType {
    graphState: GraphData;
    graphDispatch?: React.Dispatch<KnowledgeGraphActionTypes>;
  }

  /**
   * Payload structure for file save operations
   * @remarks Contains all necessary data to persist file changes
   * @property {number} index - Unique identifier of the file being saved
   * @property {string | FileTreeObject[]} contents - File content or nested file structure
   * @property {Edge[]} edges - Associated graph connections for the file
   * @example
   * ```typescript
   * const savePayload: SaveFilePayload = {
   *   index: 0,
   *   contents: "file content",
   *   edges: []
   * }
   * ```
   */
  export interface SaveFilePayload {
    index: number;
    contents: string | FileTreeObject[];
    edges: Edge[];
  }

  /**
   * Payload for file retrieval operations
   * @remarks Contains the complete file tree structure
   * @property {FileTreeObject[]} files - Array of file and folder objects
   * @example
   * ```typescript
   * const payload: GetFilesPayload = {
   *   files: [{
   *     id: 1,
   *     index: 0,
   *     type: "folder",
   *     name: "documents",
   *     contents: []
   *   }]
   * }
   * ```
   */
  export interface GetFilesPayload {
    files: FileTreeObject[];
  }

  /**
   * Payload for file deletion operations
   * @remarks Handles editor state updates and file location management
   * @property {number} index - Index of the file to delete
   * @property {[number, string, string]} editorIndex - Current editor state tuple [index, filename, content]
   * @property {Function} setEditor - Function to update editor state
   * @property {Function} setSelectFileLocation - Function to update file location path
   * @example
   * ```typescript
   * const deletePayload: DeleteFilePayload = {
   *   index: 0,
   *   editorIndex: [0, "filename", "content"],
   *   setEditor: (value) => void,
   *   setSelectFileLocation: (paths) => void
   * }
   * ```
   */
  export interface DeleteFilePayload {
    index: number;
    editorIndex: SelectedEditIndexType;
    setEditor: Dispatch<SetStateAction<SelectedEditIndexType>>;
    setSelectFileLocation: (e: string[]) => void;
  }

  /**
   * Payload for index sorting operations
   * @remarks Manages selection states and file locations during sort operations
   * @property {SelectedEditIndexType} editorIndex - Current editor selection state
   * @property {Function} setEditorIndex - Function to update editor selection
   * @property {SelectedIndexType} selectIndex - Current file selection state
   * @property {Function} setSelectIndex - Function to update file selection
   * @property {string[]} selectFileLocation - Current file path array
   * @property {Function} setSelectFileLocation - Function to update file path
   * @example
   * ```typescript
   * const sortPayload: SortIndexPayload = {
   *   editorIndex: { index: 0, contents: "content", name: "file.txt" },
   *   setEditorIndex: (value) => void,
   *   selectIndex: { index: 0, content_name: "file.txt" },
   *   setSelectIndex: (value) => void,
   *   selectFileLocation: ["folder", "subfolder"],
   *   setSelectFileLocation: (paths) => void
   * }
   * ```
   */
  export interface SortIndexPayload {
    editorIndex: SelectedEditIndexType;
    setEditorIndex: Dispatch<SetStateAction<SelectedEditIndexType>>;
    selectIndex: SelectedIndexType;
    setSelectIndex: (e: SelectedIndexType) => void;
    selectFileLocation: string[];
    setSelectFileLocation: (e: string[]) => void;
  }

  /**
   * Payload for file insertion operations
   * @remarks Contains all required data to create a new file or folder in the tree
   * @property {number} id - Unique identifier for the new item
   * @property {number} index - Position in the file tree
   * @property {string} type - Item type ("file" or "folder")
   * @property {string} name - Display name of the item
   * @property {string | FileTreeObject[]} [contents] - Optional content or nested items
   * @property {Edge[]} [edges] - Optional graph connections
   * @example
   * ```typescript
   * const insertPayload: InsertFilePayload = {
   *   id: 123,
   *   index: 0,
   *   type: "file",
   *   name: "document.txt",
   *   contents: "File content",
   *   edges: []
   * }
   * ```
   */
  export interface InsertFilePayload extends FileTreeObject {
    id: number;
    index: number;
    type: string;
    name: string;
    contents?: string | FileTreeObject[];
    edges?: Edge[];
  }

  /**
   * Payload for file renaming operations
   * @remarks Contains necessary data to rename a file or folder
   * @property {number} index - Index of the item to rename
   * @property {string} newName - New name to assign to the item
   * @example
   * ```typescript
   * const renamePayload: RenameFilePayload = {
   *   index: 1,
   *   newName: "renamed-file.txt"
   * }
   * ```
   */
  export interface RenameFilePayload {
    index: number;
    newName: string;
  }

  /**
   * Available operations for file tree management
   * @remarks Defines all possible file system operations
   * @type {string}
   * @property {"save_file"} - Save changes to file contents
   * @property {"get_files"} - Retrieve complete file listing
   * @property {"delete_file"} - Remove a file or folder
   * @property {"sort_index"} - Reorder items in the tree
   * @property {"insert_file"} - Create a new file or folder
   * @property {"rename_file"} - Change name of existing item
   */
  export type FiletreeReducerFunctions =
    | "save_file" // Save file contents
    | "get_files" // Retrieve file listing
    | "delete_file" // Remove file/folder
    | "sort_index" // Reorder items
    | "insert_file" // Create new file/folder
    | "rename_file"; // Change item name

  /**
   * Available action types for file tree operations
   * @remarks Defines all possible actions that can be dispatched to modify the file tree
   * @type {string}
   * @property {"save_file"} - Save changes to a file
   * @property {"get_files"} - Retrieve complete file listing
   * @property {"delete_file"} - Remove a file or folder
   * @property {"sort_index"} - Reorder items in the tree
   * @property {"insert_file"} - Create a new file or folder
   * @property {"rename_file"} - Change name of existing item
   */
  export type FiletreeActionTypes =
    | SaveFileAction
    | GetFilesAction
    | DeleteFileAction
    | SortIndexAction
    | InsertFileAction
    | RenameFileAction;

  /**
   * Base interface for file tree actions
   * @remarks Common properties shared across all file operations
   * @property {FiletreeReducerFunctions} type - Type of operation
   * @property {number} [count] - Operation count/sequence number
   * @property {boolean} [fileFound] - Indicates if target file exists
   * @property {number} [selectIndex] - Index of selected item
   * @example
   * ```typescript
   * const baseAction: BaseAction = {
   *   type: "save_file",
   *   count: 1,
   *   fileFound: true,
   *   selectIndex: 0
   * }
   * ```
   */
  export interface BaseAction {
    type: FiletreeReducerFunctions;
    count?: number;
    fileFound?: boolean;
    selectIndex?: number;
  }

  /**
   * Action interface for saving file contents
   * @remarks Extends BaseAction with save-specific payload
   * @property {string} type - Action type identifier "save_file"
   * @property {SaveFilePayload} payload - File content and metadata to save
   * @example
   * ```typescript
   * const saveAction: SaveFileAction = {
   *   type: "save_file",
   *   payload: {
   *     index: 1,
   *     contents: "file content",
   *     edges: []
   *   }
   * }
   * ```
   */
  export interface SaveFileAction extends BaseAction {
    type: "save_file";
    payload: SaveFilePayload;
  }

  /**
   * Action interface for retrieving file listings
   * @remarks Extends BaseAction with file listing payload
   * @property {string} type - Action type identifier "get_files"
   * @property {GetFilesPayload} payload - File listing data
   * @example
   * ```typescript
   * const getFilesAction: GetFilesAction = {
   *   type: "get_files",
   *   payload: {
   *     files: []
   *   }
   * }
   * ```
   */
  export interface GetFilesAction extends BaseAction {
    type: "get_files";
    payload: GetFilesPayload;
  }

  /**
   * Action interface for deleting files/folders
   * @remarks Extends BaseAction with delete operation payload
   * @property {string} type - Action type identifier "delete_file"
   * @property {DeleteFilePayload} payload - Delete operation parameters
   * @example
   * ```typescript
   * const deleteAction: DeleteFileAction = {
   *   type: "delete_file",
   *   payload: {
   *     index: 1,
   *     editorIndex: [1, "file.txt", "content"],
   *     setEditor: () => {},
   *     setSelectFileLocation: () => {}
   *   }
   * }
   * ```
   */
  export interface DeleteFileAction extends BaseAction {
    type: "delete_file";
    payload: DeleteFilePayload;
  }

  /**
   * Action interface for reordering file tree items
   * @remarks Extends BaseAction with sort operation payload
   * @property {string} type - Action type identifier "sort_index"
   * @property {SortIndexPayload} payload - Sort operation parameters
   * @example
   * ```typescript
   * const sortAction: SortIndexAction = {
   *   type: "sort_index",
   *   payload: {
   *     editorIndex: { index: 0, contents: "", name: "" },
   *     setEditorIndex: () => {},
   *     selectIndex: { index: 0, content_name: "" },
   *     setSelectIndex: () => {},
   *     selectFileLocation: [],
   *     setSelectFileLocation: () => {}
   *   }
   * }
   * ```
   */
  export interface SortIndexAction extends BaseAction {
    type: "sort_index";
    payload: SortIndexPayload;
  }

  /**
   * Action interface for creating new files/folders
   * @remarks Extends BaseAction with insert operation payload
   * @property {string} type - Action type identifier "insert_file"
   * @property {InsertFilePayload} payload - File/folder creation parameters
   * @property {number} selectIndex - Index of the newly inserted item
   * @property {number} count - Operation count/sequence number
   * @property {boolean} fileFound - Indicates if target file exists
   * @example
   * ```typescript
   * const insertAction: InsertFileAction = {
   *   type: "insert_file",
   *   payload: {
   *     id: 1,
   *     index: 0,
   *     type: "file",
   *     name: "newfile.txt",
   *     contents: ""
   *   },
   *   selectIndex: 0
   * }
   * ```
   */
  export interface InsertFileAction extends BaseAction {
    type: "insert_file";
    payload: InsertFilePayload;
    selectIndex: number;
  }

  /**
   * Action interface for renaming files/folders
   * @remarks Extends BaseAction with rename operation payload
   * @property {string} type - Action type identifier "rename_file"
   * @property {RenameFilePayload} payload - Rename operation parameters
   * @property {number} count - Operation count/sequence number
   * @property {boolean} fileFound - Indicates if target file exists
   * @property {number} selectIndex - Index of selected item
   * @example
   * ```typescript
   * const renameAction: RenameFileAction = {
   *   type: "rename_file",
   *   payload: {
   *     index: 1,
   *     newName: "renamed.txt"
   *   }
   * }
   * ```
   */
  export interface RenameFileAction extends BaseAction {
    type: "rename_file";
    payload: RenameFilePayload;
  }

  /**
   * Core file tree object structure
   * @remarks Represents both files and folders in the tree structure
   * @property {number} id - Unique identifier for the file/folder
   * @property {number} index - Position index in the tree
   * @property {string} type - Type of item ("file" or "folder")
   * @property {string} name - Display name of the item
   * @property {Edge[]} [edges] - Optional graph connections
   * @property {FileTreeObject[] | string} contents - Nested items for folders or content for files
   * @property {boolean} [isExpanded] - Optional expanded state for folders
   * @property {boolean} [isSelected] - Optional selection state
   * @property {string} [path] - Optional full path to item
   * @example
   * ```typescript
   * const fileObject: FileTreeObject = {
   *   id: 1,
   *   index: 0,
   *   type: "file",
   *   name: "example.txt",
   *   contents: "content"
   * }
   * ```
   */
  export interface FileTreeObject {
    id: number;
    index: number;
    type: string;
    name: string;
    edges?: Edge[];
    contents: FileTreeObject[] | string;
  }

  /**
   * File tree state and dispatch context
   * @remarks Provides file tree access throughout component tree
   * @property {FileTreeObject[]} state - Current file tree structure
   * @property {Function} [dispatch] - Optional dispatch function for tree operations
   * @property {boolean} isLoading - Loading state indicator
   * @property {Error} error - Error state
   * @property {string} currentPath - Current active path
   * @example
   * ```typescript
   * const fileTreeState: FileTreeState = {
   *   state: [{
   *     id: 1,
   *     index: 0,
   *     type: "folder",
   *     name: "root",
   *     contents: []
   *   }],
   *   dispatch: (action) => void
   * }
   * ```
   */
  export interface FileTreeState {
    state: FileTreeObject[];
    dispatch?: React.Dispatch<FiletreeActionTypes>;
  }

  /**
   * Tracks the currently selected item in the file tree
   * @remarks Used to maintain selection state across components
   * @property {number} index - The numeric index of the selected item
   * @property {string} content_name - The name of the selected content
   * @example
   * ```typescript
   * const selection: SelectedIndexType = {
   *   index: 0,
   *   content_name: "document.txt"
   * }
   * ```
   */
  export interface SelectedIndexType {
    index: number;
    content_name: string;
  }

  /**
   * State management for file selection
   * @remarks Provides selection state and update mechanism
   * @property {SelectedIndexType} selectedIndex - Current selection state
   * @property {Function} setSelectedIndex - Selection state updater
   * @example
   * ```typescript
   * const selectionState: SelectedIndexState = {
   *   selectedIndex: { index: 0, content_name: "document.txt" },
   *   setSelectedIndex: (newSelection) => void
   * }
   * ```
   */
  export interface SelectedIndexState {
    selectedIndex: SelectedIndexType;
    setSelectedIndex: (e: SelectedIndexType) => void;
  }

  /**
   * Tracks edited item information
   * @remarks Maintains state for currently edited file or content
   * @property {number} index - Index of edited item
   * @property {any} contents - Contents being edited
   * @property {string} name - Name of edited item
   * @example
   * ```typescript
   * const editState: SelectedEditIndexType = {
   *   index: 1,
   *   contents: "File contents here",
   *   name: "notes.txt"
   * }
   * ```
   */
  export interface SelectedEditIndexType {
    index: number;
    contents: T;
    name: string;
  }

  /**
   * State management for edit index
   * @remarks Manages edit selection state and setter function
   * @property {SelectedEditIndexType} selectedEditIndex - Current edit selection state
   * @property {Function} setSelectedEditIndex - Function to update edit selection
   * @property {boolean} isEditing - Flag indicating active editing state
   * @property {string} editPath - Path to currently edited item
   * @property {Date} lastModified - Timestamp of last modification
   * @example
   * ```typescript
   * const editIndexState: SelectedEditIndexState = {
   *   selectedEditIndex: {
   *     index: 0,
   *     contents: "File content here",
   *     name: "document.txt"
   *   },
   *   setSelectedEditIndex: (newState) => void
   * }
   * ```
   */
  export interface SelectedEditIndexState {
    selectedEditIndex: SelectedEditIndexType;
    setSelectedEditIndex: Dispatch<SetStateAction<SelectedEditIndexType>>;
  }

  /**
   * Save state tracking
   * @remarks Manages document save status and timing
   * @property {boolean} saveIsCurrent - Whether the document is currently saved
   * @property {Date | null} lastSaveDate - Timestamp of the last save operation
   * @example
   * ```typescript
   * const saveState: SaveType = {
   *   saveIsCurrent: true,
   *   lastSaveDate: new Date()
   * }
   * ```
   */
  export interface SaveType {
    saveIsCurrent: boolean;
    lastSaveDate: Date | null;
  }

  /**
   * Context type for save state
   * @remarks Provides save state access throughout component tree
   * @property {SaveType} saveState - Current save state object
   * @property {Function} setSaveState - Function to update save state
   * @example
   * ```typescript
   * const saveContext: SaveStateContextType = {
   *   saveState: {
   *     saveIsCurrent: true,
   *     lastSaveDate: new Date()
   *   },
   *   setSaveState: (newState) => void
   * }
   * ```
   */
  export interface SaveStateContextType {
    saveState: SaveType;
    setSaveState: (e: SaveType) => void;
  }

  /**
   * Structure for notification content
   * @remarks Defines type and message for system notifications
   * @property {string} type - Type of notification (success, error, warning, info)
   * @property {string} message - Content of the notification message
   * @example
   * ```typescript
   * const notification: NotificationContentType = {
   *   type: "success",
   *   message: "Changes saved successfully"
   * }
   * ```
   */
  export interface NotificationContentType {
    type: "success" | "error" | "warning" | "info";
    message: string;
  }

  interface FileLocationContextType {
    fileLocation: string[]; // Make sure this matches your expected type
    setFileLocation: React.Dispatch<React.SetStateAction<string[]>>;
  }

  /**
   * Toggle state for rename operations
   * @remarks Controls rename modal visibility
   * @property {boolean} renameIsOpen - Current visibility state of rename modal
   * @property {Function} setRenameIsOpen - Function to toggle rename modal visibility
   * @example
   * ```typescript
   * const renameState: RenameToggleState = {
   *   renameIsOpen: false,
   *   setRenameIsOpen: (isOpen) => void
   * }
   * ```
   */
  export interface RenameToggleState {
    renameIsOpen: boolean;
    setRenameIsOpen: (e: boolean) => void;
  }

  /**
   * Toggle state for new item creation
   * @remarks Controls new item modal visibility
   * @property {boolean} newIsOpen - Current visibility state of new item modal
   * @property {Function} setNewIsOpen - Function to toggle new item modal visibility
   * @example
   * ```typescript
   * const newItemState: NewItemToggleState = {
   *   newIsOpen: false,
   *   setNewIsOpen: (isOpen) => void
   * }
   * ```
   */
  export interface NewItemToggleState {
    newIsOpen: boolean;
    setNewIsOpen: (e: boolean) => void;
  }

  /**
   * Toggle state for delete operations
   * @remarks Controls delete confirmation modal visibility
   * @property {boolean} deleteIsOpen - Current visibility state of delete confirmation modal
   * @property {Function} setDeleteIsOpen - Function to toggle delete confirmation modal visibility
   * @example
   * ```typescript
   * const deleteState: DeleteToggleState = {
   *   deleteIsOpen: true,
   *   setDeleteIsOpen: (isOpen) => void
   * }
   * ```
   */
  export interface DeleteToggleState {
    deleteIsOpen: boolean;
    setDeleteIsOpen: (e: boolean) => void;
  }

  /**
   * Toggle state for save operations
   * @remarks Controls save dialog visibility
   * @property {boolean} saveIsOpen - Current visibility state of save dialog
   * @property {Function} setSaveIsOpen - Function to toggle save dialog visibility
   * @example
   * ```typescript
   * const saveToggleState: SaveToggleState = {
   *   saveIsOpen: false,
   *   setSaveIsOpen: (isOpen) => void
   * }
   * ```
   */
  export interface SaveToggleState {
    saveIsOpen: boolean;
    setSaveIsOpen: (e: boolean) => void;
  }

  /**
   * State for index sorting
   * @remarks Controls sort direction and visibility
   * @property {boolean} indexSort - Current sort state
   * @property {Function} setIndexSort - Function to update sort state
   * @example
   * ```typescript
   * const indexState: IndexSortState = {
   *   indexSort: true,
   *   setIndexSort: (isSorting) => void
   * }
   * ```
   */
  export interface IndexSortState {
    indexSort: boolean;
    setIndexSort: (e: boolean) => void;
  }

  /**
   * Toggle state for notifications
   * @remarks Controls notification visibility and update mechanism
   * @property {boolean} notifyToggle - Current visibility state
   * @property {Function} setNotifyToggle - Function to update visibility
   * @example
   * ```typescript
   * const notificationToggle: NotificationToggleState = {
   *   notifyToggle: false,
   *   setNotifyToggle: (isVisible) => void
   * }
   * ```
   */
  export interface NotificationToggleState {
    notifyToggle: boolean;
    setNotifyToggle: (e: boolean) => void;
  }

  /**
   * State management for notification content
   * @remarks Manages current notification message and type
   * @property {NotificationContentType} notifyContent - Current notification content
   * @property {Function} setNotifyContent - Function to update notification content
   * @example
   * ```typescript
   * const notificationState: NotificationContentState = {
   *   notifyContent: {
   *     type: "success",
   *     message: "File saved successfully"
   *   },
   *   setNotifyContent: (content) => void
   * }
   * ```
   */
  export interface NotificationContentState {
    /** Current notification content */
    notifyContent: NotificationContentType;
    /** Function to update notification content */
    setNotifyContent: (e: NotificationContentType) => void;
  }

  /**
   * File location state management
   * @remarks Tracks current path in file tree
   * @property {string[]} fileLocation - Current file path segments
   * @property {Function} setFileLocation - Function to update current location
   * @example
   * ```typescript
   * const locationState: FileLocationState = {
   *   fileLocation: ["documents", "projects", "research"],
   *   setFileLocation: (newPath) => void
   * }
   * ```
   */
  export interface FileLocationState {
    /** Current file path segments */
    fileLocation: FileLocationType;
    /** Function to update current location */
    setFileLocation: (e: FileLocationType) => void;
  }

  export type FileLocationType = string[];

  /**
   * Extended node type for edge representation
   * @remarks Used in Lexical editor for edge annotations
   * @property {string} type - Edge node type identifier
   * @property {string} id - Unique edge identifier
   * @property {string} text - Edge text content
   * @example
   * ```typescript
   * const edgeNode: SerializedEdgeNode = {
   *   type: "edge",
   *   id: "edge-1",
   *   text: "connects to",
   *   ...SerializedTextNode
   * }
   * ```
   */
  export interface SerializedEdgeNode extends SerializedTextNode {
    /** Edge node type identifier */
    type: "edge";
    /** Unique edge identifier */
    id: string;
    /** Edge text content */
    text: string;
  }

  /**
   * Context type for logging functionality
   * @typedef {Object} LogContextType
   * @property {LogEntry[]} logs - Array of log entries
   * @property {function} addLogs - Method to add new log entries
   * @property {string} sessionLogFilename - Unique filename for the current logging session
   */
  interface LogContextType {
    addLogs: (log: LogEntry) => void;
    sessionLogFilename: string;
  }

  export interface HandleLoggerType {
    message: string;
    level: LogLevel;
    metadata?: LogEntryMetadata;
  }

  export interface HandleLogger {
    (params: HandleLoggerType): void;
  }

  export type EditorHandle = {
    editor: LexicalEditor;
    getState: () => EditorState;
    updateState: (state: SerializedEditorState | EditorState) => void;
    isEmpty: () => boolean;
  };

  export interface SanitizedLogEntry {
    message: string;
    level: LogLevel;
    metadata?: Record<string, any>;
    timestamp?: string;
  }

  /**
  * @title Editor Initial Configuration
  * @interface
  * @remarks Defines the structure for Lexical editor initialization
  */
 export interface EditorInitialConfig {
   namespace: string;
   onError: (error: Error) => void;
   nodes: any[];
   editorState?: EditorState;
   theme: {
     edge: string;
   };
 }
 
 export type EditorHandle = {
   editor: LexicalEditor;
   getState: () => EditorState;
   updateState: (state: EditorState) => void;
   isEmpty: () => boolean;
   isDirty: () => boolean;
 };
}
