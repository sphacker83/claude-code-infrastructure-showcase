type LoggerMethod = (...message: unknown[]) => void;

const isDevelopment = process.env.NODE_ENV !== "production";

function createLogger(method: LoggerMethod, enabled: boolean): LoggerMethod {
  if (!enabled) {
    return () => undefined;
  }

  return (...message) => method("[seed3]", ...message);
}

export const seed3Logger = {
  debug: createLogger(console.debug, isDevelopment),
  info: createLogger(console.info, true),
  warn: createLogger(console.warn, true),
  error: createLogger(console.error, true),
};
