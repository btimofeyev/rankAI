import pino from "pino";
import { config } from "../config/index.js";

const logger = pino({
  level: config.logLevel,
  base: undefined,
});

export default logger;
