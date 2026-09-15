import unittest

from app.mock_data import ORDERS, RUN_LOGS, dashboard_summary, observability_overview


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


if __name__ == "__main__":
    unittest.main()
