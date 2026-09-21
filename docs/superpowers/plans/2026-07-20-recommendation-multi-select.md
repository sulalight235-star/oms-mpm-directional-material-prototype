# “推荐”字段下拉多选 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将“推荐”字段从原生多选列表改为可展开、可多选、可删除标签的输入型下拉控件。

**Architecture:** 保持现有单文件 HTML 原型结构，在页面样式区增加独立的 `recommend-multi-select` 样式，在字段位置替换原生 `select multiple`，并在现有脚本末尾增加状态同步与关闭逻辑。控件使用复选框作为真实选择状态，标签区域由脚本根据复选框状态重新渲染。

**Tech Stack:** HTML5、CSS3、原生 JavaScript、Playwright 浏览器验证。

---

### Task 1: 建立修改前交互基线

**Files:**
- Inspect: `版本管理/MPM-4.6.1--OMS-MPM定向物料生成文档/MPM-物料-待我审核-新增物料审核详情.html:1153`

- [ ] **Step 1: 启动本地静态页面服务**

Run: `node _preview_server.js`

Expected: 页面可通过本地 HTTP 地址访问，返回状态码 `200`。

- [ ] **Step 2: 运行修改前浏览器检查**

使用 Playwright 打开页面并检查：

```javascript
const oldSelect = page.locator('select[aria-label=推荐多选]');
await oldSelect.waitFor();
console.assert(await oldSelect.getAttribute('multiple') !== null);
console.assert(await page.locator('#recommendMultiSelect').count() === 0);
```

Expected: 原生多选存在，自定义多选不存在，证明新交互检查在修改前不满足。

### Task 2: 实现输入型下拉多选

**Files:**
- Modify: `版本管理/MPM-4.6.1--OMS-MPM定向物料生成文档/MPM-物料-待我审核-新增物料审核详情.html:121`
- Modify: `版本管理/MPM-4.6.1--OMS-MPM定向物料生成文档/MPM-物料-待我审核-新增物料审核详情.html:1153`
- Modify: `版本管理/MPM-4.6.1--OMS-MPM定向物料生成文档/MPM-物料-待我审核-新增物料审核详情.html:2719`

- [ ] **Step 1: 添加控件样式**

新增 `.recommend-multi-select`、`.recommend-select-trigger`、`.recommend-tags`、`.recommend-tag`、`.recommend-select-panel` 和 `.recommend-option` 样式，复用页面现有颜色、边框、圆角和阴影变量。

- [ ] **Step 2: 替换字段 HTML**

将原生 `select multiple` 替换为以下结构：

```html
<div class=recommend-multi-select id=recommendMultiSelect>
  <button class=recommend-select-trigger id=recommendSelectTrigger type=button
    aria-expanded=false aria-controls=recommendSelectPanel>
    <span class=recommend-tags id=recommendTags><span class=recommend-placeholder>请选择</span></span>
    <span class=recommend-arrow aria-hidden=true></span>
  </button>
  <div class=recommend-select-panel id=recommendSelectPanel role=group aria-label=推荐选项>
    <label class=recommend-option><input type=checkbox value=核心主推 />核心主推</label>
    <label class=recommend-option><input type=checkbox value=主推 />主推</label>
    <label class=recommend-option><input type=checkbox value=常规 />常规</label>
    <label class=recommend-option><input type=checkbox value=零星 />零星</label>
  </div>
</div>
```

- [ ] **Step 3: 添加状态同步脚本**

实现 `setRecommendPanelOpen(open)`、`renderRecommendTags()` 和 `removeRecommendValue(value)`：

```javascript
function setRecommendPanelOpen(open) {
  recommendMultiSelect.classList.toggle('open', open);
  recommendSelectTrigger.setAttribute('aria-expanded', String(open));
}

function renderRecommendTags() {
  const selected = [...recommendMultiSelect.querySelectorAll('input[type=checkbox]:checked')];
  recommendTags.innerHTML = selected.length
    ? selected.map(input => `<span class=recommend-tag>${input.value}<span class=recommend-tag-remove role=button tabindex=0 data-value=${input.value} aria-label=取消${input.value}>×</span></span>`).join('')
    : '<span class=recommend-placeholder>请选择</span>';
}
```

同时绑定触发器点击、复选框变化、标签删除、页面外点击和 `Escape` 收起事件。

### Task 3: 验证视觉与交互

**Files:**
- Verify: `版本管理/MPM-4.6.1--OMS-MPM定向物料生成文档/MPM-物料-待我审核-新增物料审核详情.html`

- [ ] **Step 1: 运行结构检查**

Run: `rg -n recommendMultiSelect|recommendSelectPanel|renderRecommendTags|select\[aria-label="推荐多选"\] MPM-物料-待我审核-新增物料审核详情.html`

Expected: 自定义控件及脚本存在，旧原生多选结构不存在。

- [ ] **Step 2: 运行浏览器交互检查**

```javascript
await page.locator('#recommendSelectTrigger').click();
console.assert(await page.locator('#recommendSelectPanel').isVisible());
await page.getByLabel('推荐选项').getByText('核心主推').click();
await page.getByLabel('推荐选项').getByText('主推', { exact: true }).click();
console.assert(await page.locator('.recommend-tag').count() === 2);
await page.locator('.recommend-tag-remove[data-value=核心主推]').click();
console.assert(await page.locator('.recommend-tag').count() === 1);
await page.keyboard.press('Escape');
console.assert(!(await page.locator('#recommendSelectPanel').isVisible()));
```

Expected: 可展开、选择两项、删除一项并通过 `Escape` 收起。

- [ ] **Step 3: 检查页面布局**

截取“商品标签”区域截图，确认控件宽度与相邻字段一致、下拉层无遮挡、标签换行时布局不溢出。

> 本原型目录没有自动化测试框架，本次不新增测试工程；使用修改前后 Playwright 行为检查完成回归验证。按用户要求直接修改工作区，不创建提交。
