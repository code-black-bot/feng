# 第一版架构

~~~text
React + TypeScript
        ↓  /api/v1
Node.js BFF
        ↓  /internal/v1
Python FastAPI
   ↙          ↘
Responses API   只读 MCP 工具
                    ↓
      Mock 数据（后续替换为 MySQL 与淘宝开放平台）
~~~

## 边界

- React 负责商家运营界面和数据展示。
- Node BFF 负责统一入口、限流、请求编号、安全响应头和代理。
- Python 负责 Agent 决策循环、订单工具、售后和观测指标。
- Node 不直接访问 MySQL，也不实现 Agent Prompt 或工具规则。
- 模型不能直接读取数据库，只能调用经过白名单控制的只读 MCP 工具。

## Agent 调用链

~~~text
商家提问 → React → Node BFF → Python Agent
                                  ↓
                         OpenAI-compatible Responses API
                                  ↓ function_call
                         MCP 只读订单工具 → Mock 数据
                                  ↓ function_call_output
                              模型生成回答
~~~

第一版使用轻量工具循环，最多执行 4 轮模型与工具交互。后续出现人工确认、长任务恢复或复杂条件分支时，再将运行层迁移到 LangGraph。

## 观测数据

第一版观测接口提供：

- 输入、输出和总 Token
- 按日和按模型成本
- 请求数量、成功率和活跃运行数
- 首字延迟与完整运行 P50/P75/P95/P99
- 工具调用次数、成功率和平均耗时
- request_id、run_id、工具名称、错误码和执行时间线

真实 Agent 接入后，应在 Python 的统一运行钩子中记录模型 usage 和工具事件，而不是从自然语言回答中推测 Token。
