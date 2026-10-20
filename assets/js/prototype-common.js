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

  global.PrototypeUI = Object.freeze({
    ensureAccessibilityScaffold,
    showToast,
    setButtonBusy,
    setupDisclosure,
    trapDialogFocus
  });
})(window);
