/**
 * Structured logger for the server. Use for request logging, errors, and cost/audit.
 */
type LogLevel = "debug" | "info" | "warn" | "error";

interface LogMeta {
  [key: string]: unknown;
}

function formatMessage(level: LogLevel, message: string, meta?: LogMeta): string {
  const payload = { level, message, ...meta, timestamp: new Date().toISOString() };
  return JSON.stringify(payload);
}

function log(level: LogLevel, message: string, meta?: LogMeta): void {
  const out = formatMessage(level, message, meta);
  switch (level) {
    case "debug":
      if (process.env.NODE_ENV === "development") console.debug(out);
      break;
    case "info":
      console.info(out);
      break;
    case "warn":
      console.warn(out);
      break;
    case "error":
      console.error(out);
      break;
    default:
      console.info(out);
  }
}

export const logger = {
  debug: (message: string, meta?: LogMeta) => log("debug", message, meta),
  info: (message: string, meta?: LogMeta) => log("info", message, meta),
  warn: (message: string, meta?: LogMeta) => log("warn", message, meta),
  error: (message: string, meta?: LogMeta) => log("error", message, meta),
};
