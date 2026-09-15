# FENG 商家智能工作台

电商订单、售后与 AI Agent 可观测性后台的第一版实现。

当前版本使用 Mock 数据，不连接真实淘宝、MySQL 或模型服务。项目已经保留清晰的 BFF、业务 API 和 Agent 观测接口边界，后续可以逐步替换数据源。

## 已实现

- 商家运营总览
- 淘宝 Mock 订单与筛选
- 售后工单队列
- AI Token、费用、成功率和延迟观测
- 按模型统计调用量与成本
- 工具调用稳定性
- Agent Run 日志搜索与调用链详情
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

页面右上角显示“API 数据”表示 React 已经通过 Node BFF 读取 Python Mock API；显示“前端 Mock”时页面仍可操作，但服务端链路尚未连接。

## 验证

~~~bash
python3 -m unittest discover -s services/api/tests
npm --prefix apps/bff test
npm run build
~~~

## 下一步

1. 用 SQLAlchemy + MySQL 替换 Python Mock 数据。
2. 实现商家登录和租户隔离。
3. 接入淘宝开放平台 OAuth 和订单同步。
4. 接入单 Agent 与受控订单查询工具。
5. 将真实模型 usage、工具事件和错误写入观测接口。
