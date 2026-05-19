# 物料列表页 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为当前静态原型补充可从首页与工作台进入的物料列表页，并支持从列表进入现有详情页。

**Architecture:** 保持现有原型的静态 HTML + 内联 CSS/JS 结构，在新增 `物料列表.html` 时复用现有顶部导航、页签、消息提示和按钮语言。入口页与工作台页只做最小改动，列表页集中承载截图参考中的筛选、类目树、工具栏、表格与分页交互。

**Tech Stack:** 纯静态 HTML、CSS、原生 JavaScript

---

### Task 1: 接通入口路由

**Files:**
- Modify: `index.html`
- Modify: `oms-mpm-物料工作台原型.html:895-918`

- [ ] **Step 1: 为首页入口写一个可验证的失败检查**

检查 `index.html` 中当前是否存在“物料列表”入口。

Run: `python - <<'PY'
from pathlib import Path
p = Path(r'D:/xhgj002358/VSCODE/SCMAI 日志/MPM-4.6.1--OMS-MPM定向物料生成文档/index.html')
text = p.read_text(encoding='utf-8')
assert '物料列表' in text, 'FAIL: index.html 尚未提供物料列表入口'
PY`

Expected: FAIL with `index.html 尚未提供物料列表入口`

- [ ] **Step 2: 修改首页并补全工作台路由**

在 `index.html` 增加一个指向 `物料列表.html` 的入口；在 `oms-mpm-物料工作台原型.html` 的 `featureRoutes` 中加入 `物料列表` 路由。

目标代码片段：

```html
<a class="link-item" href="物料列表.html">
  <div class="icon icon-blue">📦</div>
  <div>
    <div class="link-text">物料列表</div>
    <div class="link-desc">商城物料主数据列表浏览与筛选</div>
  </div>
</a>
```

```js
const featureRoutes = {
  '物料列表': '物料列表.html',
  '待我审核': '待我审核.html',
  '审核结果': '审核结果.html',
  '我发起的': '我发起的.html'
};
```

- [ ] **Step 3: 运行检查确认入口已接通**

Run: `python - <<'PY'
from pathlib import Path
root = Path(r'D:/xhgj002358/VSCODE/SCMAI 日志/MPM-4.6.1--OMS-MPM定向物料生成文档')
index_text = (root / 'index.html').read_text(encoding='utf-8')
workbench_text = (root / 'oms-mpm-物料工作台原型.html').read_text(encoding='utf-8')
assert 'href="物料列表.html"' in index_text
assert "'物料列表': '物料列表.html'" in workbench_text
print('PASS')
PY`

Expected: PASS

### Task 2: 新建物料列表页骨架

**Files:**
- Create: `物料列表.html`
- Reference: `oms-mpm-物料工作台原型.html`
- Reference: `物料审核详情.html`

- [ ] **Step 1: 为新页面写一个失败检查**

Run: `python - <<'PY'
from pathlib import Path
p = Path(r'D:/xhgj002358/VSCODE/SCMAI 日志/MPM-4.6.1--OMS-MPM定向物料生成文档/物料列表.html')
assert p.exists(), 'FAIL: 物料列表.html 尚未创建'
PY`

Expected: FAIL with `物料列表.html 尚未创建`

- [ ] **Step 2: 创建页面骨架并铺设结构**

页面至少包含以下结构：

```html
<header class="topbar">...</header>
<div class="tabs-bar">...</div>
<main class="page">
  <section class="filter-card">...</section>
  <section class="list-layout">
    <aside class="category-panel">...</aside>
    <div class="table-panel">...</div>
  </section>
</main>
<div class="message-wrap" id="messageWrap"></div>
```

- [ ] **Step 3: 运行检查确认页面骨架齐全**

Run: `python - <<'PY'
from pathlib import Path
text = Path(r'D:/xhgj002358/VSCODE/SCMAI 日志/MPM-4.6.1--OMS-MPM定向物料生成文档/物料列表.html').read_text(encoding='utf-8')
for marker in ['class="topbar"', 'class="tabs-bar"', 'class="filter-card"', 'class="category-panel"', 'class="table-panel"', 'id="messageWrap"']:
    assert marker in text, marker
print('PASS')
PY`

Expected: PASS

### Task 3: 实现关键交互

**Files:**
- Modify: `物料列表.html`

- [ ] **Step 1: 为关键交互写失败检查**

Run: `python - <<'PY'
from pathlib import Path
text = Path(r'D:/xhgj002358/VSCODE/SCMAI 日志/MPM-4.6.1--OMS-MPM定向物料生成文档/物料列表.html').read_text(encoding='utf-8')
checks = [
    'id="searchBtn"',
    'id="resetBtn"',
    'id="exportDropdown"',
    'data-page=',
    'href="物料审核详情.html"'
]
missing = [c for c in checks if c not in text]
assert not missing, f'FAIL: missing {missing}'
PY`

Expected: FAIL with missing markers

- [ ] **Step 2: 写入最小可用交互脚本**

交互需覆盖：查询、重置、类目树展开/选中、导出下拉展开、分页切换、消息提示。

目标代码片段：

```js
const state = {
  keyword: '',
  currentCategory: '全部',
  currentPage: 1,
  exportOpen: false
};
```

```js
document.getElementById('searchBtn').addEventListener('click', () => {
  state.keyword = document.getElementById('materialName').value.trim();
  renderSummary();
  showMessage(`已按“${state.keyword || '全部条件'}”执行查询`, 'success');
});
```

```js
document.getElementById('resetBtn').addEventListener('click', () => {
  document.getElementById('filterForm').reset();
  state.keyword = '';
  state.currentCategory = '全部';
  state.currentPage = 1;
  renderSummary();
  showMessage('已重置筛选条件');
});
```

- [ ] **Step 3: 运行检查确认关键交互标记已存在**

Run: `python - <<'PY'
from pathlib import Path
text = Path(r'D:/xhgj002358/VSCODE/SCMAI 日志/MPM-4.6.1--OMS-MPM定向物料生成文档/物料列表.html').read_text(encoding='utf-8')
for marker in ['id="searchBtn"', 'id="resetBtn"', 'id="exportDropdown"', 'data-page=', 'href="物料审核详情.html"', 'const state = {']:
    assert marker in text, marker
print('PASS')
PY`

Expected: PASS

### Task 4: 自检页面可预览性

**Files:**
- Verify: `index.html`
- Verify: `oms-mpm-物料工作台原型.html`
- Verify: `物料列表.html`

- [ ] **Step 1: 启动本地静态服务**

Run: `python -m http.server 8000 --directory "D:/xhgj002358/VSCODE/SCMAI 日志/MPM-4.6.1--OMS-MPM定向物料生成文档"`

Expected: 服务启动成功

- [ ] **Step 2: 手动验证三段主链路**

依次验证：

```text
1. 打开 /index.html，点击“物料列表”进入新页
2. 打开 /oms-mpm-物料工作台原型.html，点击“进入”进入新页
3. 在 /物料列表.html 点击编码或名称进入 /物料审核详情.html
```

Expected: 三段跳转均成立

- [ ] **Step 3: 关闭服务并记录结果**

Run: `Ctrl+C`

Expected: 服务正常退出
