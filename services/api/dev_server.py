"""Dependency-free mock server for local preview.

The production-shaped API lives in app/main.py and uses FastAPI. This tiny
server exposes the same read-only endpoints so the mock stack can be previewed
before Python dependencies are installed.
"""

from __future__ import annotations

import json
import os
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlparse

import sys

sys.path.insert(0, str(Path(__file__).parent))

from app.mock_data import (  # noqa: E402
    CHANNELS,
    ORDERS,
    RUN_LOGS,
    TICKETS,
    dashboard_summary,
    observability_overview,
)
from app.agent_runtime import (  # noqa: E402
    AgentConfigurationError,
    AgentProviderError,
    run_agent_turn,
)
from app.mcp_tools import handle_mcp_request, list_tools  # noqa: E402
from app.settings import openai_settings  # noqa: E402


HOST = os.getenv("API_HOST", "127.0.0.1")
PORT = int(os.getenv("API_PORT", "8000"))


class Handler(BaseHTTPRequestHandler):
    server_version = "FengMockAPI/0.1"

    def _send(self, payload: object, status: int = 200) -> None:
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("X-Data-Source", "mock")
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self) -> None:  # noqa: N802
        parsed = urlparse(self.path)
        path = parsed.path
        query = parse_qs(parsed.query)

        if path in {"/health/live", "/health/ready"}:
            self._send({"status": "ok", "service": "python-mock-api"})
            return
        if path == "/internal/v1/dashboard/summary":
            self._send(dashboard_summary())
            return
        if path == "/internal/v1/orders":
            items = ORDERS
            status = query.get("status", ["all"])[0]
            search = query.get("search", [""])[0].lower()
            if status != "all":
                items = [item for item in items if item["status"] == status]
            if search:
                items = [
                    item
                    for item in items
                    if search in item["order_no"].lower()
                    or search in item["customer"].lower()
                    or search in item["product"].lower()
                ]
            self._send({"items": items, "total": len(items)})
            return
        if path.startswith("/internal/v1/orders/"):
            order_id = path.rsplit("/", 1)[-1]
            order = next((item for item in ORDERS if item["id"] == order_id), None)
            self._send(order or {"error": "Order not found"}, 200 if order else 404)
            return
        if path == "/internal/v1/tickets":
            self._send({"items": TICKETS, "total": len(TICKETS)})
            return
        if path == "/internal/v1/observability/overview":
            payload = observability_overview()
            payload["range"] = query.get("range", ["7d"])[0]
            self._send(payload)
            return
        if path == "/internal/v1/observability/logs":
            items = RUN_LOGS
            status = query.get("status", ["all"])[0]
            search = query.get("search", [""])[0].lower()
            if status != "all":
                items = [item for item in items if item["status"] == status]
            if search:
                items = [
                    item
                    for item in items
                    if search in item["request_id"].lower()
                    or search in item["run_id"].lower()
                    or search in item["user"].lower()
                    or search in item["scene"].lower()
                ]
            self._send({"items": items, "total": len(items)})
            return
        if path == "/internal/v1/channels":
            self._send({"items": CHANNELS})
            return
        if path == "/internal/v1/agent/status":
            provider = openai_settings()
            self._send(
                {
                    "configured": provider["configured"],
                    "mode": "live" if provider["configured"] else "unconfigured",
                    "provider": "openai-compatible",
                    "credential_configured": provider["credential_configured"],
                    "configured_model": provider["model"],
                    "mcp_server": "feng-commerce-mcp",
                    "tools": [tool["name"] for tool in list_tools()],
                }
            )
            return

        self._send({"error": "Not found", "path": path}, 404)

    def _read_json(self) -> dict:
        length = int(self.headers.get("Content-Length", "0"))
        if length > 1_000_000:
            raise ValueError("Request body is too large")
        raw = self.rfile.read(length) if length else b"{}"
        payload = json.loads(raw.decode("utf-8"))
        if not isinstance(payload, dict):
            raise ValueError("JSON body must be an object")
        return payload

    def do_POST(self) -> None:  # noqa: N802
        path = urlparse(self.path).path
        try:
            payload = self._read_json()
            if path == "/internal/v1/agent/chat":
                self._send(run_agent_turn(payload, self.headers.get("x-demo-user", "merchant_demo")))
                return
            if path == "/internal/v1/mcp":
                self._send(handle_mcp_request(payload) or {"ok": True})
                return
            self._send({"error": "Not found", "path": path}, 404)
        except AgentConfigurationError as error:
            self._send({"error": str(error)}, 503)
        except AgentProviderError as error:
            self._send({"error": str(error)}, 502)
        except (json.JSONDecodeError, ValueError) as error:
            self._send({"error": str(error)}, 400)

    def log_message(self, format: str, *args: object) -> None:
        print(
            json.dumps(
                {
                    "service": "python-mock-api",
                    "message": format % args,
                },
                ensure_ascii=False,
            )
        )


if __name__ == "__main__":
    print(f"Mock API listening on http://{HOST}:{PORT}")
    ThreadingHTTPServer((HOST, PORT), Handler).serve_forever()
