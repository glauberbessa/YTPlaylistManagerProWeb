/**
 * Centralized Logging Service for Auth Debugging
 *
 * This module provides structured logging for debugging authentication
 * issues in Vercel production environment.
 */

export type LogLevel = "debug" | "info" | "warn" | "error" | "critical";
export type LogCategory =
  | "AUTH"
  | "AUTH_CALLBACK"
  | "AUTH_JWT"
  | "AUTH_SESSION"
  | "AUTH_ROUTE"
  | "AUTH_PKCE"
  | "GOOGLE_OAUTH"
  | "YOUTUBE_API"
  | "API"
  | "DATABASE"
  | "SYSTEM";

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  category: LogCategory;
  message: string;
  context?: Record<string, unknown>;
  traceId?: string;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

// In-memory log storage for the diagnostic endpoint
// Stores last N logs for each category
const MAX_LOGS_PER_CATEGORY = 50;
const logStore: Map<LogCategory, LogEntry[]> = new Map();

// Global trace ID for request correlation
let currentTraceId: string | null = null;

/**
 * Generate a unique trace ID for request correlation
 */
export function generateTraceId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `${timestamp}-${random}`;
}

/**
 * Set the current trace ID for the request
 */
export function setTraceId(traceId: string): void {
  currentTraceId = traceId;
}

/**
 * Get the current trace ID
 */
export function getTraceId(): string | null {
  return currentTraceId;
}

/**
 * Clear the current trace ID
 */
export function clearTraceId(): void {
  currentTraceId = null;
}

/**
 * Format log entry for console output
 */
function formatLogEntry(entry: LogEntry): string {
  const levelIcon = {
    debug: "\u{1F50D}",
    info: "\u{2139}\u{FE0F}",
    warn: "\u{26A0}\u{FE0F}",
    error: "\u{274C}",
    critical: "\u{1F6A8}",
  }[entry.level];

  const separator = "=".repeat(80);
  const lines: string[] = [];

  lines.push(`\n${separator}`);
  lines.push(
    `${levelIcon} [${entry.level.toUpperCase()}] [${entry.category}] ${entry.timestamp}`
  );
  if (entry.traceId) {
    lines.push(`   TraceID: ${entry.traceId}`);
  }
  lines.push(separator);
  lines.push(`   ${entry.message}`);

  if (entry.context && Object.keys(entry.context).length > 0) {
    lines.push(`\n   Context:`);
    for (const [key, value] of Object.entries(entry.context)) {
      const valueStr =
        typeof value === "object" ? JSON.stringify(value, null, 2) : String(value);
      // Indent multi-line values
      const indentedValue = valueStr.split("\n").join("\n      ");
      lines.push(`     - ${key}: ${indentedValue}`);
    }
  }

  if (entry.error) {
    lines.push(`\n   Error Details:`);
    lines.push(`     - Name: ${entry.error.name}`);
    lines.push(`     - Message: ${entry.error.message}`);
    if (entry.error.stack) {
      lines.push(`     - Stack:\n       ${entry.error.stack.split("\n").join("\n       ")}`);
    }
  }

  lines.push(separator);

  return lines.join("\n");
}

/**
 * Store log entry in memory for diagnostic endpoint
 */
function storeLog(entry: LogEntry): void {
  if (!logStore.has(entry.category)) {
    logStore.set(entry.category, []);
  }

  const categoryLogs = logStore.get(entry.category)!;
  categoryLogs.push(entry);

  // Keep only the last N logs
  while (categoryLogs.length > MAX_LOGS_PER_CATEGORY) {
    categoryLogs.shift();
  }
}

/**
 * Main logging function
 */
export function log(
  level: LogLevel,
  category: LogCategory,
  message: string,
  context?: Record<string, unknown>,
  error?: Error
): void {
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    category,
    message,
    context,
    traceId: currentTraceId || undefined,
    error: error
      ? {
          name: error.name,
          message: error.message,
          stack: error.stack,
        }
      : undefined,
  };

  // Store log entry
  storeLog(entry);

  // Format and output to console
  const formatted = formatLogEntry(entry);

  switch (level) {
    case "debug":
      console.debug(formatted);
      break;
    case "info":
      console.info(formatted);
      break;
    case "warn":
      console.warn(formatted);
      break;
    case "error":
    case "critical":
      console.error(formatted);
      break;
  }
}

/**
 * Convenience logging methods
 */
export const logger = {
  debug: (category: LogCategory, message: string, context?: Record<string, unknown>) =>
    log("debug", category, message, context),

  info: (category: LogCategory, message: string, context?: Record<string, unknown>) =>
    log("info", category, message, context),

  warn: (category: LogCategory, message: string, context?: Record<string, unknown>) =>
    log("warn", category, message, context),

  error: (
    category: LogCategory,
    message: string,
    error?: Error,
    context?: Record<string, unknown>
  ) => log("error", category, message, context, error || undefined),

  critical: (
    category: LogCategory,
    message: string,
    error?: Error,
    context?: Record<string, unknown>
  ) => log("critical", category, message, context, error || undefined),

  /**
   * Log Google OAuth operations
   */
  googleOAuth: (operation: string, success: boolean, details?: Record<string, unknown>) =>
    log(
      success ? "info" : "error",
      "GOOGLE_OAUTH",
      `[${success ? "SUCCESS" : "FAILED"}] ${operation}`,
      details
    ),

  /**
   * Log YouTube API operations
   */
  youtubeApi: (
    operation: string,
    success: boolean,
    details?: Record<string, unknown>,
    error?: Error
  ) =>
    log(
      success ? "info" : "error",
      "YOUTUBE_API",
      `[${success ? "SUCCESS" : "FAILED"}] ${operation}`,
      details,
      error
    ),

  /**
   * Log database operations
   */
  database: (
    operation: string,
    success: boolean,
    details?: Record<string, unknown>,
    error?: Error
  ) =>
    log(
      success ? "info" : "error",
      "DATABASE",
      `[${success ? "SUCCESS" : "FAILED"}] ${operation}`,
      details,
      error
  ),
};

/**
 * Get stored logs for diagnostic endpoint
 */
export function getStoredLogs(
  category?: LogCategory,
  level?: LogLevel,
  limit?: number
): LogEntry[] {
  let logs: LogEntry[] = [];

  if (category) {
    logs = logStore.get(category) || [];
  } else {
    // Get all logs from all categories
    // Use Array.from to convert iterator for compatibility
    const allCategories = Array.from(logStore.values());
    for (const categoryLogs of allCategories) {
      logs.push(...categoryLogs);
    }
  }

  // Filter by level if specified
  if (level) {
    const levelOrder: LogLevel[] = ["debug", "info", "warn", "error", "critical"];
    const minLevelIndex = levelOrder.indexOf(level);
    logs = logs.filter((l) => levelOrder.indexOf(l.level) >= minLevelIndex);
  }

  // Sort by timestamp (most recent first)
  logs.sort((a, b) => b.timestamp.localeCompare(a.timestamp));

  // Apply limit
  if (limit) {
    logs = logs.slice(0, limit);
  }

  return logs;
}

/**
 * Clear all stored logs
 */
export function clearStoredLogs(): void {
  logStore.clear();
}

/**
 * Get a summary of stored logs by category and level
 */
export function getLogSummary(): Record<LogCategory, Record<LogLevel, number>> {
  const summary: Record<string, Record<string, number>> = {};

  // Use Array.from to convert iterator for compatibility
  const entries = Array.from(logStore.entries());
  for (const [category, logs] of entries) {
    summary[category] = {
      debug: 0,
      info: 0,
      warn: 0,
      error: 0,
      critical: 0,
    };

    for (const logEntry of logs) {
      summary[category][logEntry.level]++;
    }
  }

  return summary as Record<LogCategory, Record<LogLevel, number>>;
}

/**
 * Environment info logger - logs key environment variables
 */
export function logEnvironmentInfo(): void {
  const env = {
    NODE_ENV: process.env.NODE_ENV,
    VERCEL: process.env.VERCEL || "not set",
    VERCEL_ENV: process.env.VERCEL_ENV || "not set",
    VERCEL_URL: process.env.VERCEL_URL ? "[SET]" : "[NOT SET]",
    NEXTAUTH_URL: process.env.NEXTAUTH_URL ? "[SET]" : "[NOT SET]",
    AUTH_URL: process.env.AUTH_URL ? "[SET]" : "[NOT SET]",
    AUTH_SECRET: process.env.AUTH_SECRET ? "[SET]" : "[NOT SET]",
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? "[SET]" : "[NOT SET]",
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ? "[SET]" : "[NOT SET]",
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET ? "[SET]" : "[NOT SET]",
    DATABASE_URL: process.env.DATABASE_URL ? "[SET]" : "[NOT SET]",
  };

  logger.info("SYSTEM", "Environment Configuration", env);
}

// Environment info is available via logEnvironmentInfo when needed.
