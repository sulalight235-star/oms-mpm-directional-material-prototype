# Initiated Import Correction Modal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在“我发起的”页面新增导入批改按钮及包含两种模板的批改弹窗。

**Architecture:** 在现有操作栏增加按钮，复用 `.modal-overlay` 和消息提示组件，为导入批改增加独立弹窗、表格样式与事件函数。所有下载、选文件和执行操作均使用原型消息反馈，不引入真实上传下载依赖。

**Tech Stack:** HTML、CSS、原生 JavaScript、Node.js 静态断言、Edge CDP 浏览器验证

---

### Task 1: 建立失败断言

**Files:**
- Test: `MPM-物料-我发起的.html`

- [ ] **Step 1: 验证导入批改弹窗尚不存在**

```powershell
node -e "const fs=require('fs');const h=fs.readFileSync('MPM-物料-我发起的.html','utf8');if(!h.includes('importCorrectionModal'))throw new Error('缺少导入批改弹窗');"
```

Expected: FAIL，错误信息为“缺少导入批改弹窗”。

### Task 2: 新增按钮、样式和弹窗结构

**Files:**
- Modify: `MPM-物料-我发起的.html:87`
- Modify: `MPM-物料-我发起的.html:246`
- Modify: `MPM-物料-我发起的.html:302`

- [ ] **Step 1: 增加导入批改表格样式**

新增 `.correction-modal`、`.correction-table`、`.correction-row`、`.correction-cell` 和 `.correction-link`，使用三列网格展示修改项、模板下载和操作。

- [ ] **Step 2: 在批量导出后增加入口按钮**

```html
<button class="btn btn-default btn-sm" type="button" onclick="openImportCorrection()">导入批改</button>
```

- [ ] **Step 3: 增加双模板弹窗**

弹窗 `id` 为 `importCorrectionModal`，两行分别为“批改物料（撤回/驳回）”和“批改外链（撤回/驳回）”，每行包含下载、选择文件和执行操作。

### Task 3: 实现交互函数

**Files:**
- Modify: `MPM-物料-我发起的.html:506`

- [ ] **Step 1: 增加打开和关闭函数**

```javascript
function openImportCorrection(){
  closeExportMenu();
  document.getElementById('importCorrectionModal').classList.add('open');
}

function closeImportCorrection(){
  document.getElementById('importCorrectionModal').classList.remove('open');
}
```

- [ ] **Step 2: 增加三个操作反馈函数**

`downloadCorrectionTemplate(type)` 展示模板下载成功；`selectCorrectionFile(type)` 展示文件选择成功；`executeCorrection(type)` 展示加入异步任务成功。

- [ ] **Step 3: 增加遮罩和 Escape 关闭**

点击 `importCorrectionModal` 自身遮罩时关闭弹窗，按 Escape 时同时关闭导出菜单与导入批改弹窗。

### Task 4: 完整验证

**Files:**
- Test: `MPM-物料-我发起的.html`

- [ ] **Step 1: 运行静态和语法断言**

确认按钮、两条模板、六个文字操作及所需函数均存在，并使用 `new Function` 编译页面内联脚本。

- [ ] **Step 2: 使用 Edge CDP 验证真实交互**

验证打开、两行文案、下载/选择文件/执行消息、关闭按钮、遮罩关闭和 Escape 关闭均正常。
