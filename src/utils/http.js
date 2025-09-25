import { URL } from "url";

export const parseJsonBody = async (req) => {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }
  if (!chunks.length) {
    return {};
  }
  const raw = Buffer.concat(chunks).toString("utf-8");
  if (!raw) {
    return {};
  }
  try {
    return JSON.parse(raw);
  } catch (err) {
    const error = new Error("Invalid JSON body");
    error.statusCode = 400;
    throw error;
  }
};

export const sendJson = (res, statusCode, payload) => {
  const body = JSON.stringify(payload);
  res.writeHead(statusCode, {
    "Content-Type": "application/json",
    "Content-Length": Buffer.byteLength(body),
  });
  res.end(body);
};

export const sendError = (res, statusCode, message, meta = {}) => {
  sendJson(res, statusCode, {
    error: message,
    ...meta,
  });
};

export const parseRequestUrl = (req) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  return {
    pathname: url.pathname,
    query: Object.fromEntries(url.searchParams.entries()),
  };
};

export const notFound = (res) => {
  sendError(res, 404, "Not found");
};
