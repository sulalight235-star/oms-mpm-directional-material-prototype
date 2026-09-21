# “核心主推（自研）”有效期限 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为“推荐”字段新增“核心主推（自研）”枚举，并在选择该项时要求维护精确到年月日的起止有效期限。

**Architecture:** 继续沿用单文件 HTML 原型结构，在推荐控件下方增加条件显示的日期区域。推荐项渲染函数统一同步日期区域的显示、必填和校验状态，取消选择时只隐藏区域而不修改日期值。

**Tech Stack:** HTML5、CSS3、原生 JavaScript、Edge DevTools Protocol 浏览器验证。

---

### Task 1: 建立功能缺失基线

**Files:**
- Inspect: `版本管理/MPM-4.6.1--OMS-MPM定向物料生成文档/MPM-物料-待我审核-新增物料审核详情.html`

- [ ] 检查当前推荐选项数量为四个，且不存在 `selfDevelopedValidity` 日期区域。
- [ ] 运行断言并确认因新枚举及日期区域缺失而失败。

### Task 2: 添加枚举和日期区域

**Files:**
- Modify: `版本管理/MPM-4.6.1--OMS-MPM定向物料生成文档/MPM-物料-待我审核-新增物料审核详情.html:130`
- Modify: `版本管理/MPM-4.6.1--OMS-MPM定向物料生成文档/MPM-物料-待我审核-新增物料审核详情.html:1176`

- [ ] 添加日期区域、日期输入、错误提示和响应式布局样式。
- [ ] 在推荐选项中增加“核心主推（自研）”。
- [ ] 在推荐字段行下方增加默认隐藏的“有效期限（自研）”开始日期和结束日期输入。

### Task 3: 同步显示与校验状态

**Files:**
- Modify: `版本管理/MPM-4.6.1--OMS-MPM定向物料生成文档/MPM-物料-待我审核-新增物料审核详情.html:2743`

- [ ] 增加 `validateSelfDevelopedValidity()`，校验日期完整性和起止顺序。
- [ ] 增加 `syncSelfDevelopedValidity()`，根据目标标签的选择状态切换日期区域与必填属性。
- [ ] 在推荐标签渲染和日期变化时同步状态；隐藏时保留日期值。

### Task 4: 浏览器回归验证

**Files:**
- Verify: `版本管理/MPM-4.6.1--OMS-MPM定向物料生成文档/MPM-物料-待我审核-新增物料审核详情.html`

- [ ] 验证推荐项数量为五个，目标标签可正常选择和删除。
- [ ] 验证选中后日期区域显示，缺少日期时提示错误。
- [ ] 验证结束日期早于开始日期时提示错误，合法日期时错误消失。
- [ ] 验证取消后日期区域隐藏但值保留，再次选择后恢复显示原值。
- [ ] 验证其他多选、外部点击和 `Escape` 收起功能不受影响。

> 当前原型目录无自动化测试框架，本次采用修改前失败断言与修改后真实浏览器行为检查完成红绿验证，不创建提交。
