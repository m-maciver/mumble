# Ramble

![banner](banner.png)

> Turn voice rambles and rough thoughts into polished AI prompts — instantly.

[![Live PWA](https://img.shields.io/badge/PWA-getramble.xyz-blue)](https://getramble.xyz)
[![Chrome Web Store](https://img.shields.io/badge/Chrome%20Extension-In%20Review-yellow)](https://getramble.xyz)

Most AI prompts are garbage on the first try. Ramble fixes that at the input layer — before the model ever sees your words.

---

## What It Does

Ramble captures your voice or rough text and rewrites it into a clean, structured prompt optimised for the model you're actually using. It detects whether you're on Claude, ChatGPT, or Gemini and adapts accordingly. A floating button appears on any LLM site — no copy-paste, no tab-switching.

---

## Features

- 🎙️ **Voice-to-prompt** — speak naturally, get a polished result
- 🧠 **Model-aware** — auto-detects Claude, ChatGPT, or Gemini and tunes output
- 🔘 **Floating inject button** — appears on LLM sites, injects directly into the input field
- ✍️ **Text mode** — paste rough notes, get a refined prompt
- ⚡ **No bundler** — vanilla JS, Manifest V3, ships lean

---

## Tech

| Layer | Stack |
|---|---|
| Extension | Chrome Manifest V3, vanilla JS |
| PWA | Vanilla JS, Web Speech API |
| AI | Anthropic claude-haiku |
| Build | None — zero bundler |

---

## Status

- ✅ Live PWA at [getramble.xyz](https://getramble.xyz)
- 🔄 Chrome extension — in review on the Chrome Web Store

---

## Author

[maciver](https://github.com/m-maciver)
