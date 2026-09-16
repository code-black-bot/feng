"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type ViewId = "overview" | "agent" | "orders" | "tickets" | "observability" | "logs" | "channels";

type Order = {
  id: string; order_no: string; customer: string; customer_initial: string;
  product: string; amount: number; status: string; status_label: string;
  channel: string; created_at: string;
};

type Ticket = {
  id: string; ticket_no: string; customer: string; order_no: string;
  reason: string; status: string; status_label: string; priority: string;
  created_at: string; source: string;
};

type RunLog = {
  id: string; request_id: string; run_id: string; user: string; scene: string;
  model: string; status: string; status_label: string; tokens: number; cost: number;
  first_token_ms: number; duration_ms: number; tools: string[]; error_code?: string;
  created_at: string;
  timeline: Array<{ label: string; time_ms: number; detail: string }>;
};

type AgentToolCall = {
  id: string; name: string; arguments: Record<string, unknown>; status: string;
  duration_ms: number; result_preview: string;
};

type AgentUsage = {
  input_tokens: number; output_tokens: number; total_tokens: number; estimated_cost: number;
};

type AgentReply = {
  session_id: string; request_id: string; run_id: string; mode: "mock" | "live";
  model: string; message: string; tool_calls: AgentToolCall[]; usage: AgentUsage;
  first_token_ms?: number; duration_ms?: number; suggestions?: string[];
};

type AgentStatus = {
  configured: boolean; mode: "live" | "unconfigured"; provider: string;
  credential_configured: boolean; configured_model: string; message?: string;
};

type ChatMessage = {
  id: string; role: "user" | "assistant"; content: string;
  tool_calls?: AgentToolCall[]; usage?: AgentUsage; request_id?: string;
  first_token_ms?: number; duration_ms?: number;
};

const navigation: Array<{ id: ViewId; label: string; short: string; description: string }> = [
  { id: "overview", label: "运营总览", short: "总", description: "今日经营与待办" },
  { id: "agent", label: "Agent 助手", short: "问", description: "用对话查询业务数据" },
  { id: "orders", label: "订单管理", short: "单", description: "淘宝订单与物流" },
  { id: "tickets", label: "售后工单", short: "售", description: "审核与处理进度" },
  { id: "observability", label: "AI 观测", short: "AI", description: "Token、成本与性能" },
  { id: "logs", label: "运行日志", short: "志", description: "请求链路与错误" },
  { id: "channels", label: "渠道连接", short: "渠", description: "淘宝授权与同步" },
];

const mockOrders: Order[] = [
  { id: "ord_10086", order_no: "TB202609150086", customer: "林晓雨", customer_initial: "林", product: "降噪蓝牙耳机 Pro", amount: 899, status: "shipping", status_label: "运输中", channel: "淘宝", created_at: "2026-09-15 08:42" },
  { id: "ord_10085", order_no: "TB202609150085", customer: "周子涵", customer_initial: "周", product: "机械键盘 87键", amount: 469, status: "after_sale", status_label: "售后中", channel: "淘宝", created_at: "2026-09-15 07:58" },
  { id: "ord_10084", order_no: "TB202609150084", customer: "沈嘉禾", customer_initial: "沈", product: "桌面氛围灯", amount: 199, status: "pending_ship", status_label: "待发货", channel: "淘宝", created_at: "2026-09-14 22:16" },
  { id: "ord_10083", order_no: "TB202609150083", customer: "陈知夏", customer_initial: "陈", product: "人体工学鼠标", amount: 329, status: "completed", status_label: "已完成", channel: "淘宝", created_at: "2026-09-14 19:33" },
  { id: "ord_10082", order_no: "TB202609150082", customer: "许星河", customer_initial: "许", product: "USB-C 扩展坞", amount: 259, status: "refunded", status_label: "已退款", channel: "淘宝", created_at: "2026-09-14 16:09" },
];

const mockTickets: Ticket[] = [
  { id: "ticket_301", ticket_no: "AS20260915031", customer: "周子涵", order_no: "TB202609150085", reason: "键盘部分按键无响应，申请换货", status: "pending_review", status_label: "待审核", priority: "high", created_at: "2026-09-15 14:32", source: "AI 助手" },
  { id: "ticket_300", ticket_no: "AS20260915030", customer: "林晓雨", order_no: "TB202609150086", reason: "物流超过 24 小时未更新", status: "processing", status_label: "处理中", priority: "medium", created_at: "2026-09-15 11:08", source: "人工创建" },
  { id: "ticket_299", ticket_no: "AS20260914029", customer: "许星河", order_no: "TB202609150082", reason: "商品与设备不兼容，申请退货", status: "resolved", status_label: "已完成", priority: "normal", created_at: "2026-09-14 17:41", source: "AI 助手" },
];

const tokenSeries = [
  { date: "09/09", input: 182000, output: 71000, cost: 1.86 },
  { date: "09/10", input: 205000, output: 78000, cost: 2.02 },
  { date: "09/11", input: 241000, output: 92000, cost: 2.37 },
  { date: "09/12", input: 226000, output: 86000, cost: 2.21 },
  { date: "09/13", input: 276000, output: 103000, cost: 2.68 },
  { date: "09/14", input: 314000, output: 121000, cost: 3.11 },
  { date: "今天", input: 336000, output: 132000, cost: 4.17 },
];

const modelUsage = [
  { model: "gpt-5-mini", role: "常规客服", requests: 1842, tokens: 1684200, cost: 10.76, success_rate: 99.1, avg_latency_ms: 2380 },
  { model: "gpt-5", role: "复杂售后", requests: 286, tokens: 548600, cost: 6.92, success_rate: 97.8, avg_latency_ms: 5210 },
  { model: "embedding-model", role: "知识检索", requests: 640, tokens: 227200, cost: 0.74, success_rate: 99.8, avg_latency_ms: 410 },
];

const mockObservability = {
  summary: {
    total_tokens: 2460000,
    input_tokens: 1780000,
    output_tokens: 680000,
    estimated_cost: 18.42,
    request_count: 2768,
    success_rate: 98.7,
    first_token_p95_ms: 1280,
    duration_p95_ms: 4860,
    active_runs: 12,
  },
  token_series: tokenSeries,
  model_usage: modelUsage,
};

const mockLogs: RunLog[] = [
  {
    id: "log_1", request_id: "req_8F31B2", run_id: "run_01J7ZY4D2", user: "林晓雨", scene: "物流查询", model: "gpt-5-mini", status: "success", status_label: "成功", tokens: 1842, cost: 0.013, first_token_ms: 620, duration_ms: 2840, tools: ["get_my_orders", "get_shipping_status"], created_at: "2026-09-15 15:42:08",
    timeline: [
      { label: "收到请求", time_ms: 0, detail: "完成用户和会话校验" },
      { label: "模型规划", time_ms: 620, detail: "选择订单与物流查询工具" },
      { label: "工具完成", time_ms: 1420, detail: "本地 mock 数据查询成功" },
      { label: "回答完成", time_ms: 2840, detail: "流式输出 286 字" },
    ],
  },
  {
    id: "log_2", request_id: "req_7A0CD9", run_id: "run_01J7ZY3P8", user: "周子涵", scene: "售后资格", model: "gpt-5", status: "success", status_label: "成功", tokens: 2764, cost: 0.041, first_token_ms: 980, duration_ms: 5360, tools: ["get_order_detail", "check_refund_eligibility"], created_at: "2026-09-15 15:39:21",
    timeline: [
      { label: "收到请求", time_ms: 0, detail: "订单归属校验通过" },
      { label: "规则查询", time_ms: 910, detail: "匹配数码商品售后规则" },
      { label: "等待确认", time_ms: 3180, detail: "用户确认创建售后工单" },
      { label: "回答完成", time_ms: 5360, detail: "已生成操作摘要" },
    ],
  },
  {
    id: "log_3", request_id: "req_64B821", run_id: "run_01J7ZXZ6M", user: "沈嘉禾", scene: "订单查询", model: "gpt-5-mini", status: "failed", status_label: "失败", tokens: 486, cost: 0.004, first_token_ms: 0, duration_ms: 10026, tools: ["get_order_detail"], error_code: "TOOL_TIMEOUT", created_at: "2026-09-15 15:31:44",
    timeline: [
      { label: "收到请求", time_ms: 0, detail: "完成基础参数校验" },
      { label: "调用工具", time_ms: 522, detail: "开始查询订单详情" },
      { label: "工具超时", time_ms: 10026, detail: "达到 10 秒工具超时限制" },
    ],
  },
  {
    id: "log_4", request_id: "req_51E7A0", run_id: "run_01J7ZXY39", user: "陈知夏", scene: "售后政策", model: "gpt-5-mini", status: "success", status_label: "成功", tokens: 1310, cost: 0.009, first_token_ms: 570, duration_ms: 2210, tools: ["get_refund_policy"], created_at: "2026-09-15 15:26:13",
    timeline: [
      { label: "收到请求", time_ms: 0, detail: "识别商品售后政策咨询" },
      { label: "规则查询", time_ms: 760, detail: "命中七天无理由规则" },
      { label: "回答完成", time_ms: 2210, detail: "输出规则说明" },
    ],
  },
];

const pageMeta: Record<ViewId, { eyebrow: string; title: string; subtitle: string }> = {
  overview: { eyebrow: "9月15日 · 周二", title: "下午好，Matthew", subtitle: "风桥数码旗舰店的运营情况已更新。" },
  agent: { eyebrow: "Agent Workspace", title: "业务数据助手", subtitle: "通过受控 MCP 工具，用自然语言查询订单与物流。" },
  orders: { eyebrow: "交易中心", title: "订单管理", subtitle: "查看从淘宝同步的订单、商品与物流状态。" },
  tickets: { eyebrow: "客户体验", title: "售后工单", subtitle: "优先处理高风险和等待时间较长的售后请求。" },
  observability: { eyebrow: "AI Operations", title: "AI 运行观测", subtitle: "跟踪 Token、费用、延迟、工具表现与风险趋势。" },
  logs: { eyebrow: "Trace Explorer", title: "运行日志", subtitle: "通过请求编号还原每一次模型与工具调用。" },
  channels: { eyebrow: "数据连接", title: "渠道连接", subtitle: "管理淘宝授权、订单同步和消息积压。" },
};

const BFF_URL = process.env.NEXT_PUBLIC_BFF_URL ?? "http://localhost:3001";

function apiErrorMessage(payload: unknown, status: number): string {
  if (!payload || typeof payload !== "object") return `HTTP ${status}`;
  const body = payload as Record<string, unknown>;
  if (typeof body.detail === "string") return body.detail;
  if (body.detail && typeof body.detail === "object") {
    const detail = body.detail as Record<string, unknown>;
    if (typeof detail.message === "string") return detail.message;
  }
  if (typeof body.error === "string") return body.error;
  if (body.error && typeof body.error === "object") {
    const error = body.error as Record<string, unknown>;
    const code = typeof error.code === "string" ? error.code : `HTTP_${status}`;
    const message = typeof error.message === "string" ? error.message : "请求失败";
    return `${code}：${message}`;
  }
  return `HTTP ${status}`;
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("zh-CN", { maximumFractionDigits: 1 }).format(value);
}

function formatLatency(value: number) {
  return value < 1000 ? `${value}ms` : `${(value / 1000).toFixed(1)}s`;
}

function Status({ value, label }: { value: string; label: string }) {
  return <span className={"status status-" + value}><span className="status-dot" />{label}</span>;
}

function Metric({ label, value, unit, change, tone = "neutral" }: {
  label: string; value: string; unit?: string; change: string;
  tone?: "neutral" | "good" | "warning";
}) {
  return (
    <div className={"metric metric-" + tone}>
      <div className="metric-top"><span>{label}</span><span className="metric-mark" aria-hidden="true">↗</span></div>
      <div className="metric-value">{value}<small>{unit}</small></div>
      <p>{change}</p>
    </div>
  );
}

function SectionTitle({ title, description, action }: { title: string; description?: string; action?: React.ReactNode }) {
  return (
    <div className="section-heading">
      <div><h2>{title}</h2>{description ? <p>{description}</p> : null}</div>
      {action}
    </div>
  );
}

function Overview({ setView, orders }: { setView: (view: ViewId) => void; orders: Order[] }) {
  return (
    <div className="view-stack">
      <section className="hero-panel">
        <div className="hero-copy">
          <span className="hero-kicker">今日运营简报</span>
          <h2>客服效率保持稳定，<br /><em>有 1 项成本提醒</em>需要处理。</h2>
          <p>AI 自动解决率连续第 4 天提升，但复杂售后场景的上下文长度正在推高成本。</p>
          <div className="hero-actions">
            <button className="button button-primary" onClick={() => setView("observability")}>查看 AI 成本</button>
            <button className="button button-quiet" onClick={() => setView("tickets")}>处理 6 个紧急工单</button>
          </div>
        </div>
        <div className="hero-signal">
          <div className="signal-label"><span>实时服务状态</span><strong>运行正常</strong></div>
          <div className="signal-orbit" aria-hidden="true"><span /><i /></div>
          <div className="signal-foot"><span>当前运行</span><strong>12</strong><span>等待</span><strong>3</strong></div>
        </div>
      </section>

      <section className="metrics-grid">
        <Metric label="今日订单" value="1,286" change="较昨日同期 +12.4%" tone="good" />
        <Metric label="待处理工单" value="38" change="其中 6 个高优先级" tone="warning" />
        <Metric label="AI 自动解决率" value="78.6" unit="%" change="近 7 天提升 4.2%" tone="good" />
        <Metric label="今日 AI 成本" value="¥4.17" change="已使用日预算 16.7%" />
      </section>

      <div className="content-grid">
        <section className="surface surface-wide">
          <SectionTitle title="需要关注" description="按业务影响排序的今日事项" action={<button className="text-button" onClick={() => setView("logs")}>全部记录 →</button>} />
          <div className="attention-list">
            <button className="attention-item" onClick={() => setView("observability")}>
              <span className="attention-index warning">01</span>
              <span><strong>Token 成本较昨日同期上涨 18.2%</strong><small>复杂售后场景平均多携带 3.2 轮上下文</small></span>
              <span className="attention-arrow">→</span>
            </button>
            <button className="attention-item" onClick={() => setView("tickets")}>
              <span className="attention-index danger">02</span>
              <span><strong>6 个高优先级工单等待审核</strong><small>最早一单已等待 42 分钟</small></span>
              <span className="attention-arrow">→</span>
            </button>
            <button className="attention-item" onClick={() => setView("channels")}>
              <span className="attention-index good">03</span>
              <span><strong>淘宝订单同步正常</strong><small>最近同步于 2 分钟前，无积压事件</small></span>
              <span className="attention-arrow">→</span>
            </button>
          </div>
        </section>

        <section className="surface">
          <SectionTitle title="7 日 AI 请求" description="总计 2,768 次调用" />
          <div className="mini-bars" aria-label="过去七天 AI 请求趋势">
            {[48, 56, 63, 58, 72, 84, 92].map((height, index) => (
              <div className="mini-bar-slot" key={index}><div className="mini-bar" style={{ height: String(height) + "%" }} /><span>{tokenSeries[index].date}</span></div>
            ))}
          </div>
          <div className="mini-legend"><span><i className="legend-orange" />调用量</span><strong>+21.8%</strong></div>
        </section>
      </div>

      <section className="surface">
        <SectionTitle title="最新订单" description="来自淘宝渠道的最近同步数据" action={<button className="button button-small" onClick={() => setView("orders")}>查看全部</button>} />
        <OrderTable orders={orders.slice(0, 4)} compact />
      </section>
    </div>
  );
}

function OrderTable({ orders, compact = false }: { orders: Order[]; compact?: boolean }) {
  return (
    <div className="table-wrap">
      <table>
        <thead><tr><th>客户 / 订单</th><th>商品</th><th>金额</th><th>状态</th>{!compact ? <th>创建时间</th> : null}<th><span className="sr-only">操作</span></th></tr></thead>
        <tbody>
          {orders.map((order) => (
            <tr key={order.id}>
              <td><div className="customer-cell"><span className="avatar avatar-warm">{order.customer_initial}</span><span><strong>{order.customer}</strong><small>{order.order_no}</small></span></div></td>
              <td><strong className="product-name">{order.product}</strong><small className="channel-label">{order.channel}订单</small></td>
              <td className="money">¥{order.amount.toFixed(2)}</td>
              <td><Status value={order.status} label={order.status_label} /></td>
              {!compact ? <td className="muted-cell">{order.created_at}</td> : null}
              <td><button className="row-action" aria-label={"查看订单 " + order.order_no}>•••</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Orders({ orders }: { orders: Order[] }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const filtered = useMemo(() => orders.filter((order) => {
    const matchesStatus = status === "all" || order.status === status;
    const needle = query.toLowerCase();
    const matchesQuery = !needle || order.customer.toLowerCase().includes(needle) || order.order_no.toLowerCase().includes(needle) || order.product.toLowerCase().includes(needle);
    return matchesStatus && matchesQuery;
  }), [orders, query, status]);

  return (
    <div className="view-stack">
      <section className="filter-bar">
        <label className="search-field"><span aria-hidden="true">⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索订单号、客户或商品" /></label>
        <label className="select-field"><span>订单状态</span><select value={status} onChange={(event) => setStatus(event.target.value)}><option value="all">全部状态</option><option value="pending_ship">待发货</option><option value="shipping">运输中</option><option value="after_sale">售后中</option><option value="completed">已完成</option><option value="refunded">已退款</option></select></label>
        <button className="button button-primary">导出订单</button>
      </section>
      <section className="surface">
        <SectionTitle title="全部订单" description={"共 " + filtered.length + " 笔，数据来自淘宝 Mock 渠道"} />
        <OrderTable orders={filtered} />
        {filtered.length === 0 ? <div className="empty-state"><strong>没有匹配的订单</strong><p>调整关键词或状态筛选后再试。</p></div> : null}
      </section>
    </div>
  );
}

function Tickets({ tickets }: { tickets: Ticket[] }) {
  return (
    <div className="view-stack">
      <section className="ticket-summary">
        <div><span>待审核</span><strong>12</strong><small>其中 6 个高优先级</small></div>
        <div><span>处理中</span><strong>26</strong><small>平均处理 18 分钟</small></div>
        <div><span>今日完成</span><strong>84</strong><small>一次解决率 81.2%</small></div>
      </section>
      <section className="surface">
        <SectionTitle title="售后队列" description="按优先级和等待时间排序" action={<button className="button button-primary">新建工单</button>} />
        <div className="ticket-list">
          {tickets.map((ticket) => (
            <article className="ticket-row" key={ticket.id}>
              <div className={"priority-line priority-" + ticket.priority} />
              <div className="ticket-main"><div className="ticket-meta"><span>{ticket.ticket_no}</span><span>·</span><span>{ticket.created_at}</span></div><h3>{ticket.reason}</h3><p>{ticket.customer} · {ticket.order_no}</p></div>
              <div className="ticket-source"><span>{ticket.source}</span><Status value={ticket.status} label={ticket.status_label} /></div>
              <button className="button button-small">查看处理</button>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

function Observability({ data }: { data: typeof mockObservability }) {
  const [range, setRange] = useState("7d");
  const maxTokens = Math.max(...data.token_series.map((item) => item.input + item.output));
  return (
    <div className="view-stack">
      <div className="view-toolbar">
        <div className="segmented" aria-label="时间范围">
          {["24h", "7d", "30d"].map((item) => <button key={item} className={range === item ? "active" : ""} onClick={() => setRange(item)}>{item === "24h" ? "24 小时" : item === "7d" ? "7 天" : "30 天"}</button>)}
        </div>
        <span className="freshness"><i />数据更新于刚刚</span>
      </div>

      <section className="metrics-grid observability-metrics">
        <Metric label="总 Token" value={(data.summary.total_tokens / 1000000).toFixed(2)} unit="M" change={"输入 " + (data.summary.input_tokens / 1000000).toFixed(2) + "M · 输出 " + Math.round(data.summary.output_tokens / 1000) + "K"} />
        <Metric label="预估成本" value={"¥" + data.summary.estimated_cost.toFixed(2)} change="日预算已使用 73%" tone="warning" />
        <Metric label="运行成功率" value={data.summary.success_rate.toFixed(1)} unit="%" change="较上周期 +0.8%" tone="good" />
        <Metric label="首字 P95" value={(data.summary.first_token_p95_ms / 1000).toFixed(2)} unit="s" change="目标低于 1.5s" tone="good" />
      </section>

      <div className="observability-grid">
        <section className="surface chart-surface">
          <SectionTitle title="Token 消耗趋势" description="输入与输出 Token 的每日分布" action={<span className="budget-chip">预算 ¥25 / 天</span>} />
          <div className="token-chart" aria-label="过去七天 Token 消耗">
            <div className="axis-labels"><span>500K</span><span>250K</span><span>0</span></div>
            <div className="chart-grid-lines"><span /><span /><span /></div>
            <div className="token-bars">
              {data.token_series.map((item) => {
                const total = item.input + item.output;
                const totalHeight = (total / maxTokens) * 100;
                const outputRatio = (item.output / total) * totalHeight;
                const inputRatio = totalHeight - outputRatio;
                return <div className="token-bar-group" key={item.date}><div className="token-bar-stack" title={formatNumber(total) + " tokens"}><span className="bar-output" style={{ height: String(outputRatio) + "%" }} /><span className="bar-input" style={{ height: String(inputRatio) + "%" }} /></div><span>{item.date}</span></div>;
              })}
            </div>
          </div>
          <div className="chart-footer"><span><i className="legend-dark" />输入 Token</span><span><i className="legend-orange" />输出 Token</span><strong>今日 ¥{data.token_series[data.token_series.length - 1].cost.toFixed(2)}</strong></div>
        </section>

        <aside className="surface alert-surface">
          <SectionTitle title="风险提醒" description="需要运营人员关注" />
          <div className="alert-list">
            <article className="alert-card alert-warning"><span className="alert-symbol">!</span><div><strong>Token 日预算已使用 73%</strong><p>按当前速度预计 21:40 达到 ¥25 日预算。</p><button>查看成本明细 →</button></div></article>
            <article className="alert-card alert-danger"><span className="alert-symbol">×</span><div><strong>订单工具出现 3 次超时</strong><p>集中发生在 15:20—15:35，建议检查数据服务。</p><button>定位失败日志 →</button></div></article>
          </div>
        </aside>
      </div>

      <section className="surface">
        <SectionTitle title="模型用量" description="费用、稳定性和速度的横向比较" />
        <div className="table-wrap"><table><thead><tr><th>模型</th><th>定位</th><th>请求数</th><th>Token</th><th>成本</th><th>成功率</th><th>平均耗时</th></tr></thead><tbody>
          {data.model_usage.map((item) => <tr key={item.model}><td><strong className="model-name"><i />{item.model}</strong></td><td className="muted-cell">{item.role}</td><td>{formatNumber(item.requests)}</td><td>{formatNumber(item.tokens)}</td><td className="money">¥{item.cost.toFixed(2)}</td><td><span className="success-value">{item.success_rate}%</span></td><td>{(item.avg_latency_ms / 1000).toFixed(2)}s</td></tr>)}
        </tbody></table></div>
      </section>

      <div className="content-grid equal">
        <section className="surface">
          <SectionTitle title="延迟分布" description="完整 Agent Run 耗时" />
          <div className="progress-list">
            {[["P50", 1840, 22], ["P75", 2960, 36], ["P95", 4860, 59], ["P99", 8210, 100]].map(([label, value, width]) => <div className="progress-row" key={String(label)}><span>{label}</span><div><i style={{ width: String(width) + "%" }} /></div><strong>{(Number(value) / 1000).toFixed(2)}s</strong></div>)}
          </div>
        </section>
        <section className="surface">
          <SectionTitle title="工具稳定性" description="业务工具调用质量" />
          <div className="tool-list">
            <div><span><i className="tool-dot good" />get_my_orders</span><strong>99.8%</strong><small>82ms</small></div>
            <div><span><i className="tool-dot good" />get_shipping_status</span><strong>98.9%</strong><small>216ms</small></div>
            <div><span><i className="tool-dot good" />check_refund_eligibility</span><strong>99.5%</strong><small>116ms</small></div>
            <div><span><i className="tool-dot warning" />create_support_ticket</span><strong>97.7%</strong><small>342ms</small></div>
          </div>
        </section>
      </div>
    </div>
  );
}

function Logs({ logs }: { logs: RunLog[] }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [selected, setSelected] = useState<RunLog | null>(null);
  const filtered = logs.filter((log) => {
    const needle = query.toLowerCase();
    return (status === "all" || status === log.status) && (!needle || log.request_id.toLowerCase().includes(needle) || log.run_id.toLowerCase().includes(needle) || log.user.toLowerCase().includes(needle) || log.scene.toLowerCase().includes(needle));
  });
  return (
    <div className="view-stack">
      <section className="filter-bar">
        <label className="search-field wide"><span aria-hidden="true">⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索 request_id、run_id、用户或场景" /></label>
        <label className="select-field"><span>运行状态</span><select value={status} onChange={(event) => setStatus(event.target.value)}><option value="all">全部状态</option><option value="success">成功</option><option value="failed">失败</option></select></label>
      </section>
      <section className="surface">
        <SectionTitle title="Agent Runs" description={"显示 " + filtered.length + " 条运行记录 · 点击一行查看调用链"} />
        <div className="table-wrap"><table className="logs-table"><thead><tr><th>时间 / Request ID</th><th>用户与场景</th><th>模型</th><th>Token / 成本</th><th>首字</th><th>总耗时</th><th>状态</th></tr></thead><tbody>
          {filtered.map((log) => <tr key={log.id} className="clickable-row" onClick={() => setSelected(log)}><td><strong className="mono">{log.request_id}</strong><small>{log.created_at}</small></td><td><strong>{log.user}</strong><small>{log.scene}</small></td><td><span className="model-tag">{log.model}</span></td><td><strong>{formatNumber(log.tokens)}</strong><small>¥{log.cost.toFixed(3)}</small></td><td>{log.first_token_ms ? String(log.first_token_ms) + "ms" : "—"}</td><td>{(log.duration_ms / 1000).toFixed(2)}s</td><td><Status value={log.status} label={log.status_label} /></td></tr>)}
        </tbody></table></div>
      </section>

      {selected ? <div className="drawer-backdrop" onClick={() => setSelected(null)}>
        <aside className="log-drawer" onClick={(event) => event.stopPropagation()} aria-label="运行详情">
          <div className="drawer-head"><div><span>运行详情</span><h2>{selected.scene}</h2></div><button onClick={() => setSelected(null)} aria-label="关闭">×</button></div>
          <div className="drawer-status"><Status value={selected.status} label={selected.status_label} /><span>{selected.created_at}</span></div>
          <dl className="detail-grid">
            <div><dt>Request ID</dt><dd>{selected.request_id}</dd></div><div><dt>Run ID</dt><dd>{selected.run_id}</dd></div><div><dt>模型</dt><dd>{selected.model}</dd></div><div><dt>Token</dt><dd>{formatNumber(selected.tokens)}</dd></div><div><dt>预估成本</dt><dd>¥{selected.cost.toFixed(3)}</dd></div><div><dt>完整耗时</dt><dd>{(selected.duration_ms / 1000).toFixed(2)}s</dd></div>
          </dl>
          {selected.error_code ? <div className="error-banner"><strong>{selected.error_code}</strong><span>工具调用达到超时上限，请检查上游数据服务。</span></div> : null}
          <div className="drawer-section"><h3>调用工具</h3><div className="tool-tags">{selected.tools.map((tool) => <span key={tool}>{tool}</span>)}</div></div>
          <div className="drawer-section"><h3>执行时间线</h3><ol className="timeline">{selected.timeline.map((item, index) => <li key={item.label}><span className={index === selected.timeline.length - 1 && selected.status === "failed" ? "failed" : ""} /><div><strong>{item.label}</strong><p>{item.detail}</p></div><time>+{item.time_ms}ms</time></li>)}</ol></div>
        </aside>
      </div> : null}
    </div>
  );
}

function Channels() {
  const [syncing, setSyncing] = useState(false);
  const triggerSync = () => { setSyncing(true); window.setTimeout(() => setSyncing(false), 1200); };
  return (
    <div className="view-stack">
      <section className="channel-hero">
        <div><span className="hero-kicker">CHANNEL STATUS</span><h2>让订单数据保持新鲜，<br />Agent 才能给出可信回答。</h2><p>第一版使用 Mock 数据模拟淘宝授权、订单同步和消息消费流程。</p></div>
        <div className="sync-score"><span>同步健康度</span><strong>100</strong><small>/ 100</small></div>
      </section>
      <section className="surface channel-card">
        <div className="channel-brand"><span className="taobao-mark">淘</span><div><h2>淘宝店铺</h2><p>风桥数码旗舰店</p></div></div>
        <Status value="connected" label="已连接 · Mock" />
        <dl className="channel-stats"><div><dt>已同步订单</dt><dd>12,842</dd></div><div><dt>待处理消息</dt><dd>0</dd></div><div><dt>最近同步</dt><dd>{syncing ? "同步中…" : "2 分钟前"}</dd></div><div><dt>授权有效期</dt><dd>演示模式</dd></div></dl>
        <div className="channel-actions"><button className="button button-primary" onClick={triggerSync} disabled={syncing}>{syncing ? "正在同步" : "立即同步"}</button><button className="button button-quiet">查看同步日志</button></div>
      </section>
      <section className="connection-flow">
        <SectionTitle title="真实接入路径" description="下一阶段接入淘宝开放平台时按此流程替换 Mock 数据" />
        <div className="flow-steps">
          <div><span>01</span><strong>商家授权</strong><p>通过 OAuth 绑定淘宝店铺，令牌只保存在服务端。</p></div><i>→</i>
          <div><span>02</span><strong>首次同步</strong><p>分批拉取近期订单，再补充订单详情和物流。</p></div><i>→</i>
          <div><span>03</span><strong>消息更新</strong><p>消费订单变化消息，并按订单号获取最新状态。</p></div><i>→</i>
          <div><span>04</span><strong>Agent 查询</strong><p>Agent 始终通过受控工具读取本地业务数据。</p></div>
        </div>
      </section>
    </div>
  );
}

const agentSuggestions = [
  "查看待发货订单",
  "订单总额是多少？",
  "查询 TB202609150086 的物流",
  "周子涵买了什么？",
];

function AgentWorkspace() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [showJumpToBottom, setShowJumpToBottom] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [runtime, setRuntime] = useState<"checking" | "live" | "error">("checking");
  const [agentStatus, setAgentStatus] = useState<AgentStatus | null>(null);
  const messagesRef = useRef<HTMLDivElement>(null);
  const followLatestRef = useRef(true);
  const requestStartedAtRef = useRef<number | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "你好，我是风桥订单助手。你可以直接问我订单数量、客户购买记录、订单状态或物流进度。我只会通过已授权的只读 MCP 工具访问业务数据。",
    },
  ]);

  const lastAssistant = messages.slice().reverse().find((message) => message.role === "assistant" && message.tool_calls?.length);
  const lastTools = lastAssistant?.tool_calls ?? [];

  useEffect(() => {
    fetch(BFF_URL + "/api/v1/agent/status")
      .then(async (response) => {
        if (!response.ok) throw new Error("STATUS_UNAVAILABLE");
        return response.json() as Promise<AgentStatus>;
      })
      .then((status) => {
        setAgentStatus(status);
        setRuntime(status.configured ? "live" : "error");
      })
      .catch(() => setRuntime("error"));
  }, []);

  useEffect(() => {
    if (!followLatestRef.current) {
      setShowJumpToBottom(true);
      return;
    }
    const frame = window.requestAnimationFrame(() => {
      const container = messagesRef.current;
      if (!container) return;
      container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
      setShowJumpToBottom(false);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [messages, loading]);

  useEffect(() => {
    if (!loading || requestStartedAtRef.current === null) return;
    const updateElapsed = () => setElapsedMs(Math.round(performance.now() - (requestStartedAtRef.current ?? performance.now())));
    updateElapsed();
    const timer = window.setInterval(updateElapsed, 100);
    return () => window.clearInterval(timer);
  }, [loading]);

  const handleMessageScroll = () => {
    const container = messagesRef.current;
    if (!container) return;
    const distanceToBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
    const isNearBottom = distanceToBottom < 72;
    followLatestRef.current = isNearBottom;
    setShowJumpToBottom(!isNearBottom);
  };

  const jumpToBottom = () => {
    const container = messagesRef.current;
    if (!container) return;
    followLatestRef.current = true;
    setShowJumpToBottom(false);
    container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
  };

  const resetChat = () => {
    followLatestRef.current = true;
    setSessionId(null);
    setMessages([{ id: "welcome-reset", role: "assistant", content: "新会话已创建。想先查看哪些订单数据？" }]);
    setInput("");
  };

  const sendMessage = async (rawQuestion?: string) => {
    const question = (rawQuestion ?? input).trim();
    if (!question || loading) return;
    const userMessage: ChatMessage = { id: `user_${Date.now()}`, role: "user", content: question };
    requestStartedAtRef.current = performance.now();
    setElapsedMs(0);
    followLatestRef.current = true;
    setMessages((current) => [...current, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch(BFF_URL + "/api/v1/agent/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ session_id: sessionId, message: question }),
      });
      if (!response.ok) {
        const failed: unknown = await response.json().catch(() => null);
        throw new Error(apiErrorMessage(failed, response.status));
      }
      const payload = await response.json() as AgentReply;
      const clientDurationMs = requestStartedAtRef.current === null ? 0 : Math.round(performance.now() - requestStartedAtRef.current);
      setSessionId(payload.session_id);
      setRuntime("live");
      setMessages((current) => [...current, {
        id: payload.run_id, role: "assistant", content: payload.message,
        tool_calls: payload.tool_calls, usage: payload.usage, request_id: payload.request_id,
        first_token_ms: payload.first_token_ms, duration_ms: payload.duration_ms ?? clientDurationMs,
      }]);
    } catch (error) {
      setRuntime("error");
      const reason = error instanceof Error ? error.message : "未知错误";
      const clientDurationMs = requestStartedAtRef.current === null ? undefined : Math.round(performance.now() - requestStartedAtRef.current);
      setMessages((current) => [...current, {
        id: `error_${Date.now()}`, role: "assistant",
        content: `真实模型调用失败：${reason}。请检查本地 API Key、Base URL 和模型名称后重试。`,
        duration_ms: clientDurationMs,
      }]);
    } finally {
      requestStartedAtRef.current = null;
      setLoading(false);
    }
  };

  return (
    <section className="agent-shell">
      <aside className="agent-sessions">
        <div className="agent-sessions-head"><span>会话</span><button onClick={resetChat} aria-label="新建会话">＋</button></div>
        <button className="agent-session active"><span>订单运营分析</span><small>刚刚 · 当前会话</small></button>
        <button className="agent-session"><span>售后原因汇总</span><small>昨天 · 6 条消息</small></button>
        <button className="agent-session"><span>物流异常排查</span><small>9月14日 · 4 条消息</small></button>
        <div className="agent-session-note"><i>只读</i><p>当前 Agent 不能修改订单、退款或创建工单。</p></div>
      </aside>

      <div className="agent-chat">
        <div className="agent-chat-head">
          <div><span className="agent-avatar">F</span><div><strong>订单运营 Agent</strong><small><i />{runtime === "live" ? "Responses API 已配置" : runtime === "error" ? "真实模型连接异常" : "正在检查模型配置"}</small></div></div>
          <button className="agent-new-chat" onClick={resetChat}>新建对话</button>
        </div>

        <div className="agent-scroll-region">
          <div ref={messagesRef} className="agent-messages" aria-live="polite" onScroll={handleMessageScroll}>
            {messages.map((message) => (
              <article key={message.id} className={`agent-message ${message.role}`}>
                <span className="message-avatar">{message.role === "assistant" ? "F" : "M"}</span>
                <div className="message-body">
                  <div className="message-copy">{message.content}</div>
                  {message.tool_calls?.map((tool) => (
                    <details className="message-tool" key={tool.id}>
                      <summary><span><i />已调用 {tool.name}</span><small>{tool.duration_ms}ms⌄</small></summary>
                      <div><code>{JSON.stringify(tool.arguments)}</code><p>{tool.result_preview}</p></div>
                    </details>
                  ))}
                  {message.duration_ms ? <small className="message-performance"><i />反应速度 {formatLatency(message.duration_ms)}{message.first_token_ms ? <span>首轮响应 {formatLatency(message.first_token_ms)}</span> : null}</small> : null}
                  {message.usage ? <small className="message-usage">{message.usage.total_tokens} tokens · ¥{message.usage.estimated_cost.toFixed(3)} · {message.request_id}</small> : null}
                </div>
              </article>
            ))}
            {loading ? <article className="agent-message assistant"><span className="message-avatar">F</span><div className="message-body"><div className="agent-thinking"><i /><i /><i /><span>正在选择 MCP 工具 · {formatLatency(elapsedMs)}</span></div></div></article> : null}
          </div>
          {showJumpToBottom ? <button type="button" className="agent-jump-bottom" onClick={jumpToBottom} aria-label="回到最新消息"><span>↓</span>回到底部</button> : null}
        </div>

        <div className="agent-starters">
          {agentSuggestions.map((suggestion) => <button key={suggestion} onClick={() => void sendMessage(suggestion)} disabled={loading}>{suggestion}<span>↗</span></button>)}
        </div>
        <form className="agent-composer" onSubmit={(event) => { event.preventDefault(); void sendMessage(); }}>
          <textarea value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); void sendMessage(); } }} placeholder="询问订单、客户、物流或经营数据…" rows={2} />
          <div><span>Enter 发送 · Shift + Enter 换行</span><button type="submit" disabled={!input.trim() || loading} aria-label="发送消息">↑</button></div>
        </form>
      </div>

      <aside className="agent-inspector">
        <div className="inspector-section"><span className="inspector-label">运行配置</span><dl><div><dt>Agent</dt><dd>订单运营 Agent</dd></div><div><dt>模型</dt><dd>{agentStatus?.configured_model ?? "读取中"}</dd></div><div><dt>模型服务</dt><dd>{agentStatus?.provider ?? "openai-compatible"}</dd></div><div><dt>数据域</dt><dd>淘宝订单 · Mock</dd></div><div><dt>会话</dt><dd>{sessionId ? sessionId.slice(0, 16) : "未开始"}</dd></div></dl></div>
        <div className="inspector-section"><span className="inspector-label">订单 MCP 工具</span><div className="mcp-tools"><div><i>查</i><span><strong>search_orders</strong><small>筛选订单列表</small></span></div><div><i>详</i><span><strong>get_order_detail</strong><small>读取订单详情</small></span></div><div><i>运</i><span><strong>get_shipping_status</strong><small>查询物流节点</small></span></div><div><i>统</i><span><strong>get_order_summary</strong><small>汇总经营数据</small></span></div></div></div>
        <div className="inspector-section"><span className="inspector-label">最近一次工具调用</span>{lastTools.length ? lastTools.map((tool) => <div className="inspector-call" key={tool.id}><div><strong>{tool.name}</strong><span>{tool.status}</span></div><code>{JSON.stringify(tool.arguments, null, 2)}</code><p>{tool.result_preview}</p></div>) : <p className="inspector-empty">发送一条消息后，这里会展示 Agent 的工具调用与参数。</p>}</div>
      </aside>
    </section>
  );
}

export default function Home() {
  const [view, setView] = useState<ViewId>("overview");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [orders, setOrders] = useState<Order[]>(mockOrders);
  const [tickets, setTickets] = useState<Ticket[]>(mockTickets);
  const [logs, setLogs] = useState<RunLog[]>(mockLogs);
  const [observability, setObservability] = useState(mockObservability);
  const [dataMode, setDataMode] = useState<"connecting" | "api" | "mock">("connecting");
  const meta = pageMeta[view];

  useEffect(() => {
    const load = async () => {
      try {
        const [ordersResponse, ticketsResponse, logsResponse, observabilityResponse] = await Promise.all([
          fetch(BFF_URL + "/api/v1/orders"),
          fetch(BFF_URL + "/api/v1/tickets"),
          fetch(BFF_URL + "/api/v1/observability/logs"),
          fetch(BFF_URL + "/api/v1/observability/overview"),
        ]);
        if (!ordersResponse.ok || !ticketsResponse.ok || !logsResponse.ok || !observabilityResponse.ok) throw new Error("API_UNAVAILABLE");
        const ordersPayload = await ordersResponse.json();
        const ticketsPayload = await ticketsResponse.json();
        const logsPayload = await logsResponse.json();
        const observabilityPayload = await observabilityResponse.json();
        setOrders(ordersPayload.items); setTickets(ticketsPayload.items); setLogs(logsPayload.items); setObservability(observabilityPayload); setDataMode("api");
      } catch { setDataMode("mock"); }
    };
    load();
  }, []);

  const selectView = (next: ViewId) => {
    setView(next); setMobileNavOpen(false); window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="app-shell">
      <aside className={"sidebar " + (mobileNavOpen ? "sidebar-open" : "")}>
        <div className="brand"><span className="brand-mark">F</span><div><strong>FENG</strong><small>商家智能工作台</small></div></div>
        <nav aria-label="主要导航">
          <span className="nav-label">工作台</span>
          {navigation.slice(0, 4).map((item) => <button key={item.id} className={view === item.id ? "active" : ""} onClick={() => selectView(item.id)}><span className="nav-icon">{item.short}</span><span><strong>{item.label}</strong><small>{item.description}</small></span></button>)}
          <span className="nav-label nav-label-spaced">系统</span>
          {navigation.slice(4).map((item) => <button key={item.id} className={view === item.id ? "active" : ""} onClick={() => selectView(item.id)}><span className="nav-icon">{item.short}</span><span><strong>{item.label}</strong><small>{item.description}</small></span>{item.id === "logs" ? <i className="nav-count">3</i> : null}</button>)}
        </nav>
        <div className="sidebar-bottom">
          <div className="plan-usage"><div><span>本月 AI 预算</span><strong>¥184 / ¥500</strong></div><div className="usage-track"><i /></div><small>还可使用 63.2%</small></div>
          <button className="profile"><span className="avatar">M</span><span><strong>Matthew</strong><small>超级管理员</small></span><i>⌄</i></button>
        </div>
      </aside>
      {mobileNavOpen ? <button className="nav-backdrop" aria-label="关闭导航" onClick={() => setMobileNavOpen(false)} /> : null}
      <main className="main">
        <header className="topbar">
          <button className="mobile-menu" onClick={() => setMobileNavOpen(true)} aria-label="打开导航">☰</button>
          <div className="page-title"><span>{meta.eyebrow}</span><h1>{meta.title}</h1><p>{meta.subtitle}</p></div>
          <div className="topbar-actions"><span className={"data-mode data-" + dataMode}><i />{dataMode === "api" ? "API 数据" : dataMode === "mock" ? "前端 Mock" : "连接中"}</span><button className="icon-button" aria-label="搜索">⌕</button><button className="icon-button notification" aria-label="通知">•<i /></button></div>
        </header>
        <div className="content">
          {view === "overview" ? <Overview setView={selectView} orders={orders} /> : null}
          {view === "agent" ? <AgentWorkspace /> : null}
          {view === "orders" ? <Orders orders={orders} /> : null}
          {view === "tickets" ? <Tickets tickets={tickets} /> : null}
          {view === "observability" ? <Observability data={observability} /> : null}
          {view === "logs" ? <Logs logs={logs} /> : null}
          {view === "channels" ? <Channels /> : null}
        </div>
      </main>
    </div>
  );
}
