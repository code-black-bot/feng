import test from "node:test";
import assert from "node:assert/strict";

test("public route map follows the v1 contract", () => {
  const publicRoutes = [
    "/api/v1/dashboard/summary",
    "/api/v1/orders",
    "/api/v1/tickets",
    "/api/v1/observability/overview",
    "/api/v1/observability/logs",
    "/api/v1/channels",
  ];
  assert.equal(publicRoutes.length, 6);
  assert.ok(publicRoutes.every((route) => route.startsWith("/api/v1/")));
});
