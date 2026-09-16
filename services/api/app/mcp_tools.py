from __future__ import annotations

from collections import Counter
from typing import Any

from .mock_data import ORDERS


STATUS_ALIASES = {
    "all": "all",
    "pending_ship": "pending_ship",
    "待发货": "pending_ship",
    "shipping": "shipping",
    "运输中": "shipping",
    "after_sale": "after_sale",
    "售后中": "after_sale",
    "completed": "completed",
    "已完成": "completed",
    "refunded": "refunded",
    "已退款": "refunded",
}


TOOLS: list[dict[str, Any]] = [
    {
        "name": "search_orders",
        "description": "按订单号、客户名、商品名或状态查询当前商家的订单列表。",
        "inputSchema": {
            "type": "object",
            "properties": {
                "query": {"type": "string", "description": "订单号、客户名或商品关键词"},
                "status": {"type": "string", "description": "订单状态，默认 all"},
                "limit": {"type": "integer", "minimum": 1, "maximum": 20, "default": 10},
            },
            "additionalProperties": False,
        },
        "annotations": {"readOnlyHint": True, "destructiveHint": False},
    },
    {
        "name": "get_order_detail",
        "description": "根据订单号或内部订单 ID 读取一笔订单的完整详情。",
        "inputSchema": {
            "type": "object",
            "properties": {"order_key": {"type": "string"}},
            "required": ["order_key"],
            "additionalProperties": False,
        },
        "annotations": {"readOnlyHint": True, "destructiveHint": False},
    },
    {
        "name": "get_shipping_status",
        "description": "根据订单号或内部订单 ID 查询物流公司、运单号和最新物流节点。",
        "inputSchema": {
            "type": "object",
            "properties": {"order_key": {"type": "string"}},
            "required": ["order_key"],
            "additionalProperties": False,
        },
        "annotations": {"readOnlyHint": True, "destructiveHint": False},
    },
    {
        "name": "get_order_summary",
        "description": "汇总当前商家的订单数量、成交金额及各状态分布。",
        "inputSchema": {"type": "object", "properties": {}, "additionalProperties": False},
        "annotations": {"readOnlyHint": True, "destructiveHint": False},
    },
]


def list_tools() -> list[dict[str, Any]]:
    return TOOLS


def _find_order(order_key: str) -> dict[str, Any] | None:
    needle = order_key.strip().lower()
    return next(
        (
            order
            for order in ORDERS
            if order["id"].lower() == needle or order["order_no"].lower() == needle
        ),
        None,
    )


def call_tool(name: str, arguments: dict[str, Any] | None = None) -> dict[str, Any]:
    arguments = arguments or {}
    if name == "search_orders":
        query = str(arguments.get("query", "")).strip().lower()
        requested_status = str(arguments.get("status", "all")).strip()
        status = STATUS_ALIASES.get(requested_status, requested_status)
        limit = max(1, min(int(arguments.get("limit", 10) or 10), 20))
        items = [
            order
            for order in ORDERS
            if (status == "all" or order["status"] == status)
            and (
                not query
                or query in order["order_no"].lower()
                or query in order["customer"].lower()
                or query in order["product"].lower()
            )
        ]
        return {"items": items[:limit], "total": len(items), "filters": {"query": query, "status": status}}

    if name == "get_order_detail":
        order = _find_order(str(arguments.get("order_key", "")))
        return {"found": bool(order), "order": order}

    if name == "get_shipping_status":
        order = _find_order(str(arguments.get("order_key", "")))
        return {
            "found": bool(order),
            "order_no": order["order_no"] if order else None,
            "order_status": order["status_label"] if order else None,
            "shipping": order.get("shipping") if order else None,
        }

    if name == "get_order_summary":
        status_counts = Counter(order["status"] for order in ORDERS)
        return {
            "order_count": len(ORDERS),
            "total_amount": round(sum(float(order["amount"]) for order in ORDERS), 2),
            "status_counts": dict(status_counts),
        }

    raise ValueError(f"Unknown tool: {name}")


def handle_mcp_request(payload: dict[str, Any]) -> dict[str, Any] | None:
    request_id = payload.get("id")
    method = payload.get("method")
    if method == "notifications/initialized":
        return None
    if method == "initialize":
        result: dict[str, Any] = {
            "protocolVersion": "2025-03-26",
            "capabilities": {"tools": {"listChanged": False}},
            "serverInfo": {"name": "feng-commerce-mcp", "version": "0.1.0"},
        }
    elif method == "tools/list":
        result = {"tools": list_tools()}
    elif method == "tools/call":
        params = payload.get("params") or {}
        tool_result = call_tool(str(params.get("name", "")), params.get("arguments") or {})
        result = {
            "content": [{"type": "text", "text": str(tool_result)}],
            "structuredContent": tool_result,
            "isError": False,
        }
    else:
        return {
            "jsonrpc": "2.0",
            "id": request_id,
            "error": {"code": -32601, "message": f"Method not found: {method}"},
        }
    return {"jsonrpc": "2.0", "id": request_id, "result": result}
