import { NextRequest, NextResponse } from "next/server";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import { LogLevel } from "types/types";

const writeLog = async (
  level: LogLevel,
  message: string,
  metadata?: Record<string, any>
): Promise<void> => {
  if (!metadata?.filename) {
    console.error(`Logging Error: No filename provided for ${level} log`);
    return;
  }

  try {
    const logsDir = path.join(process.cwd(), ".logs");

    await fs.mkdir(logsDir, { recursive: true });

    const filteredMetadata = { ...metadata };
    delete filteredMetadata.filename;

    const timestamp = new Date().toLocaleString();
    const logEntry =
      JSON.stringify({
        timestamp,
        level,
        message,
        ...(Object.keys(filteredMetadata).length > 0
          ? { metadata: filteredMetadata }
          : {}),
      }) + "\n";

    const logPath = path.join(logsDir, metadata?.filename);

    await fs.appendFile(logPath, logEntry);
  } catch (error) {
    console.error("Logging error:", error);
  }
};

/**
 * Logging utility functions
 */
const LoggerAPI = {
  /**
   * Log a debug message
   * @param {string} message - Debug message
   * @param {object} [metadata] - Optional metadata with required filename
   */
  debug: (message: string, metadata?: Record<string, any>) => {
    if (!metadata?.filename) {
      console.error("Debug log requires a filename in metadata");
      return Promise.resolve();
    }
    return writeLog("DEBUG", message, metadata);
  },

  /**
   * Log an info message
   * @param {string} message - Info message
   * @param {object} [metadata] - Optional metadata with required filename
   */
  info: (message: string, metadata?: Record<string, any>) => {
    if (!metadata?.filename) {
      console.error("Info log requires a filename in metadata");
      return Promise.resolve();
    }
    return writeLog("INFO", message, metadata);
  },

  /**
   * Log an error message
   * @param {string} message - Error message
   * @param {Error} [error] - Optional error object
   * @param {object} [metadata] - Optional metadata with required filename
   */
  error: (message: string, error?: Error, metadata?: Record<string, any>) => {
    if (!metadata?.filename) {
      console.error("Error log requires a filename in metadata");
      return Promise.resolve();
    }
    return writeLog(
      "ERROR",
      message,
      error
        ? {
            ...metadata,
            name: error.name,
            message: error.message,
            stack: error.stack,
          }
        : metadata
    );
  },
  /**
   * Log a warning message
   * @param {string} message - Warning message
   * @param {object} [metadata] - Optional metadata with required filename
   */
  warn: (message: string, metadata?: Record<string, any>) => {
    if (!metadata?.filename) {
      console.error("Warning log requires a filename in metadata");
      return Promise.resolve();
    }
    return writeLog("WARN", message, metadata);
  },
};

/**
 * POST route for logging entries
 * @param {NextRequest} request - Incoming log request
 * @returns {Promise<NextResponse>} Logging operation result
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  console.log("Received log request");

  try {
    const logEntries = await request.json();

    const entries = Array.isArray(logEntries) ? logEntries : [logEntries];

    if (entries && entries.length > 0) {
      for (const entry of entries) {
        console.log("Processing log entry:", entry);

        if (!entry.metadata?.filename) {
          console.error(
            "Logging Error: No filename provided in metadata for entry",
            entry
          );
          continue;
        }

        await writeLog(entry.level || "INFO", entry.message, {
          ...entry.metadata,
          filename: entry.metadata.filename,
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: "Logs processed successfully",
    });
  } catch (error) {
    await LoggerAPI.error("Error processing log entries", error as Error);
    console.error("Full logging error in POST route:", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * GET route for retrieving logs (placeholder)
 * @param {NextRequest} request - Incoming log retrieval request
 * @returns {Promise<NextResponse>} Log retrieval result
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    return NextResponse.json({
      success: true,
      message: "Log retrieval not implemented",
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
