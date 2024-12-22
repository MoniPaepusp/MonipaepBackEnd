import { createLogger, format, transports } from "winston";

const logger = createLogger({
  level: "info",
  format: format.combine(
    format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    format.errors({ stack: true }),
    format.splat(),
    format.printf(({ timestamp, level, message, ...meta }) => {
      const metaString = Object.keys(meta).length
        ? JSON.stringify(meta, null, 2)
        : "";
      return `[${timestamp}] - ${level}: ${message} ${metaString}`;
    }),
  ),
  transports: [
    new transports.Console({
      format: format.combine(
        format.colorize({ colors: { info: "green", error: "red" } }),
        format.printf(({ timestamp, level, message, ...meta }) => {
          const metaString = Object.keys(meta).length
            ? JSON.stringify(meta, null, 2)
            : "";
          return `[${timestamp}] - ${level}: ${message} ${metaString}`;
        }),
      ),
    }),
  ],
});

export default logger;
