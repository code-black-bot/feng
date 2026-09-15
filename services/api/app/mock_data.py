from __future__ import annotations

from datetime import UTC, datetime, timedelta
from typing import Any


NOW = datetime.now(UTC)


def iso(hours_ago: int = 0) -> str:
    return (NOW - timedelta(hours=hours_ago)).isoformat()


ORDERS: list[dict[str, Any]] = [
    {
        "id": "ord_10086",
        "order_no": "TB202609150086",
        "customer": "林晓雨",
        "customer_initial": "林",
        "product": "降噪蓝牙耳机 Pro",
        "amount": 899.0,
        "status": "shipping",
        "status_label": "运输中",
        "channel": "淘宝",
        "created_at": "2026-09-15T08:42:00+08:00",
        "shipping": {
            "carrier": "顺丰速运",
            "tracking_no": "SF14900273821",
            "status": "运输中",
            "latest_event": "快件已到达上海青浦中转场",
            "updated_at": "2026-09-15T14:26:00+08:00",
        },
    },
    {
        "id": "ord_10085",
        "order_no": "TB202609150085",
        "customer": "周子涵",
        "customer_initial": "周",
        "product": "机械键盘 87键",
        "amount": 469.0,
        "status": "after_sale",
        "status_label": "售后中",
        "channel": "淘宝",
        "created_at": "2026-09-15T07:58:00+08:00",
        "shipping": {
            "carrier": "中通快递",
            "tracking_no": "ZT6302917720",
            "status": "已签收",
            "latest_event": "快件已由本人签收",
            "updated_at": "2026-09-14T18:03:00+08:00",
        },
    },
    {
        "id": "ord_10084",
        "order_no": "TB202609150084",
        "customer": "沈嘉禾",
        "customer_initial": "沈",
        "product": "桌面氛围灯",
        "amount": 199.0,
        "status": "pending_ship",
        "status_label": "待发货",
        "channel": "淘宝",
        "created_at": "2026-09-14T22:16:00+08:00",
        "shipping": None,
    },
    {
        "id": "ord_10083",
        "order_no": "TB202609150083",
        "customer": "陈知夏",
        "customer_initial": "陈",
        "product": "人体工学鼠标",
        "amount": 329.0,
        "status": "completed",
        "status_label": "已完成",
        "channel": "淘宝",
        "created_at": "2026-09-14T19:33:00+08:00",
        "shipping": {
            "carrier": "圆通速递",
            "tracking_no": "YT1820093112",
            "status": "已签收",
            "latest_event": "快件已由驿站代收",
            "updated_at": "2026-09-15T10:22:00+08:00",
        },
    },
    {
        "id": "ord_10082",
        "order_no": "TB202609150082",
        "customer": "许星河",
        "customer_initial": "许",
        "product": "USB-C 扩展坞",
        "amount": 259.0,
        "status": "refunded",
        "status_label": "已退款",
        "channel": "淘宝",
        "created_at": "2026-09-14T16:09:00+08:00",
        "shipping": None,
    },
]


TICKETS: list[dict[str, Any]] = [
    {
        "id": "ticket_301",
        "ticket_no": "AS20260915031",
        "customer": "周子涵",
        "order_no": "TB202609150085",
        "reason": "键盘部分按键无响应，申请换货",
        "status": "pending_review",
        "status_label": "待审核",
        "priority": "high",
        "created_at": "2026-09-15 14:32",
        "source": "AI 助手",
    },
    {
        "id": "ticket_300",
        "ticket_no": "AS20260915030",
        "customer": "林晓雨",
        "order_no": "TB202609150086",
        "reason": "物流超过 24 小时未更新",
        "status": "processing",
        "status_label": "处理中",
        "priority": "medium",
        "created_at": "2026-09-15 11:08",
        "source": "人工创建",
    },
    {
        "id": "ticket_299",
        "ticket_no": "AS20260914029",
        "customer": "许星河",
        "order_no": "TB202609150082",
        "reason": "商品与设备不兼容，申请退货",
        "status": "resolved",
        "status_label": "已完成",
        "priority": "normal",
        "created_at": "2026-09-14 17:41",
        "source": "AI 助手",
    },
]


TOKEN_SERIES = [
    {"date": "09/09", "input": 182000, "output": 71000, "cost": 1.86},
    {"date": "09/10", "input": 205000, "output": 78000, "cost": 2.02},
    {"date": "09/11", "input": 241000, "output": 92000, "cost": 2.37},
    {"date": "09/12", "input": 226000, "output": 86000, "cost": 2.21},
    {"date": "09/13", "input": 276000, "output": 103000, "cost": 2.68},
    {"date": "09/14", "input": 314000, "output": 121000, "cost": 3.11},
    {"date": "今天", "input": 336000, "output": 132000, "cost": 4.17},
]


MODEL_USAGE = [
    {
        "model": "gpt-5-mini",
        "role": "常规客服",
        "requests": 1842,
        "tokens": 1684200,
        "cost": 10.76,
        "success_rate": 99.1,
        "avg_latency_ms": 2380,
    },
    {
        "model": "gpt-5",
        "role": "复杂售后",
        "requests": 286,
        "tokens": 548600,
        "cost": 6.92,
        "success_rate": 97.8,
        "avg_latency_ms": 5210,
    },
    {
        "model": "embedding-model",
        "role": "知识检索",
        "requests": 640,
        "tokens": 227200,
        "cost": 0.74,
        "success_rate": 99.8,
        "avg_latency_ms": 410,
    },
]


RUN_LOGS = [
    {
        "id": "log_1",
        "request_id": "req_8F31B2",
        "run_id": "run_01J7ZY4D2",
        "user": "林晓雨",
        "scene": "物流查询",
        "model": "gpt-5-mini",
        "status": "success",
        "status_label": "成功",
        "tokens": 1842,
        "cost": 0.013,
        "first_token_ms": 620,
        "duration_ms": 2840,
        "tools": ["get_my_orders", "get_shipping_status"],
        "created_at": "2026-09-15 15:42:08",
        "timeline": [
            {"label": "收到请求", "time_ms": 0, "detail": "完成用户和会话校验"},
            {"label": "模型规划", "time_ms": 620, "detail": "选择订单与物流查询工具"},
            {"label": "工具完成", "time_ms": 1420, "detail": "本地 mock 数据查询成功"},
            {"label": "回答完成", "time_ms": 2840, "detail": "流式输出 286 字"},
        ],
    },
    {
        "id": "log_2",
        "request_id": "req_7A0CD9",
        "run_id": "run_01J7ZY3P8",
        "user": "周子涵",
        "scene": "售后资格",
        "model": "gpt-5",
        "status": "success",
        "status_label": "成功",
        "tokens": 2764,
        "cost": 0.041,
        "first_token_ms": 980,
        "duration_ms": 5360,
        "tools": ["get_order_detail", "check_refund_eligibility"],
        "created_at": "2026-09-15 15:39:21",
        "timeline": [
            {"label": "收到请求", "time_ms": 0, "detail": "订单归属校验通过"},
            {"label": "规则查询", "time_ms": 910, "detail": "匹配数码商品售后规则"},
            {"label": "等待确认", "time_ms": 3180, "detail": "用户确认创建售后工单"},
            {"label": "回答完成", "time_ms": 5360, "detail": "已生成操作摘要"},
        ],
    },
    {
        "id": "log_3",
        "request_id": "req_64B821",
        "run_id": "run_01J7ZXZ6M",
        "user": "沈嘉禾",
        "scene": "订单查询",
        "model": "gpt-5-mini",
        "status": "failed",
        "status_label": "失败",
        "tokens": 486,
        "cost": 0.004,
        "first_token_ms": 0,
        "duration_ms": 10026,
        "tools": ["get_order_detail"],
        "error_code": "TOOL_TIMEOUT",
        "created_at": "2026-09-15 15:31:44",
        "timeline": [
            {"label": "收到请求", "time_ms": 0, "detail": "完成基础参数校验"},
            {"label": "调用工具", "time_ms": 522, "detail": "开始查询订单详情"},
            {"label": "工具超时", "time_ms": 10026, "detail": "达到 10 秒工具超时限制"},
        ],
    },
    {
        "id": "log_4",
        "request_id": "req_51E7A0",
        "run_id": "run_01J7ZXY39",
        "user": "陈知夏",
        "scene": "售后政策",
        "model": "gpt-5-mini",
        "status": "success",
        "status_label": "成功",
        "tokens": 1310,
        "cost": 0.009,
        "first_token_ms": 570,
        "duration_ms": 2210,
        "tools": ["get_refund_policy"],
        "created_at": "2026-09-15 15:26:13",
        "timeline": [
            {"label": "收到请求", "time_ms": 0, "detail": "识别商品售后政策咨询"},
            {"label": "规则查询", "time_ms": 760, "detail": "命中七天无理由规则"},
            {"label": "回答完成", "time_ms": 2210, "detail": "输出规则说明"},
        ],
    },
]


def dashboard_summary() -> dict[str, Any]:
    return {
        "metrics": {
            "orders_today": 1286,
            "orders_change": 12.4,
            "open_tickets": 38,
            "urgent_tickets": 6,
            "ai_resolution_rate": 78.6,
            "resolution_change": 4.2,
            "ai_cost_today": 4.17,
            "cost_change": 18.2,
        },
        "attention": [
            {
                "level": "warning",
                "title": "今日 Token 成本较昨日同期上涨 18.2%",
                "description": "主要来自售后资格场景的长上下文请求。",
            },
            {
                "level": "danger",
                "title": "6 个高优先级工单等待审核",
                "description": "最早一单已等待 42 分钟。",
            },
            {
                "level": "info",
                "title": "淘宝订单同步正常",
                "description": "最近同步于 2 分钟前，无积压事件。",
            },
        ],
        "recent_orders": ORDERS[:4],
        "recent_tickets": TICKETS,
    }


def observability_overview() -> dict[str, Any]:
    return {
        "summary": {
            "total_tokens": 2460000,
            "input_tokens": 1780000,
            "output_tokens": 680000,
            "estimated_cost": 18.42,
            "request_count": 2768,
            "success_rate": 98.7,
            "first_token_p95_ms": 1280,
            "duration_p95_ms": 4860,
            "active_runs": 12,
        },
        "token_series": TOKEN_SERIES,
        "model_usage": MODEL_USAGE,
        "latency": [
            {"label": "P50", "value_ms": 1840},
            {"label": "P75", "value_ms": 2960},
            {"label": "P95", "value_ms": 4860},
            {"label": "P99", "value_ms": 8210},
        ],
        "tool_usage": [
            {"tool": "get_my_orders", "calls": 986, "success_rate": 99.8, "avg_ms": 82},
            {"tool": "get_shipping_status", "calls": 742, "success_rate": 98.9, "avg_ms": 216},
            {"tool": "check_refund_eligibility", "calls": 428, "success_rate": 99.5, "avg_ms": 116},
            {"tool": "create_support_ticket", "calls": 86, "success_rate": 97.7, "avg_ms": 342},
        ],
        "alerts": [
            {
                "severity": "warning",
                "title": "Token 日预算已使用 73%",
                "detail": "按当前速度预计 21:40 达到 ¥25 日预算。",
            },
            {
                "severity": "danger",
                "title": "订单工具出现 3 次超时",
                "detail": "集中发生在 15:20—15:35，建议检查数据服务。",
            },
        ],
    }


CHANNELS = [
    {
        "id": "channel_taobao",
        "platform": "taobao",
        "name": "淘宝店铺",
        "shop_name": "风桥数码旗舰店",
        "status": "connected",
        "status_label": "已连接",
        "last_synced_at": "2026-09-15 15:44",
        "orders_synced": 12842,
        "pending_events": 0,
        "mode": "Mock 演示",
    }
]
