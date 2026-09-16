import unittest
from unittest.mock import patch

from app.agent_runtime import AgentConfigurationError, run_agent_turn
from app.mcp_tools import call_tool, handle_mcp_request
from app.mock_data import ORDERS, RUN_LOGS, dashboard_summary, observability_overview
from app.settings import openai_settings


class MockDataTests(unittest.TestCase):
    def test_order_numbers_are_unique(self) -> None:
        order_numbers = [order["order_no"] for order in ORDERS]
        self.assertEqual(len(order_numbers), len(set(order_numbers)))

    def test_dashboard_has_attention_items(self) -> None:
        payload = dashboard_summary()
        self.assertGreater(payload["metrics"]["orders_today"], 0)
        self.assertGreaterEqual(len(payload["attention"]), 1)

    def test_observability_totals_match_model_usage(self) -> None:
        payload = observability_overview()
        model_tokens = sum(item["tokens"] for item in payload["model_usage"])
        self.assertEqual(model_tokens, payload["summary"]["total_tokens"])

    def test_logs_have_trace_identifiers(self) -> None:
        self.assertTrue(all(log["request_id"] and log["run_id"] for log in RUN_LOGS))

    def test_mcp_lists_read_only_order_tools(self) -> None:
        response = handle_mcp_request({"jsonrpc": "2.0", "id": 1, "method": "tools/list"})
        self.assertIsNotNone(response)
        tools = response["result"]["tools"]
        self.assertIn("search_orders", [tool["name"] for tool in tools])
        self.assertTrue(all(tool["annotations"]["readOnlyHint"] for tool in tools))

    def test_mcp_can_query_shipping(self) -> None:
        result = call_tool("get_shipping_status", {"order_key": "TB202609150086"})
        self.assertTrue(result["found"])
        self.assertEqual(result["shipping"]["carrier"], "顺丰速运")

    def test_live_agent_uses_model_selected_mcp_tool(self) -> None:
        requests: list[dict] = []

        def fake_create(_config, payload):
            requests.append(payload)
            usage = {"input_tokens": 24, "output_tokens": 12, "total_tokens": 36}
            if len(requests) == 1:
                return {"output": [{"type": "function_call", "call_id": "call_test", "name": "get_shipping_status", "arguments": '{"order_key":"TB202609150086"}'}], "usage": usage}
            return {"output_text": "订单由顺丰速运承运，最新状态为运输中。", "output": [], "usage": usage}

        env = {"OPENAI_API_KEY": "local-test-secret", "OPENAI_BASE_URL": "https://example.test/v1", "OPENAI_MODEL": "test-model"}
        with patch.dict("os.environ", env), patch("app.agent_runtime._responses_create", side_effect=fake_create):
            result = run_agent_turn({"message": "查询 TB202609150086 的物流"})

        self.assertEqual(result["mode"], "live")
        self.assertEqual(result["tool_calls"][0]["name"], "get_shipping_status")
        self.assertIn("顺丰速运", result["message"])
        self.assertEqual(result["usage"]["total_tokens"], 72)
        self.assertGreater(result["first_token_ms"], 0)
        self.assertGreaterEqual(result["duration_ms"], result["first_token_ms"])
        self.assertFalse(requests[0]["store"])
        self.assertTrue(requests[0]["tools"])

    def test_live_agent_requires_local_key(self) -> None:
        with patch.dict("os.environ", {"OPENAI_API_KEY": ""}):
            with self.assertRaises(AgentConfigurationError):
                run_agent_turn({"message": "今天多少订单"})

    def test_openai_status_never_returns_secret(self) -> None:
        with patch.dict("os.environ", {"OPENAI_API_KEY": "local-test-secret", "OPENAI_MODEL": "demo-model"}):
            status = openai_settings()
        self.assertTrue(status["credential_configured"])
        self.assertEqual(status["model"], "demo-model")
        self.assertNotIn("api_key", status)
        self.assertNotIn("local-test-secret", str(status))


if __name__ == "__main__":
    unittest.main()
