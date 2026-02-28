/**
 * content.js — Ramble content script
 *
 * Injected into all pages (filtered by manifest). Does two things:
 *   1. Detects which LLM the user is on and stores it via background.js
 *   2. Injects a floating "✨ Ramble" button (ChatGPT/Claude/Gemini only)
 *      that opens the extension popup when clicked
 */

(function () {
  "use strict";

  // ─── LLM detection ──────────────────────────────────────────────────────────

  const LLM_HOSTS = {
    "chat.openai.com": "chatgpt",
    "claude.ai": "claude",
    "gemini.google.com": "gemini",
  };

  const SUPPORTED_HOSTS = Object.keys(LLM_HOSTS);

  function detectLLM() {
    const hostname = window.location.hostname;
    return LLM_HOSTS[hostname] || "other";
  }

  const currentLLM = detectLLM();
  const isSupported = SUPPORTED_HOSTS.includes(window.location.hostname);

  // Notify background to update storage
  chrome.runtime.sendMessage({
    type: "SET_ACTIVE_LLM",
    llm: currentLLM,
  });

  // ─── Floating button (supported hosts only) ───────────────────────────────

  if (!isSupported) return; // Don't inject on unsupported pages

  const BUTTON_ID = "ramble-float-btn";

  function showTooltip(anchor) {
    const existing = document.getElementById("ramble-tooltip");
    if (existing) existing.remove();

    const tip = document.createElement("div");
    tip.id = "ramble-tooltip";
    tip.textContent = "Click the Ramble icon in your toolbar ↑";
    Object.assign(tip.style, {
      position: "fixed",
      bottom: "72px",
      right: "24px",
      zIndex: "2147483647",
      padding: "8px 12px",
      borderRadius: "10px",
      background: "#1A1A24",
      color: "#F0F0F5",
      fontSize: "12px",
      fontWeight: "500",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      boxShadow: "0 4px 16px rgba(0,0,0,0.4), 0 0 0 1px rgba(124,58,237,0.3)",
      pointerEvents: "none",
      animation: "none",
      opacity: "1",
      transition: "opacity 0.3s ease",
    });
    document.body.appendChild(tip);
    setTimeout(() => {
      tip.style.opacity = "0";
      setTimeout(() => tip.remove(), 300);
    }, 2200);
  }

  function createButton() {
    if (document.getElementById(BUTTON_ID)) return; // Already injected

    const btn = document.createElement("button");
    btn.id = BUTTON_ID;
    btn.innerHTML = "✨ Ramble";
    btn.title = "Open Ramble — turn your thoughts into a polished prompt";
    btn.setAttribute("aria-label", "Open Ramble prompt synthesizer");

    // ── Styles: minimal, non-intrusive, fixed bottom-right ─────────────────
    Object.assign(btn.style, {
      position: "fixed",
      bottom: "24px",
      right: "24px",
      zIndex: "2147483647", // Max z-index — always on top
      padding: "8px 14px",
      borderRadius: "20px",
      border: "none",
      background: "linear-gradient(135deg, #7c3aed, #a855f7)",
      color: "#ffffff",
      fontSize: "13px",
      fontWeight: "600",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      cursor: "pointer",
      boxShadow: "0 2px 12px rgba(124, 58, 237, 0.4)",
      userSelect: "none",
      lineHeight: "1.4",
      letterSpacing: "0.01em",
      transition: "opacity 0.15s ease, transform 0.15s ease",
      opacity: "0.9",
    });

    // Hover effect
    btn.addEventListener("mouseenter", () => {
      btn.style.opacity = "1";
      btn.style.transform = "translateY(-1px)";
    });
    btn.addEventListener("mouseleave", () => {
      btn.style.opacity = "0.9";
      btn.style.transform = "translateY(0)";
    });

    // Click → show tooltip (MV3 service workers can't open popup programmatically)
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      // Store trigger context so popup knows which LLM it was opened for
      chrome.storage.local.set({
        ramble_trigger: { from: "content_button", llm: currentLLM, ts: Date.now() },
      });
      // Show a brief tooltip pointing to the toolbar icon
      showTooltip(btn);
    });

    document.body.appendChild(btn);
    console.log(`[Ramble] Button injected. Detected LLM: ${currentLLM}`);
  }

  // ─── Injection timing ────────────────────────────────────────────────────────
  // Some SPAs (ChatGPT, Claude, Gemini) load body dynamically. Retry until ready.

  function tryInject() {
    if (document.body) {
      createButton();
    } else {
      requestAnimationFrame(tryInject);
    }
  }

  // MutationObserver: re-inject if body is replaced (SPA full navigations)
  function watchForBodyReplace() {
    const observer = new MutationObserver(() => {
      if (!document.getElementById(BUTTON_ID)) {
        createButton();
      }
    });
    observer.observe(document.documentElement, {
      childList: true,
      subtree: false,
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      tryInject();
      watchForBodyReplace();
    });
  } else {
    tryInject();
    watchForBodyReplace();
  }
})();
