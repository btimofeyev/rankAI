import http from "http";
import { config } from "./config/index.js";
import logger from "./utils/logger.js";
import { router } from "./routes/index.js";

const PORT = config.port;

const server = http.createServer(async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  try {
    await router.handle(req, res);
  } catch (err) {
    logger.error({ err, method: req.method, url: req.url }, "Unhandled error in request lifecycle");
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Internal server error" }));
  }
});

server.listen(PORT, () => {
  logger.info({ port: PORT }, "RankAI server listening");
});
