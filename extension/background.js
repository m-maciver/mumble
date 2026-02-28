/**
 * background.js — Ramble service worker
 *
 * Minimal: handles message routing and persistent prompt history.
 * Storage key: "ramble_history" → array of last 5 refined prompts.
 */

const HISTORY_KEY = "ramble_history";
const HISTORY_MAX = 5;

// ─── Message router ────────────────────────────────────────────────────────────
// content.js ↔ popup.js use this for cross-context communication.

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.type) {
    case "SAVE_PROMPT":
      savePromptToHistory(message.payload)
        .then(() => sendResponse({ ok: true }))
        .catch((err) => sendResponse({ ok: false, error: err.message }));
      return true; // Keep channel open for async response

    case "GET_HISTORY":
      getPromptHistory()
        .then((history) => sendResponse({ ok: true, history }))
        .catch((err) => sendResponse({ ok: false, error: err.message, history: [] }));
      return true;

    case "GET_ACTIVE_LLM":
      // Return the LLM the content script detected for the active tab
      getActiveLLM()
        .then((llm) => sendResponse({ ok: true, llm }))
        .catch((err) => sendResponse({ ok: false, llm: "other", error: err.message }));
      return true;

    case "SET_ACTIVE_LLM":
      // content.js sets this when it detects the host
      chrome.storage.local.set({ ramble_active_llm: message.llm }, () => {
        sendResponse({ ok: true });
      });
      return true;

    default:
      // Unknown message — ignore
      return false;
  }
});

// ─── History helpers ───────────────────────────────────────────────────────────

async function getPromptHistory() {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(HISTORY_KEY, (result) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
      } else {
        resolve(result[HISTORY_KEY] || []);
      }
    });
  });
}

async function savePromptToHistory(entry) {
  // entry: { raw, refined, explanation, llm, timestamp }
  const history = await getPromptHistory();

  const newEntry = {
    raw: entry.raw || "",
    refined: entry.refined || "",
    explanation: entry.explanation || "",
    llm: entry.llm || "other",
    timestamp: entry.timestamp || Date.now(),
  };

  // Prepend, keep last HISTORY_MAX
  const updated = [newEntry, ...history].slice(0, HISTORY_MAX);

  return new Promise((resolve, reject) => {
    chrome.storage.local.set({ [HISTORY_KEY]: updated }, () => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
      } else {
        resolve();
      }
    });
  });
}

async function getActiveLLM() {
  return new Promise((resolve) => {
    chrome.storage.local.get("ramble_active_llm", (result) => {
      resolve(result.ramble_active_llm || "other");
    });
  });
}

// ─── Extension installed/updated ───────────────────────────────────────────────

chrome.runtime.onInstalled.addListener((details) => {
  console.log("[Ramble] Service worker installed. Reason:", details.reason);
  // Initialise storage with empty history if fresh install
  if (details.reason === "install") {
    chrome.storage.local.set({ [HISTORY_KEY]: [], ramble_active_llm: "other" });
  }
});

console.log("[Ramble] Service worker registered.");
