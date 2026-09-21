# Reward List Operator Filter Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为奖励管理列表原型页新增操作人和操作时间筛选，并统一列表与导出中的字段口径。

**Architecture:** 直接在现有单文件 HTML 原型中完成修改，保持原有 DOM 结构、样式模式和 mock 数据形态不变。筛选逻辑在现有 `applyFilter()` 中扩展，展示口径和导出字段同步调整。

**Tech Stack:** HTML, CSS, Vanilla JavaScript, XLSX CDN

---

### Task 1: 更新筛选区结构与样式

**Files:**
- Modify: `D:\xhgj002358\VSCODE\版本管理\MPM-4.6.1--OMS-MPM定向物料生成文档\MPM-咸亨产品奖励管理-奖励配置列表.html`

- [ ] **Step 1: 添加筛选项 DOM**

在 `rewardFilterForm` 中新增：
- `操作人` 文本输入框
- `操作时间` 开始日期输入框
- `操作时间` 结束日期输入框

- [ ] **Step 2: 调整筛选区栅格**

扩展现有 `reward-filter-grid`，确保新增字段后在当前页面宽度下仍能正常换行显示。

- [ ] **Step 3: 检查重置行为**

确认 `form.reset()` 能同时清空新增文本和日期输入项。

### Task 2: 更新列表字段口径与渲染

**Files:**
- Modify: `D:\xhgj002358\VSCODE\版本管理\MPM-4.6.1--OMS-MPM定向物料生成文档\MPM-咸亨产品奖励管理-奖励配置列表.html`

- [ ] **Step 1: 修改表头文案**

将列表表头中的：
- `更新时间` 改为 `操作时间`
- `更新人` 改为 `操作人`

- [ ] **Step 2: 保持数据映射**

继续使用行数据的 `updated`、`updater` 字段渲染，无需调整 mock 数据结构。

### Task 3: 扩展筛选逻辑

**Files:**
- Modify: `D:\xhgj002358\VSCODE\版本管理\MPM-4.6.1--OMS-MPM定向物料生成文档\MPM-咸亨产品奖励管理-奖励配置列表.html`

- [ ] **Step 1: 读取新增筛选值**

在 `applyFilter()` 中新增读取：
- `rewardOperator`
- `rewardOperateDateStart`
- `rewardOperateDateEnd`

- [ ] **Step 2: 实现匹配逻辑**

新增两类过滤规则：
- `操作人`：对 `row.updater` 执行 `includes`
- `操作时间`：取 `row.updated` 前 10 位日期，与开始/结束日期做闭区间比较

- [ ] **Step 3: 更新查询摘要口径**

让 `state.keyword` 能覆盖新增筛选条件，避免查询后空态提示与实际条件脱节。

### Task 4: 统一导出与页面文案

**Files:**
- Modify: `D:\xhgj002358\VSCODE\版本管理\MPM-4.6.1--OMS-MPM定向物料生成文档\MPM-咸亨产品奖励管理-奖励配置列表.html`

- [ ] **Step 1: 修改导出表头**

将奖励规则导出中的：
- `最近更新人` 改为 `操作人`
- `最近更新时间` 改为 `操作时间`

- [ ] **Step 2: 修改导出说明**

将导出说明中对应系统列的名称和说明同步改名。

- [ ] **Step 3: 修改页面提示文案**

将页面底部演示说明中关于筛选区的描述补充为支持按操作人和操作时间查询。

### Task 5: 静态验证

**Files:**
- Verify: `D:\xhgj002358\VSCODE\版本管理\MPM-4.6.1--OMS-MPM定向物料生成文档\MPM-咸亨产品奖励管理-奖励配置列表.html`

- [ ] **Step 1: 运行字符串断言**

验证页面中存在：
- `操作人`
- `操作时间`
- `rewardOperator`
- `rewardOperateDateStart`
- `rewardOperateDateEnd`

同时验证页面中不再存在：
- `最近更新人`
- `最近更新时间`

- [ ] **Step 2: 检查关键渲染片段**

抽取筛选区、表头、`applyFilter()`、导出表头四个片段，人工确认改动完整。
