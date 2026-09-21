# Initiated Text Action Buttons Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将“我发起的”页面六个指定操作改为蓝色文字按钮，并把“废弃”改为“放弃”。

**Architecture:** 新增一个通用 `.btn-text` 样式并应用到指定按钮，保留现有按钮 DOM、事件函数和批量导出下拉结构。仅同步修改“放弃”的按钮及反馈文案，不调整“导入批次”。

**Tech Stack:** HTML、CSS、原生 JavaScript、Node.js 静态断言、Edge CDP 浏览器验证

---

### Task 1: 建立失败断言

**Files:**
- Test: `MPM-物料-我发起的.html`

- [ ] **Step 1: 运行文字按钮和放弃文案断言**

```powershell
node -e "const fs=require('fs');const h=fs.readFileSync('MPM-物料-我发起的.html','utf8');if(!h.includes('.btn-text')||!h.includes('>放弃</button>'))throw new Error('文字按钮样式或放弃文案缺失');"
```

Expected: FAIL，提示文字按钮样式或放弃文案缺失。

### Task 2: 修改样式与按钮

**Files:**
- Modify: `MPM-物料-我发起的.html:83`
- Modify: `MPM-物料-我发起的.html:252`

- [ ] **Step 1: 新增蓝色文字按钮样式**

新增 `.btn-text`，移除背景和边框，使用 `var(--primary)`，悬停时使用 `var(--primary-hover)` 并添加下划线。

- [ ] **Step 2: 应用到六个指定操作**

为刷新、批量撤回、批量导出、导入批改、提交和放弃添加 `btn-text`，保留“导入批次”的 `btn-default`。

- [ ] **Step 3: 修改放弃文案**

将按钮文案从“废弃”改为“放弃”，点击反馈从“已废弃所选物料”改为“已放弃所选物料”。

### Task 3: 验证样式与交互

**Files:**
- Test: `MPM-物料-我发起的.html`

- [ ] **Step 1: 运行静态和脚本语法检查**

确认六个按钮均具有 `btn-text`，导入批次不具有 `btn-text`，页面不存在原废弃文案。

- [ ] **Step 2: 使用 Edge CDP 验证**

确认六个按钮计算样式为蓝色、透明背景且无可见边框；批量导出下拉、导入批改弹窗和放弃反馈均正常。
