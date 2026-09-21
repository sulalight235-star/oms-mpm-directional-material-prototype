# External Link Correction Dropdown Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在批量新增物料列表操作栏新增“外链批改”下拉入口，并提供“下载模版”和“批改外链”两个原型操作。

**Architecture:** 复用页面现有下拉菜单 DOM 与 CSS，仅在操作栏新增一个独立菜单，并扩展现有原生 JavaScript，使“外链批改”和“关联”菜单互斥。菜单项继续调用页面已有 `showMsg`，不引入新依赖或真实网络跳转。

**Tech Stack:** HTML、CSS、原生 JavaScript、Node.js 静态断言、浏览器预览验证

---

### Task 1: 建立失败的结构断言

**Files:**
- Modify: `MPM-物料-批量新增.html:435`
- Test: 通过 Node.js 内联脚本读取 `MPM-物料-批量新增.html`

- [ ] **Step 1: 运行新增入口的失败断言**

```powershell
node -e "const fs=require('fs');const h=fs.readFileSync('MPM-物料-批量新增.html','utf8');if(!h.includes('id=\"externalCorrectionMenu\"'))throw new Error('缺少外链批改菜单');"
```

Expected: FAIL，错误信息为“缺少外链批改菜单”。

### Task 2: 新增外链批改菜单结构

**Files:**
- Modify: `MPM-物料-批量新增.html:435`

- [ ] **Step 1: 在错误批改左侧插入菜单**

```html
<span class="list-op-wrap">
  <span class="list-op dropdown" onclick="toggleExternalCorrectionMenu(event)">外链批改</span>
  <div class="dropdown-menu" id="externalCorrectionMenu">
    <div class="dropdown-item" onclick="onDownloadExternalCorrectionTemplate()">下载模版</div>
    <div class="dropdown-item" onclick="onOpenExternalCorrectionLink()">批改外链</div>
  </div>
</span>
```

- [ ] **Step 2: 保持错误批改及后续按钮顺序不变**

确认新增结构紧邻原“错误批改”按钮之前，不修改其他按钮文案与事件。

### Task 3: 实现菜单交互与互斥逻辑

**Files:**
- Modify: `MPM-物料-批量新增.html:738`

- [ ] **Step 1: 增加通用关闭函数和外链菜单切换函数**

```javascript
function closeDropdownMenus(exceptMenuId) {
  document.querySelectorAll('.dropdown-menu.open').forEach(function (menu) {
    if (menu.id !== exceptMenuId) menu.classList.remove('open');
  });
}

function toggleExternalCorrectionMenu(e) {
  e.stopPropagation();
  const menu = document.getElementById('externalCorrectionMenu');
  const willOpen = !menu.classList.contains('open');
  closeDropdownMenus();
  if (willOpen) menu.classList.add('open');
}
```

- [ ] **Step 2: 调整关联菜单为互斥切换**

```javascript
function toggleAssocMenu(e) {
  e.stopPropagation();
  const menu = document.getElementById('assocMenu');
  const willOpen = !menu.classList.contains('open');
  closeDropdownMenus();
  if (willOpen) menu.classList.add('open');
}
```

- [ ] **Step 3: 点击页面空白处关闭所有菜单**

```javascript
document.addEventListener('click', function () {
  closeDropdownMenus();
});
```

- [ ] **Step 4: 增加两个菜单项反馈函数**

```javascript
function onDownloadExternalCorrectionTemplate() {
  closeDropdownMenus();
  showMsg('已下载: 外链批改模版.xlsx', 'success');
}

function onOpenExternalCorrectionLink() {
  closeDropdownMenus();
  showMsg('批改外链', 'info');
}
```

### Task 4: 验证结构与交互

**Files:**
- Test: `MPM-物料-批量新增.html`

- [ ] **Step 1: 运行静态断言**

```powershell
node -e "const fs=require('fs');const h=fs.readFileSync('MPM-物料-批量新增.html','utf8');for(const s of ['外链批改','id=\"externalCorrectionMenu\"','下载模版','批改外链','toggleExternalCorrectionMenu','closeDropdownMenus'])if(!h.includes(s))throw new Error('缺少: '+s);console.log('STATIC_ASSERTIONS_OK');"
```

Expected: 输出 `STATIC_ASSERTIONS_OK`。

- [ ] **Step 2: 浏览器验证交互**

打开 `MPM-物料-批量新增.html`，依次确认：外链批改位于错误批改左侧；点击展示两个菜单项；打开关联时外链菜单关闭；点击空白处收起菜单；点击两个菜单项均出现消息反馈。
