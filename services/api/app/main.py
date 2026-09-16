from __future__ import annotations

from fastapi import FastAPI, HTTPException, Query, Request
from fastapi.middleware.cors import CORSMiddleware

from .agent_runtime import AgentConfigurationError, AgentProviderError, run_agent_turn
from .mcp_tools import handle_mcp_request, list_tools
from .settings import openai_settings
from .mock_data import (
    CHANNELS,
    ORDERS,
    RUN_LOGS,
    TICKETS,
    dashboard_summary,
    observability_overview,
)


app = FastAPI(
    title="Feng Commerce Support API",
    description="Mock business API for the first version of the commerce support console.",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health/live")
def live() -> dict[str, str]:
    return {"status": "ok", "service": "python-api"}


@app.get("/health/ready")
def ready() -> dict[str, str]:
    return {"status": "ready", "data_source": "mock"}


@app.get("/internal/v1/dashboard/summary")
def get_dashboard_summary() -> dict:
    return dashboard_summary()


@app.get("/internal/v1/orders")
def list_orders(
    status: str | None = Query(default=None),
    search: str | None = Query(default=None),
) -> dict:
    result = ORDERS
    if status and status != "all":
        result = [order for order in result if order["status"] == status]
    if search:
        needle = search.lower()
        result = [
            order
            for order in result
            if needle in order["order_no"].lower()
            or needle in order["customer"].lower()
            or needle in order["product"].lower()
        ]
    return {"items": result, "total": len(result)}


@app.get("/internal/v1/orders/{order_id}")
def get_order(order_id: str) -> dict:
    order = next((item for item in ORDERS if item["id"] == order_id), None)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order


@app.get("/internal/v1/tickets")
def list_tickets() -> dict:
    return {"items": TICKETS, "total": len(TICKETS)}


@app.get("/internal/v1/observability/overview")
def get_observability_overview(range: str = Query(default="7d")) -> dict:
    payload = observability_overview()
    payload["range"] = range
    return payload


@app.get("/internal/v1/observability/logs")
def list_run_logs(
    status: str | None = Query(default=None),
    search: str | None = Query(default=None),
) -> dict:
    result = RUN_LOGS
    if status and status != "all":
        result = [log for log in result if log["status"] == status]
    if search:
        needle = search.lower()
        result = [
            log
            for log in result
            if needle in log["request_id"].lower()
            or needle in log["run_id"].lower()
            or needle in log["user"].lower()
            or needle in log["scene"].lower()
        ]
    return {"items": result, "total": len(result)}


@app.get("/internal/v1/channels")
def list_channels() -> dict:
    return {"items": CHANNELS}


@app.get("/internal/v1/agent/status")
def agent_status() -> dict:
    provider = openai_settings()
    return {
        "configured": provider["configured"],
        "mode": "live" if provider["configured"] else "unconfigured",
        "provider": "openai-compatible",
        "credential_configured": provider["credential_configured"],
        "configured_model": provider["model"],
        "mcp_server": "feng-commerce-mcp",
        "tools": [tool["name"] for tool in list_tools()],
        "message": "真实 Responses API 已配置，订单数据仍通过只读 MCP 工具访问。"
        if provider["configured"]
        else "请在本地 .env.local 中配置 OPENAI_API_KEY。",
    }


@app.post("/internal/v1/agent/chat")
def agent_chat(payload: dict, request: Request) -> dict:
    try:
        return run_agent_turn(payload, request.headers.get("x-demo-user", "merchant_demo"))
    except AgentConfigurationError as error:
        raise HTTPException(status_code=503, detail=str(error)) from error
    except AgentProviderError as error:
        raise HTTPException(status_code=502, detail=str(error)) from error
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error


@app.post("/internal/v1/mcp")
def mcp_endpoint(payload: dict) -> dict:
    response = handle_mcp_request(payload)
    return response or {"ok": True}


@app.middleware("http")
async def attach_request_id(request: Request, call_next):
    response = await call_next(request)
    request_id = request.headers.get("x-request-id", "direct-request")
    response.headers["x-request-id"] = request_id
    return response
