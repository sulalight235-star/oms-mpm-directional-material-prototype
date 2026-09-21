# 批量新增物料列表新增字段 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在批量新增物料列表中按指定顺序增加“项目参考调拨价”和“描述”两列。

**Architecture:** 保持现有静态表格结构，仅调整表格最小宽度、表头和 4 条静态数据行。新增价格列复用 `.price` 样式，描述列复用 `.text-truncate` 和 `.muted` 样式。

**Tech Stack:** HTML5、CSS3、Edge DevTools Protocol 浏览器验证。

---

### Task 1: 建立新增列缺失基线

**Files:**
- Inspect: `版本管理/MPM-4.6.1--OMS-MPM定向物料生成文档/MPM-物料-批量新增.html`

- [ ] 断言表头不存在“项目参考调拨价”和“描述”，确认修改前检查失败。

### Task 2: 修改表格结构

**Files:**
- Modify: `版本管理/MPM-4.6.1--OMS-MPM定向物料生成文档/MPM-物料-批量新增.html:94`
- Modify: `版本管理/MPM-4.6.1--OMS-MPM定向物料生成文档/MPM-物料-批量新增.html:456`

- [ ] 将表格最小宽度从 `1900px` 调整为 `2160px`。
- [ ] 在“市场价”后增加“项目参考调拨价”和“描述”表头。
- [ ] 在 4 条数据行的市场价后分别增加两个显示“—”的单元格。

### Task 3: 验证列顺序与布局

**Files:**
- Verify: `版本管理/MPM-4.6.1--OMS-MPM定向物料生成文档/MPM-物料-批量新增.html`

- [ ] 验证表头顺序为“市场价、项目参考调拨价、描述、物料品牌”。
- [ ] 验证每行单元格数量与表头数量一致。
- [ ] 验证表格最小宽度为 `2160px`，横向滚动区域宽度小于表格宽度。
- [ ] 验证页面无 JavaScript 异常。

> 当前原型目录无自动化测试框架，采用修改前失败断言和修改后浏览器结构检查完成验证，不创建提交。
