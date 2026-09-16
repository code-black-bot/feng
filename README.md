# FENG 商家智能工作台

电商订单、售后、AI 数据问答与 Agent 可观测性后台的第一版实现。

当前版本使用 Mock 订单数据，但 Agent 已通过 OpenAI-compatible Responses API 调用真实模型。模型只能通过只读 MCP 工具查询订单，不会直接访问数据库。后续可以逐步将订单数据源替换为 MySQL 与淘宝开放平台。

## 已实现

- 商家运营总览
- 淘宝 Mock 订单与筛选
- 售后工单队列
- AI Token、费用、成功率和延迟观测
- 按模型统计调用量与成本
- 工具调用稳定性
- Agent Run 日志搜索与调用链详情
- 对话式 Agent 工作台，可直接询问订单数量、金额、状态和物流
- 标准 MCP JSON-RPC 入口与 4 个只读订单工具
- Agent 工具调用过程、参数、结果摘要与用量展示
- 淘宝渠道连接和同步状态
- Node BFF 的请求编号、限流、安全响应头与流式代理基础
- Python FastAPI 接口及无需第三方依赖的本地 Mock Server

## 项目结构

~~~text
feng/
├── app/                    React + TypeScript 商家后台
├── apps/bff/               Node.js BFF
├── services/api/           Python FastAPI 与 Mock 数据
├── docs/                   架构说明
└── .openai/hosting.json    Web 构建配置
~~~

## 本地运行

需要三个终端。

### 配置本地 API Key

在项目根目录创建 `.env.local`：

~~~dotenv
OPENAI_API_KEY=你的密钥
OPENAI_BASE_URL=https://www.aivalux.com/v1
OPENAI_MODEL=gpt-5.5
OPENAI_TIMEOUT_SECONDS=60
~~~

`.env.local` 已被 Git 忽略，密钥只会由本地 Python 后端读取。不要把密钥写进 `NEXT_PUBLIC_` 变量、React 代码、`.env.example`、日志或聊天消息中。模型请求使用 Responses API，并设置 `store=False`。

### 1. 启动 Python Mock API

~~~bash
python3 services/api/dev_server.py
~~~

地址：http://127.0.0.1:8000

如果已经安装 FastAPI，也可以使用正式入口：

~~~bash
cd services/api
python3 -m pip install -r requirements.txt
python3 -m uvicorn app.main:app --reload --port 8000
~~~

### 2. 启动 Node BFF

~~~bash
npm --prefix apps/bff start
~~~

地址：http://127.0.0.1:3001

### 3. 启动 React

Web 构建要求 Node.js 22.13 或更高版本：

~~~bash
npm install
npm run dev
~~~

浏览器打开：http://localhost:3000

页面右上角显示“API 数据”表示 React 已经通过 Node BFF 读取 Python Mock API；显示“前端 Mock”时页面仍可操作，但服务端链路尚未连接。进入“Agent 助手”后，可以尝试“今天有多少订单”“查看待发货订单”或“订单 TB202609150086 的物流到哪里了”。

## 验证

~~~bash
PYTHONPATH=services/api python3 -m unittest discover -s services/api/tests
npm --prefix apps/bff test
npm run build
~~~

## 下一步

1. 用 SQLAlchemy + MySQL 替换 Python Mock 数据。
2. 实现商家登录和租户隔离。
3. 接入淘宝开放平台 OAuth 和订单同步。
4. 将内存会话与运行日志写入 MySQL。
5. 根据实际供应商价格配置精确的调用成本计算。
