# Remove Initiated Import Batch Button Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 从“我发起的”页面操作栏删除“导入批次”按钮及其消息反馈入口。

**Architecture:** 仅删除操作栏中的单个按钮节点，不修改共享样式、脚本函数或其他按钮结构。通过静态断言与 Edge CDP 验证按钮消失及相邻交互正常。

**Tech Stack:** HTML、原生 JavaScript、Node.js 静态断言、Edge CDP 浏览器验证

---

### Task 1: 建立失败断言

**Files:**
- Test: `MPM-物料-我发起的.html`

- [ ] **Step 1: 验证页面当前仍包含导入批次**

运行断言，要求页面不包含“导入批次”和“正在导入批次...”。

Expected: FAIL，因为按钮尚未删除。

### Task 2: 删除按钮

**Files:**
- Modify: `MPM-物料-我发起的.html:264`

- [ ] **Step 1: 删除导入批次按钮节点**

删除包含“导入批次”及 `showMsg('正在导入批次...')` 的完整 `<button>` 元素，不修改相邻按钮。

### Task 3: 验证操作栏

**Files:**
- Test: `MPM-物料-我发起的.html`

- [ ] **Step 1: 运行静态与脚本语法检查**

确认源码不包含导入批次文案，导入批改后紧邻提交，页面内联脚本可正常编译。

- [ ] **Step 2: 使用 Edge CDP 验证**

确认操作栏不存在导入批次，剩余六个文字按钮顺序正确，批量导出下拉与导入批改弹窗仍能打开。
