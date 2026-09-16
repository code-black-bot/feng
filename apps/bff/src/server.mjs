import { createServer } from "node:http";
import { randomUUID } from "node:crypto";
import { Readable } from "node:stream";

const host = process.env.BFF_HOST ?? "127.0.0.1";
const port = Number(process.env.BFF_PORT ?? 3001);
const pythonBaseUrl = process.env.PYTHON_SERVICE_URL ?? "http://127.0.0.1:8000";
const allowedOrigin = process.env.WEB_ORIGIN ?? "http://localhost:3000";
const requestLimit = Number(process.env.RATE_LIMIT_PER_MINUTE ?? 120);
const buckets = new Map();

const routeMap = [
  ["/api/v1/dashboard/summary", "/internal/v1/dashboard/summary"],
  ["/api/v1/orders", "/internal/v1/orders"],
  ["/api/v1/tickets", "/internal/v1/tickets"],
  ["/api/v1/observability/overview", "/internal/v1/observability/overview"],
  ["/api/v1/observability/logs", "/internal/v1/observability/logs"],
  ["/api/v1/channels", "/internal/v1/channels"],
  ["/api/v1/agent/status", "/internal/v1/agent/status"],
  ["/api/v1/agent/chat", "/internal/v1/agent/chat"],
  ["/api/v1/mcp", "/internal/v1/mcp"],
];

function json(res, status, payload, requestId) {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "content-length": Buffer.byteLength(body),
    "x-request-id": requestId,
  });
  res.end(body);
}

function applyCommonHeaders(res, requestId) {
  res.setHeader("x-request-id", requestId);
  res.setHeader("x-content-type-options", "nosniff");
  res.setHeader("x-frame-options", "DENY");
  res.setHeader("referrer-policy", "strict-origin-when-cross-origin");
  res.setHeader("access-control-allow-origin", allowedOrigin);
  res.setHeader("access-control-allow-credentials", "true");
  res.setHeader("access-control-allow-headers", "content-type, x-request-id");
  res.setHeader("access-control-allow-methods", "GET, POST, OPTIONS");
}

function allowRequest(req) {
  const ip = req.socket.remoteAddress ?? "unknown";
  const minute = Math.floor(Date.now() / 60_000);
  const key = ip + ":" + minute;
  const count = (buckets.get(key) ?? 0) + 1;
  buckets.set(key, count);
  if (buckets.size > 10_000) buckets.clear();
  return count <= requestLimit;
}

function resolveTarget(pathname) {
  for (const [external, internal] of routeMap) {
    if (pathname === external || pathname.startsWith(external + "/")) {
      return internal + pathname.slice(external.length);
    }
  }
  return null;
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on("data", (chunk) => {
      size += chunk.length;
      if (size > 1_000_000) {
        reject(new Error("REQUEST_TOO_LARGE"));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

const server = createServer(async (req, res) => {
  const startedAt = performance.now();
  const requestId =
    typeof req.headers["x-request-id"] === "string"
      ? req.headers["x-request-id"]
      : "req_" + randomUUID().replaceAll("-", "").slice(0, 12);

  applyCommonHeaders(res, requestId);

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  if (!allowRequest(req)) {
    json(
      res,
      429,
      {
        error: {
          code: "RATE_LIMITED",
          message: "请求过于频繁，请稍后再试",
          request_id: requestId,
        },
      },
      requestId,
    );
    return;
  }

  const url = new URL(req.url ?? "/", "http://localhost");
  if (url.pathname === "/health/live") {
    json(res, 200, { status: "ok", service: "node-bff" }, requestId);
    return;
  }

  const targetPath = resolveTarget(url.pathname);
  if (!targetPath) {
    json(
      res,
      404,
      {
        error: {
          code: "ROUTE_NOT_FOUND",
          message: "接口不存在",
          request_id: requestId,
        },
      },
      requestId,
    );
    return;
  }

  try {
    const body =
      req.method === "GET" || req.method === "HEAD"
        ? undefined
        : await readBody(req);
    const targetUrl = new URL(targetPath + url.search, pythonBaseUrl);
    const upstreamTimeout = url.pathname.startsWith("/api/v1/agent/") ? 60_000 : 15_000;
    const upstream = await fetch(targetUrl, {
      method: req.method,
      body,
      headers: {
        "content-type": req.headers["content-type"] ?? "application/json",
        "x-request-id": requestId,
        "x-demo-user": "merchant_demo",
      },
      signal: AbortSignal.timeout(upstreamTimeout),
    });

    res.statusCode = upstream.status;
    const contentType = upstream.headers.get("content-type");
    if (contentType) res.setHeader("content-type", contentType);
    res.setHeader("x-data-source", upstream.headers.get("x-data-source") ?? "api");

    if (upstream.body) {
      Readable.fromWeb(upstream.body).pipe(res);
    } else {
      res.end();
    }

    console.log(
      JSON.stringify({
        service: "node-bff",
        request_id: requestId,
        method: req.method,
        path: url.pathname,
        status: upstream.status,
        duration_ms: Math.round(performance.now() - startedAt),
      }),
    );
  } catch (error) {
    const code = error instanceof Error ? error.message : "UPSTREAM_ERROR";
    json(
      res,
      code === "REQUEST_TOO_LARGE" ? 413 : 502,
      {
        error: {
          code,
          message:
            code === "REQUEST_TOO_LARGE"
              ? "请求内容过大"
              : "业务服务暂时不可用",
          request_id: requestId,
        },
      },
      requestId,
    );
  }
});

server.listen(port, host, () => {
  console.log("Node BFF listening on http://" + host + ":" + port);
  console.log("Proxying mock business data from " + pythonBaseUrl);
});
