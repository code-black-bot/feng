# 第一版架构

~~~text
React + TypeScript
        ↓  /api/v1
Node.js BFF
        ↓  /internal/v1
Python FastAPI
        ↓
Mock 数据（后续替换为 MySQL 与淘宝开放平台）
~~~

## 边界

- React 负责商家运营界面和数据展示。
- Node BFF 负责统一入口、限流、请求编号、安全响应头和代理。
- Python 负责订单、售后、观测指标和未来的 Agent 业务。
- Node 不直接访问 MySQL，也不实现 Agent Prompt 或工具规则。

## 观测数据

第一版观测接口提供：

- 输入、输出和总 Token
- 按日和按模型成本
- 请求数量、成功率和活跃运行数
- 首字延迟与完整运行 P50/P75/P95/P99
- 工具调用次数、成功率和平均耗时
- request_id、run_id、工具名称、错误码和执行时间线

真实 Agent 接入后，应在 Python 的统一运行钩子中记录模型 usage 和工具事件，而不是从自然语言回答中推测 Token。
