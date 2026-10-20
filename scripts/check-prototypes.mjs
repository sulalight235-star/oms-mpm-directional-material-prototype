#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const strict = process.argv.includes("--strict");
const jsonOutput = process.argv.includes("--json");
const blockers = [];
const warnings = [];
const metrics = new Map();
const allowedSystems = new Set(["MPM", "SCP", "OMS", "WMS", "IQS", "MALL", "CRM"]);
const formalName = /^(MPM|SCP|OMS|WMS|IQS|MALL|CRM)-[^\s-]+-[^\s-]+(?:-[^\s-]+)*\.html$/;
const ignoredDirectories = new Set([".git", "node_modules", "_edge_cdp_profile", "dist", "public"]);
const requiredFiles = [
  "AGENTS.md",
  "prototype-manifest.json",
  "pages/routes.tsv",
  "assets/css/prototype-tokens.css",
  "assets/css/prototype-components.css",
  "assets/js/prototype-common.js",
  "assets/icons/prototype-icons.svg"
];

function validateNavigationPolicy(manifest) {
  if (Number(manifest.version) < 2) {
    block("NAV_POLICY", "prototype-manifest.json", "统一导航规则要求 manifest version >= 2");
  }
  const policy = manifest.navigationPolicy;
  if (!policy || policy.topbarRequired !== true) {
    block("NAV_POLICY", "prototype-manifest.json", "缺少强制统一顶部状态栏策略");
    return;
  }
  if (policy.topbarClass !== "proto-topbar" || policy.topbarBackgroundFallback !== "#001529") {
    block("NAV_POLICY", "prototype-manifest.json", "顶部状态栏必须使用 proto-topbar 和 #001529 背景基线");
  }
  if (policy.workbenchLinkRequiredOnSubpages !== true || policy.workbenchLinkLabel !== "工作台" || policy.workbenchLinkClass !== "proto-workbench-link") {
    block("NAV_POLICY", "prototype-manifest.json", "缺少子页面左上角“工作台”返回入口策略");
  }
}

function add(collection, code, target, message) {
  collection.push({ code, target, message });
}

function block(code, target, message) {
  add(blockers, code, target, message);
}

function warn(code, target, message) {
  add(warnings, code, target, message);
  metrics.set(code, (metrics.get(code) || 0) + 1);
}

function posix(value) {
  return value.split(path.sep).join("/");
}

function walkHtml(directory, prefix = "") {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    if (entry.isDirectory() && ignoredDirectories.has(entry.name)) return [];
    const relative = posix(path.join(prefix, entry.name));
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) return walkHtml(absolute, relative);
    return entry.isFile() && entry.name.endsWith(".html") ? [relative] : [];
  });
}

function readJson(relative) {
  try {
    return JSON.parse(fs.readFileSync(path.join(root, relative), "utf8"));
  } catch (error) {
    block("MANIFEST_PARSE", relative, `JSON 无法解析：${error.message}`);
    return { pages: [] };
  }
}

function readRoutes() {
  const routeFile = path.join(root, "pages/routes.tsv");
  if (!fs.existsSync(routeFile)) return [];
  return fs.readFileSync(routeFile, "utf8").split(/\r?\n/).flatMap((line, index) => {
    if (!line.trim() || line.trimStart().startsWith("#")) return [];
    const columns = line.split("\t");
    if (columns.length !== 2 || !columns[0].trim() || !columns[1].trim()) {
      block("ROUTE_FORMAT", "pages/routes.tsv", `第 ${index + 1} 行必须是“稳定路径<TAB>实际文件”`);
      return [];
    }
    return [{ route: columns[0].trim(), file: columns[1].trim(), line: index + 1 }];
  });
}

function duplicates(values) {
  const seen = new Set();
  const result = new Set();
  for (const value of values) seen.has(value) ? result.add(value) : seen.add(value);
  return [...result];
}

function has(source, expression) {
  return expression.test(source);
}

function staticLinks(source) {
  return [...source.matchAll(/(?:href|src)\s*=\s*["']([^"']+)["']/gi)].map(match => match[1].trim());
}

function validateLocalLinks(file, source) {
  const directory = path.dirname(path.join(root, file));
  for (const raw of staticLinks(source)) {
    if (!raw || raw.includes("${") || raw.startsWith("#") || /^(?:https?:|mailto:|tel:|data:|javascript:|blob:|about:|\/\/)/i.test(raw)) continue;
    const withoutSuffix = raw.split(/[?#]/)[0];
    if (!withoutSuffix) continue;
    let decoded = withoutSuffix;
    try { decoded = decodeURIComponent(withoutSuffix); } catch { /* 使用原始路径 */ }
    const resolved = decoded.startsWith("/") ? path.resolve(root, `.${decoded}`) : path.resolve(directory, decoded);
    if (!resolved.startsWith(`${root}${path.sep}`) && resolved !== root) {
      block("LINK_ESCAPE", file, `本地链接越出仓库：${raw}`);
    } else if (!fs.existsSync(resolved)) {
      block("BROKEN_LINK", file, `本地链接不存在：${raw}`);
    }
  }
}

function validateInlineScripts(file, source) {
  [...source.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)].forEach((match, index) => {
    if (!match[1].trim()) return;
    try {
      new vm.Script(match[1], { filename: `${file}#inline-${index + 1}` });
    } catch (error) {
      block("JS_SYNTAX", file, `第 ${index + 1} 个内联脚本语法错误：${error.message}`);
    }
  });
}

function hasRootMinWidth(source) {
  const styleBlocks = [...source.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)].map(match => match[1]);
  const rootSelector = /(?:^|,)\s*(?:html|body|main|\.page|\.workspace|\.app|\.layout|\.shell|\.auto-audit-page|\.account-page|\.account-create-page|\.project-material-page|\.project-management-page|\.role-field-page)(?:\s|,|\{|:|$)/;
  for (const css of styleBlocks) {
    for (const rule of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
      if (!rootSelector.test(rule[1])) continue;
      if ([...rule[2].matchAll(/min-width\s*:\s*(\d+)px/gi)].some(match => Number(match[1]) > 375)) return true;
    }
  }
  return false;
}

function validateForms(file, source) {
  const labels = new Set([...source.matchAll(/<label\b[^>]*\bfor=["']([^"']+)["']/gi)].map(match => match[1]));
  const wrappedLabelRanges = [...source.matchAll(/<label\b[^>]*>[\s\S]*?<\/label>/gi)]
    .map(match => [match.index, match.index + match[0].length]);
  let missing = 0;
  for (const match of source.matchAll(/<(input|select|textarea)\b([^>]*)>/gi)) {
    const attrs = match[2];
    if (/\btype=["'](?:hidden|button|submit|reset|image)["']/i.test(attrs)) continue;
    const id = attrs.match(/\bid=["']([^"']+)["']/i)?.[1];
    const named = /\baria-label(?:ledby)?=["'][^"']+["']/i.test(attrs) || /\btitle=["'][^"']+["']/i.test(attrs);
    const associated = id && labels.has(id);
    const wrapped = wrappedLabelRanges.some(([start, end]) => match.index > start && match.index < end);
    if (!named && !associated && !wrapped) missing += 1;
  }
  if (missing) warn("FORM_NAME", file, `${missing} 个表单控件疑似缺少关联 label 或可访问名称（需人工确认）`);
}

function validateImages(file, source) {
  const missing = [...source.matchAll(/<img\b([^>]*)>/gi)].filter(match => !/\balt=["'][^"']*["']/i.test(match[1])).length;
  if (missing) warn("IMAGE_ALT", file, `${missing} 张图片缺少 alt`);
}

function validateSvgUses(file, source) {
  const directory = path.dirname(path.join(root, file));
  for (const match of source.matchAll(/<use\b[^>]*\bhref=["']([^"']+)#([^"']+)["'][^>]*>/gi)) {
    const resource = match[1];
    const symbol = match[2];
    if (!resource) {
      if (!new RegExp(`\\bid=["']${symbol.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}["']`).test(source)) {
        block("SVG_SYMBOL", file, `页面内 SVG symbol 不存在：#${symbol}`);
      }
      continue;
    }
    if (/^(?:https?:|data:|\/\/)/i.test(resource)) continue;
    const resolved = path.resolve(directory, resource);
    if (!resolved.startsWith(`${root}${path.sep}`) || !fs.existsSync(resolved)) continue;
    const sprite = fs.readFileSync(resolved, "utf8");
    const escaped = symbol.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    if (!new RegExp(`\\bid=["']${escaped}["']`).test(sprite)) {
      block("SVG_SYMBOL", file, `SVG symbol 不存在：${resource}#${symbol}`);
    }
  }
}

function validateIconButtons(file, source) {
  let missing = 0;
  for (const match of source.matchAll(/<button\b([^>]*)>([\s\S]*?)<\/button>/gi)) {
    const attrs = match[1];
    const visibleText = match[2].replace(/<svg[\s\S]*?<\/svg>/gi, "").replace(/<[^>]+>/g, "").trim();
    if (!visibleText && !/\baria-label(?:ledby)?=["'][^"']+["']/i.test(attrs) && !/\btitle=["'][^"']+["']/i.test(attrs)) missing += 1;
  }
  if (missing) warn("ICON_BUTTON_NAME", file, `${missing} 个纯图标按钮缺少可访问名称`);
}

function validatePage(entry) {
  const file = entry.file;
  const absolute = path.join(root, file);
  if (!fs.existsSync(absolute)) return;
  const source = fs.readFileSync(absolute, "utf8");
  const staticMarkup = source.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "");
  const isEntry = entry.kind === "entry";
  const isReference = entry.kind === "reference";

  if (!isEntry && !isReference && !formalName.test(path.basename(file))) warn("FILE_NAME", file, "文件名不符合“系统-一级模块-界面”");
  if (isReference && !entry.stableRoute?.startsWith("reference/")) block("REFERENCE_ROUTE", file, "reference 页的稳定路由必须位于 reference/ 下");
  if (!/^\s*<!doctype html>/i.test(source)) warn("DOCTYPE", file, "缺少 <!doctype html>");
  if (!has(source, /<html\b[^>]*\blang=["']zh-CN["']/i)) warn("LANG", file, "缺少 lang=\"zh-CN\"");
  if (!has(source, /<meta\b[^>]*charset=["']?UTF-8/i)) warn("CHARSET", file, "缺少 UTF-8 charset");
  if (!has(source, /<meta\b[^>]*name=["']viewport["'][^>]*width=device-width/i)) warn("VIEWPORT", file, "缺少标准 viewport");
  if (!isEntry && !isReference && !has(source, /<title>[^<]+\s[-–]\s[^<]+<\/title>/i)) warn("TITLE", file, "title 应为“界面名称 - 系统名称”");

  if (!isReference) {
    if (!source.includes("prototype-tokens.css")) warn("TOKENS", file, "未引用 prototype-tokens.css");
    if (!source.includes("prototype-components.css")) warn("COMPONENTS", file, "未引用 prototype-components.css");
    if (!source.includes("prototype-common.js")) warn("COMMON_JS", file, "未引用 prototype-common.js");
    if (!has(source, /class=["'][^"']*(?:prototype-skip-link|skip-link)/i)) warn("SKIP_LINK", file, "缺少跳到主内容链接");
    if (!has(source, /<main\b|\brole=["']main["']/i)) warn("MAIN", file, "缺少 main 主区域");
    if (!has(source, /\baria-live=["'](?:polite|assertive)["']|\brole=["'](?:status|alert)["']/i)) warn("LIVE_REGION", file, "缺少可检测的动态消息区域");
    if (!source.includes("prefers-reduced-motion") && !source.includes("prototype-components.css")) warn("REDUCED_MOTION", file, "未提供减少动效支持");
    if (hasRootMinWidth(source) && !source.includes("prototype-components.css")) {
      warn("ROOT_MIN_WIDTH", file, "页面根容器存在大于 375px 的固定 min-width，且未接入公共移动端覆盖");
    }

    const structuralText = [...source.matchAll(/<(?:header|nav|button|a)\b[^>]*>([\s\S]*?)<\/(?:header|nav|button|a)>/gi)]
      .map(match => match[1].replace(/<[^>]+>/g, ""));
    if (structuralText.some(text => /\p{Extended_Pictographic}/u.test(text))) warn("STRUCTURAL_EMOJI", file, "结构性控件中存在 Emoji");
  }

  const ids = [...staticMarkup.matchAll(/\bid=["']([^"']+)["']/gi)].map(match => match[1]);
  const duplicateIds = duplicates(ids);
  if (duplicateIds.length) block("DUPLICATE_ID", file, `存在重复 ID：${duplicateIds.join("、")}`);

  if (!isReference) {
    validateImages(file, source);
    validateForms(file, staticMarkup);
    validateIconButtons(file, source);
    validateSvgUses(file, staticMarkup);
  }
  validateInlineScripts(file, source);
  validateLocalLinks(file, source);
}

for (const relative of requiredFiles) {
  if (!fs.existsSync(path.join(root, relative))) block("REQUIRED_FILE", "repository", `缺少治理文件 ${relative}`);
}

const manifest = readJson("prototype-manifest.json");
validateNavigationPolicy(manifest);
const entries = Array.isArray(manifest.pages) ? manifest.pages : [];
if (!Array.isArray(manifest.pages)) block("MANIFEST_SHAPE", "prototype-manifest.json", "pages 必须是数组");

const manifestFiles = entries.map(entry => entry?.file).filter(Boolean);
for (const duplicate of duplicates(manifestFiles)) block("MANIFEST_DUPLICATE_FILE", "prototype-manifest.json", `重复登记文件 ${duplicate}`);

const routes = readRoutes();
for (const duplicate of duplicates(routes.map(item => item.route))) block("ROUTE_DUPLICATE_PATH", "pages/routes.tsv", `重复稳定路径 ${duplicate}`);
for (const duplicate of duplicates(routes.map(item => item.file))) block("ROUTE_DUPLICATE_TARGET", "pages/routes.tsv", `重复目标文件 ${duplicate}`);

const routeByFile = new Map(routes.map(item => [item.file, item.route]));
const manifestByFile = new Map(entries.map(entry => [entry?.file, entry]));

for (const entry of entries) {
  if (!entry || typeof entry.file !== "string") {
    block("MANIFEST_ENTRY", "prototype-manifest.json", "存在缺少 file 的条目");
    continue;
  }
  for (const field of ["kind", "system", "module", "page", "stableRoute", "demoGuideRequired"]) {
    if (!(field in entry)) block("MANIFEST_FIELD", entry.file, `manifest 缺少字段 ${field}`);
  }
  if (!["formal", "entry", "reference"].includes(entry.kind)) block("MANIFEST_KIND", entry.file, `未知页面类型 ${entry.kind}`);
  if (entry.kind !== "entry" && !allowedSystems.has(entry.system)) block("MANIFEST_SYSTEM", entry.file, `非法系统前缀 ${entry.system}`);
  if (!fs.existsSync(path.join(root, entry.file))) block("MANIFEST_MISSING_FILE", entry.file, "manifest 登记文件不存在");
  if (entry.kind === "entry") {
    if (entry.stableRoute !== null) warn("ENTRY_ROUTE", entry.file, "总门户通常不配置额外稳定路由");
  } else {
    if (!entry.stableRoute) block("MANIFEST_ROUTE", entry.file, "非入口页缺少 stableRoute");
    if (!routeByFile.has(entry.file)) block("ROUTE_MISSING", entry.file, "pages/routes.tsv 未配置该页");
    if (routeByFile.get(entry.file) !== entry.stableRoute) block("ROUTE_MISMATCH", entry.file, `manifest 与 routes.tsv 不一致：${entry.stableRoute} / ${routeByFile.get(entry.file) || "(空)"}`);
  }
}

for (const route of routes) {
  if (!fs.existsSync(path.join(root, route.file))) block("ROUTE_TARGET", route.file, `第 ${route.line} 行目标文件不存在`);
  if (!manifestByFile.has(route.file)) block("ROUTE_UNREGISTERED", route.file, "路由目标未登记 manifest");
}

const htmlFiles = walkHtml(root).sort();
for (const file of htmlFiles) if (!manifestByFile.has(file)) block("HTML_UNREGISTERED", file, "HTML 未登记 manifest");
for (const file of manifestFiles) if (!htmlFiles.includes(file)) block("MANIFEST_NOT_HTML", file, "manifest 文件不在当前 HTML 集合中");

entries.forEach(validatePage);

const result = {
  mode: strict ? "strict" : "standard",
  pages: entries.length,
  htmlFiles: htmlFiles.length,
  routes: routes.length,
  blockers: blockers.length,
  warnings: warnings.length,
  warningMetrics: Object.fromEntries([...metrics.entries()].sort(([a], [b]) => a.localeCompare(b))),
  blockerItems: blockers,
  warningItems: warnings
};

if (jsonOutput) {
  console.log(JSON.stringify(result, null, 2));
} else {
  console.log("原型规范检查");
  console.log(`模式：${strict ? "严格验收" : "日常检查"}`);
  console.log(`页面：manifest ${entries.length} / HTML ${htmlFiles.length} / 稳定路由 ${routes.length}`);
  console.log(`结果：阻断 ${blockers.length} / 迁移提示 ${warnings.length}`);
  if (Object.keys(result.warningMetrics).length) {
    console.log("\n迁移指标：");
    for (const [code, count] of Object.entries(result.warningMetrics)) console.log(`- ${code}: ${count}`);
  }
  if (blockers.length) {
    console.error("\n阻断项：");
    blockers.forEach(item => console.error(`- [${item.code}] ${item.target}: ${item.message}`));
  }
  if (warnings.length) {
    console.log("\n迁移提示：");
    warnings.forEach(item => console.log(`- [${item.code}] ${item.target}: ${item.message}`));
  }
  if (!blockers.length && (!strict || !warnings.length)) console.log("\n检查通过。");
}

if (blockers.length) process.exitCode = 1;
else if (strict && warnings.length) process.exitCode = 2;
