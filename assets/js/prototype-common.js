(function initPrototypeCommon(global) {
  "use strict";

  const documentRef = global.document;

  function ensureAccessibilityScaffold() {
    const main = documentRef.querySelector("main, [role='main']");
    if (main && !main.id) main.id = "mainContent";

    if (main && !documentRef.querySelector(".prototype-skip-link, .skip-link")) {
      const skipLink = documentRef.createElement("a");
      skipLink.className = "prototype-skip-link";
      skipLink.href = `#${main.id}`;
      skipLink.textContent = "跳到主内容";
      documentRef.body.insertBefore(skipLink, documentRef.body.firstChild);
    }

    if (!documentRef.querySelector("[data-proto-toast-region]")) {
      const region = documentRef.createElement("div");
      region.className = "proto-toast-region";
      region.dataset.protoToastRegion = "";
      region.setAttribute("aria-live", "polite");
      region.setAttribute("aria-atomic", "true");
      documentRef.body.appendChild(region);
    }

    documentRef.querySelectorAll('[role="button"][onclick]').forEach(control => {
      if (/^(?:BUTTON|A)$/.test(control.tagName) || control.dataset.protoKeyboardReady === "true") return;
      control.dataset.protoKeyboardReady = "true";
      if (!control.hasAttribute("tabindex")) control.tabIndex = 0;
      control.addEventListener("keydown", event => {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        control.click();
      });
    });
  }

  function getToastRegion() {
    ensureAccessibilityScaffold();
    return documentRef.querySelector("[data-proto-toast-region]");
  }

  function showToast(message, options) {
    const config = Object.assign({ duration: 3200, type: "info" }, options);
    const toast = documentRef.createElement("div");
    toast.className = `proto-toast proto-toast--${config.type}`;
    toast.setAttribute("role", config.type === "error" ? "alert" : "status");
    toast.textContent = String(message);
    getToastRegion().appendChild(toast);
    global.setTimeout(() => toast.remove(), config.duration);
    return toast;
  }

  function setButtonBusy(button, busy, busyText) {
    if (!button) return;
    if (busy) {
      button.dataset.protoOriginalText = button.textContent;
      button.textContent = busyText || "处理中…";
      button.disabled = true;
      button.setAttribute("aria-busy", "true");
      return;
    }
    button.textContent = button.dataset.protoOriginalText || button.textContent;
    button.disabled = false;
    button.removeAttribute("aria-busy");
  }

  function setupDisclosure(trigger, panel) {
    if (!trigger || !panel) return;
    const sync = expanded => {
      trigger.setAttribute("aria-expanded", String(expanded));
      panel.hidden = !expanded;
    };
    sync(trigger.getAttribute("aria-expanded") === "true");
    trigger.addEventListener("click", () => sync(trigger.getAttribute("aria-expanded") !== "true"));
  }

  function trapDialogFocus(dialog, opener) {
    if (!dialog) return function noop() {};
    const selector = "a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex='-1'])";
    const previous = opener || documentRef.activeElement;
    const focusable = Array.from(dialog.querySelectorAll(selector));
    (focusable[0] || dialog).focus();
    const onKeydown = event => {
      if (event.key === "Escape") dialog.dispatchEvent(new CustomEvent("proto:request-close"));
      if (event.key !== "Tab" || !focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && documentRef.activeElement === first) { event.preventDefault(); last.focus(); }
      if (!event.shiftKey && documentRef.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    dialog.addEventListener("keydown", onKeydown);
    return () => {
      dialog.removeEventListener("keydown", onKeydown);
      if (previous && typeof previous.focus === "function") previous.focus();
    };
  }

  if (documentRef.readyState === "loading") {
    documentRef.addEventListener("DOMContentLoaded", ensureAccessibilityScaffold, { once: true });
  } else {
    ensureAccessibilityScaffold();
  }

  const prototypeRoot = new URL("../../", documentRef.currentScript.src);
  function chooseMaterialCreateVersion(opener) {
    let dialog = documentRef.getElementById("materialCreateVersionDialog");
    if (!dialog) {
      dialog = documentRef.createElement("dialog");
      dialog.id = "materialCreateVersionDialog";
      dialog.className = "proto-modal material-version-dialog";
      dialog.setAttribute("aria-labelledby", "materialVersionTitle");
      dialog.innerHTML = `<h2 id="materialVersionTitle">选择新增物料版本</h2><p>请选择本次进入的新增物料界面。</p><div class="material-version-options"><a data-material-version-direct class="material-version-option" href="${new URL('MPM-物料-物料列表-新增物料.html', prototypeRoot)}"><strong>新版-新增物料</strong><span>现有原型，支持智能新增及传统字段维护</span></a><a data-material-version-direct class="material-version-option" href="${new URL('MPM-物料-物料列表-旧版新增物料.html', prototypeRoot)}"><strong>旧版-新增物料</strong><span>按现有 MPM 新增物料界面复刻</span></a></div><div class="material-version-footer"><button class="proto-btn" type="button" data-version-cancel>取消</button></div>`;
      documentRef.body.appendChild(dialog);
      dialog.querySelector('[data-version-cancel]').addEventListener('click', () => dialog.close());
      dialog.addEventListener('click', event => { if (event.target === dialog) { const b = dialog.getBoundingClientRect(); if (event.clientX < b.left || event.clientX > b.right || event.clientY < b.top || event.clientY > b.bottom) dialog.close(); } });
    }
    if (dialog.open) return;
    dialog.showModal();
    const release = trapDialogFocus(dialog, opener);
    dialog.addEventListener('proto:request-close', () => dialog.close(), { once: true });
    dialog.addEventListener('close', release, { once: true });
  }
  documentRef.addEventListener('click', event => {
    const link = event.target.closest('a[href]');
    if (!link || link.hasAttribute('data-material-version-direct')) return;
    let filename;
    try { filename = decodeURIComponent(new URL(link.href).pathname).split('/').pop(); } catch { return; }
    if (!['MPM-物料-物料列表-新增物料.html', 'MPM-物料-新增物料-入口跳转.html'].includes(filename)) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    chooseMaterialCreateVersion(link);
  }, true);
  documentRef.querySelectorAll('[data-create-version-trigger]').forEach(button => button.addEventListener('click', () => chooseMaterialCreateVersion(button)));
  if (documentRef.body.hasAttribute('data-create-version-entry')) {
    chooseMaterialCreateVersion(documentRef.querySelector('[data-create-version-trigger]'));
  }

  global.PrototypeUI = Object.freeze({
    ensureAccessibilityScaffold,
    chooseMaterialCreateVersion,
    showToast,
    setButtonBusy,
    setupDisclosure,
    trapDialogFocus
  });
})(window);
