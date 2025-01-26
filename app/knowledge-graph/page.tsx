"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { PlotParams } from "react-plotly.js";
import dynamic from "next/dynamic";
import { useKnowledgeGraphContext } from "components/providers/subproviders/KnowledgeGraphProvider";
import { LogEntry, LogEntryMetadata, LogLevel } from "types/types";
import { useLogger } from "components/logging/LogWrapper";

const Plot = dynamic(() => import("react-plotly.js"), {
  ssr: false,
}) as React.ComponentType<Partial<PlotParams>>;

interface UIContextType {
  logQueue: LogEntry[];
  addToLogQueue: (log: LogEntry) => void;
  processLogQueue: () => void;
}

/**
 * Knowledge graph visualization component
 * @component
 *
 * @remarks
 * Features:
 * - 3D interactive graph visualization
 * - Dynamic node and edge rendering
 * - Responsive sizing
 * - Loading states
 * - Real-time updates
 * - Integration with knowledge graph context
 *
 * @returns {JSX.Element} 3D graph visualization
 */
export default function PlotlyChart(): React.JSX.Element {
  const [plotData, setPlotData] = useState<any>(null);
  const [isDataLoading, setIsDataLoading] = useState<boolean>(true);
  const [isPlotRendering, setIsPlotRendering] = useState<boolean>(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const { graphState } = useKnowledgeGraphContext();
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
          metadata: { ...metadata, component: "KnowledgeGraph" },
        });
      } catch (error: any) {
        console.error("Log submission error", error.message);
      }
    },
    [addLogs]
  );

  // Load initial empty plot structure
  useEffect(() => {
    const loadEmptyPlot = async () => {
      try {
        const response = await fetch("/emptyPlot.json");
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const emptyPlot = await response.json();
        setPlotData(emptyPlot);
      } catch (error) {
        console.error("Error loading empty plot:", error);
      } finally {
        setIsDataLoading(false);
      }
    };
    loadEmptyPlot();
  }, []);

  useEffect(() => {
    handleLogger({
      message: "Knowledge Graph mounted",
      level: "INFO",
    });
  }, [handleLogger]);

  /**
   * Loading indicator component
   * @component
   * @param {Object} props
   * @param {string} props.message - Loading message to display
   * @returns {JSX.Element} Spinner with message
   */
  const LoadingSpinner = ({ message }: { message: string }) => (
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
      <p className="text-lg text-gray-600">{message}</p>
    </div>
  );

  const renderContent = () => {
    if (isDataLoading) {
      return (
        <div className="w-full h-[80vh] flex items-center justify-center border border-gray-200 rounded-lg bg-white">
          <LoadingSpinner message="Loading Data..." />
        </div>
      );
    }

    if (!plotData || !finalPlotData) {
      return (
        <div className="w-full h-[80vh] flex items-center justify-center border border-gray-200 rounded-lg bg-white">
          <p className="text-lg text-gray-600">No data available</p>
        </div>
      );
    }

    return (
      <div
        ref={containerRef}
        className="w-full h-[80vh] border border-gray-200 rounded-lg bg-white"
        style={{ minHeight: "80vh" }}
      >
        {isPlotRendering && (
          <div className="w-full h-[80vh] flex items-center justify-center border border-gray-200 rounded-lg bg-white">
            <LoadingSpinner message="Rendering Plot..." />
          </div>
        )}
        <Plot
          data={finalPlotData.data}
          layout={{
            ...finalPlotData.layout,
            width: dimensions.width,
            height: dimensions.height,
          }}
          config={{
            responsive: true,
            displayModeBar: true,
            displaylogo: false,
            scrollZoom: true,
          }}
          style={{ width: "100%", height: "100%" }}
          onInitialized={(figure) => {
            setIsPlotRendering(false);
          }}
          onUpdate={(figure) => {
            setIsPlotRendering(false);
          }}
          onError={() => {
            setIsPlotRendering(false);
          }}
          onRedraw={() => {
            setIsPlotRendering(true);
          }}
          onAfterPlot={() => {
            setIsPlotRendering(false);
          }}
        />
      </div>
    );
  };

  // Update plot when nodes or edges change  // Update plot when nodes change
  const getUpdatedPlotData = useCallback(() => {
    if (!plotData || !graphState?.nodes) return null;
    setIsPlotRendering(true);

    const updatedPlot = {
      ...plotData,
      data: [
        {
          type: "scatter3d",
          mode: "lines",
          x: [],
          y: [],
          z: [],
          line: { color: "black", width: 2 },
          hoverinfo: "none",
          name: "Edges", // Add name for debugging
        },
        {
          type: "scatter3d",
          mode: "markers+text",
          x: graphState.nodes.map((node: any) => node.x),
          y: graphState.nodes.map((node: any) => node.y),
          z: graphState.nodes.map((node: any) => node.z),
          text: graphState.nodes.map((node: any) => node.label),
          textposition: "top center",
          marker: {
            symbol: "circle",
            size: 10,
            color: graphState.nodes.map((_: any, i: any) => i),
            line: { color: "black", width: 0.5 },
          },
          hoverinfo: "text",
          name: "Nodes", // Add name for debugging
        },
      ],
    };

    // Add edges if they exist
    if (graphState.edges && graphState.edges.length > 0) {
      const edgeTraces = {
        x: [] as (number | null)[],
        y: [] as (number | null)[],
        z: [] as (number | null)[],
      };

      graphState.edges.forEach((edge: any) => {
        const sourceNode: any = graphState.nodes.find(
          (n: any) => n.id === edge.source
        );
        const targetNode: any = graphState.nodes.find(
          (n: any) => n.id === edge.target
        );

        if (sourceNode && targetNode) {
          // Add the source point
          edgeTraces.x.push(sourceNode.x);
          edgeTraces.y.push(sourceNode.y);
          edgeTraces.z.push(sourceNode.z);

          // Add the target point
          edgeTraces.x.push(targetNode.x);
          edgeTraces.y.push(targetNode.y);
          edgeTraces.z.push(targetNode.z);

          // Add null to create a break in the line
          edgeTraces.x.push(null);
          edgeTraces.y.push(null);
          edgeTraces.z.push(null);
        }
      });

      // Update the first trace with the edge data
      updatedPlot.data[0] = {
        ...updatedPlot.data[0],
        x: edgeTraces.x,
        y: edgeTraces.y,
        z: edgeTraces.z,
        type: "scatter3d",
        mode: "lines",
        line: {
          color: "black",
          width: 2,
          dash: "solid", // Make sure lines are solid
        },
        opacity: 1, // Make sure lines are visible
        showlegend: true, // Show in legend for debugging
      };
    }
    return updatedPlot;
  }, [graphState, plotData]);

  // Handle window resize
  useEffect(() => {
    const updateDimensions = () => {
      // Store current ref in a local variable to avoid closure issues
      const container = containerRef.current;
      if (container) {
        const newDimensions = {
          width: container.offsetWidth || 800,
          height: container.offsetHeight || 800,
        };
        console.log("New dimensions:", newDimensions);
        setDimensions(newDimensions);
      }
    };

    // Initial update
    updateDimensions();

    // Create ResizeObserver for more reliable dimension updates
    const resizeObserver = new ResizeObserver(updateDimensions);

    // Capture the current ref value
    const currentContainer = containerRef.current;
    if (currentContainer) {
      resizeObserver.observe(currentContainer);
    }

    // Cleanup using captured ref
    return () => {
      if (currentContainer) {
        resizeObserver.unobserve(currentContainer);
      }
    };
  }, [containerRef]); // Add containerRef to dependency array

  const finalPlotData = useMemo(
    () => getUpdatedPlotData(),
    [getUpdatedPlotData]
  );

  useEffect(() => {
    console.log("Current Graph State:", graphState);
    console.log("Current Plot Data:", plotData);
    console.log("Final Plot Data:", finalPlotData);
    console.log("Current Dimensions:", dimensions);
  }, [graphState, plotData, finalPlotData, dimensions]);

  return <div className="w-full h-screen p-4 bg-white">{renderContent()}</div>;
}
