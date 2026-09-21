# “我发起的”列表新增单位与价格字段 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在“我发起的”4 个子 Tab 列表中，于“规格”后增加单位及三个价格字段，并提供差异化虚拟数据。

**Architecture:** 表头和 `renderTable()` 为所有子 Tab 共用，只需修改一次。使用与两个数据数组等长的商业信息预设，通过 `Object.assign` 合并到现有行数据，渲染时统一调用价格格式化函数并提供空值兜底。

**Tech Stack:** HTML5、CSS3、原生 JavaScript、Edge DevTools Protocol 浏览器验证。

---

### Task 1: 建立新增字段缺失基线

**Files:**
- Inspect: `版本管理/MPM-4.6.1--OMS-MPM定向物料生成文档/MPM-物料-我发起的.html`

- [ ] 断言表头中不存在“单位、市场价、商城价、项目参考调拨价”，确认修改前检查失败。

### Task 2: 添加列样式和表头

**Files:**
- Modify: `版本管理/MPM-4.6.1--OMS-MPM定向物料生成文档/MPM-物料-我发起的.html:99`
- Modify: `版本管理/MPM-4.6.1--OMS-MPM定向物料生成文档/MPM-物料-我发起的.html:258`

- [ ] 将表格最小宽度从 `2400px` 调整为 `2880px`。
- [ ] 增加价格单元格等宽数字样式和空值弱化样式。
- [ ] 在“规格”后依次增加“单位、市场价、商城价、项目参考调拨价”表头。

### Task 3: 补充虚拟单位与价格

**Files:**
- Modify: `版本管理/MPM-4.6.1--OMS-MPM定向物料生成文档/MPM-物料-我发起的.html:336`

- [ ] 为 `ROWS_NEW` 配置 19 组差异化单位和价格预设。
- [ ] 为 `ROWS_DIRECTIONAL` 配置 6 组差异化单位和价格预设。
- [ ] 将预设合并到对应行对象，特殊待审记录的项目参考调拨价使用空值。

### Task 4: 更新统一渲染逻辑

**Files:**
- Modify: `版本管理/MPM-4.6.1--OMS-MPM定向物料生成文档/MPM-物料-我发起的.html:343`
- Modify: `版本管理/MPM-4.6.1--OMS-MPM定向物料生成文档/MPM-物料-我发起的.html:374`

- [ ] 增加 `formatPrice(value)`，数字统一显示两位小数，空值显示“—”。
- [ ] 在规格单元格后依次渲染单位及三个价格单元格。
- [ ] 单位缺失时显示“—”，禁止出现 `undefined` 或 `null`。

### Task 5: 验证所有子 Tab

**Files:**
- Verify: `版本管理/MPM-4.6.1--OMS-MPM定向物料生成文档/MPM-物料-我发起的.html`

- [ ] 逐一切换 4 个子 Tab，验证表头顺序一致。
- [ ] 验证每个 Tab 的每行单元格数量与表头一致。
- [ ] 验证价格为两位小数或“—”，且满足虚拟价格关系。
- [ ] 验证横向滚动正常，页面无 JavaScript 异常。

> 当前原型目录无自动化测试框架，采用修改前失败断言和修改后真实浏览器 Tab 切换检查完成验证，不创建提交。
