# 推荐、厂控物料赋值切换 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为“新增物料审核详情”页面的推荐与厂控物料字段增加可循环执行、可恢复原值的“赋值/取消”交互。

**Architecture:** 在现有单文件 HTML 中增加通用横向字段操作样式，并分别为原生下拉和自定义推荐多选维护赋值前快照。按钮只切换对应字段的锁定状态，推荐字段复用现有 `renderRecommendTags()` 和有效期联动逻辑。

**Tech Stack:** HTML5、CSS、原生 JavaScript、Playwright 浏览器验证

---

### Task 1: 增加字段操作布局与禁用样式

**Files:**
- Modify: `版本管理/MPM-4.6.1--OMS-MPM定向物料生成文档/MPM-物料-待我审核-新增物料审核详情.html:122`

- [ ] **Step 1: 增加组合布局样式**

在表单控件样式后加入 `.assign-field-group`、`.assign-field-control` 和 `.assign-toggle-btn`，使控件占据剩余空间且按钮宽度固定。

- [ ] **Step 2: 增加推荐控件锁定样式**

为 `.recommend-multi-select.is-assigned .recommend-select-trigger` 设置浅灰背景、灰色文字与 `not-allowed` 光标，并隐藏或禁用交互反馈。

### Task 2: 调整厂控物料与推荐字段 DOM

**Files:**
- Modify: `版本管理/MPM-4.6.1--OMS-MPM定向物料生成文档/MPM-物料-待我审核-新增物料审核详情.html:1171`

- [ ] **Step 1: 包装厂控物料字段**

为厂控物料下拉增加 `id=factoryControlledSelect`，放入横向组合容器，并在右侧添加默认文案为“赋值”的 `factoryAssignButton`。

- [ ] **Step 2: 包装推荐字段**

将 `recommendMultiSelect` 放入横向组合容器，并在右侧添加默认文案为“赋值”的 `recommendAssignButton`。

- [ ] **Step 3: 补充无障碍状态**

按钮使用 `type=button`；推荐触发器在锁定时同步 `aria-disabled` 与 `tabindex`。

### Task 3: 实现独立赋值与取消逻辑

**Files:**
- Modify: `版本管理/MPM-4.6.1--OMS-MPM定向物料生成文档/MPM-物料-待我审核-新增物料审核详情.html:2791`

- [ ] **Step 1: 缓存控件和按钮引用**

获取 `factoryControlledSelect`、`factoryAssignButton`、`recommendAssignButton`，并建立厂控原值与推荐选中值快照变量。

- [ ] **Step 2: 实现厂控物料切换**

赋值时保存当前值、选择首个非空 option、禁用 select 并显示“取消”；取消时恢复快照、启用 select 并显示“赋值”。

- [ ] **Step 3: 实现推荐字段切换**

赋值时保存所有已选值、仅选中第一个 checkbox、关闭面板、禁用触发器与 checkbox 并显示“取消”；取消时按快照恢复勾选项、重新启用控件并显示“赋值”。

- [ ] **Step 4: 复用现有推荐联动**

每次推荐赋值或恢复后调用 `renderRecommendTags()`，确保标签和“核心主推（自研）”有效期限同步更新。

- [ ] **Step 5: 阻止锁定状态打开下拉**

在推荐触发器点击和键盘事件入口判断锁定状态，锁定时直接返回。

### Task 4: 浏览器验证交互循环

**Files:**
- Test: `版本管理/MPM-4.6.1--OMS-MPM定向物料生成文档/MPM-物料-待我审核-新增物料审核详情.html`

- [ ] **Step 1: 启动本地静态预览**

Run: `node _preview_server.js`

Expected: 页面可通过本地 HTTP 地址访问，无脚本加载错误。

- [ ] **Step 2: 验证厂控物料循环**

使用 Playwright 依次选择“否”→点击“赋值”→确认值为“是”且禁用→点击“取消”→确认恢复“否”且可编辑。

- [ ] **Step 3: 验证推荐字段循环**

使用 Playwright 先选中非首项→点击“赋值”→确认仅保留“核心主推（自研）”且控件锁定→点击“取消”→确认恢复原选项且可编辑。

- [ ] **Step 4: 验证字段状态互不影响**

确认只操作一个按钮时，另一个字段的值、禁用状态和按钮文案均不变化，并检查浏览器控制台无错误。
