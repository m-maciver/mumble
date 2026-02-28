# Ramble — Chrome Web Store Listing Copy

## Extension Name
Ramble

## Short Description (132 chars max)
Turn voice rambles and typed thoughts into polished, model-optimised AI prompts for Claude, ChatGPT, and Gemini.

(129 chars ✓)

## Detailed Description

---

**Ramble your idea. Get a perfect prompt.**

Most AI prompts are bad — not because people don't know what they want, but because translating a messy human thought into a well-structured prompt takes skill and time.

Ramble removes that friction.

**How it works:**
1. Open Ramble from your Chrome toolbar
2. Hold the mic and speak, or type your raw thought
3. Hit Refine — Ramble sends it to AI for synthesis
4. Copy the structured prompt and paste it into any AI

**Model-aware output:**
Ramble detects which AI you're using and optimises the prompt structure accordingly:
- **Claude** — includes WHY context, personality in role, positive format instructions
- **ChatGPT / GPT-4** — structured with clear sequencing and "Return only X" constraints
- **Gemini** — role + expertise combined, step-by-step guidance framing

**Works everywhere:**
Use it on any tab. When you're on ChatGPT, Claude, or Gemini, Ramble auto-detects the model and colour-codes the badge so you always know which optimisation mode is active.

**Simple by design:**
One button. One result. Copy and paste. No accounts, no dashboards, no configuration required.

---

## Category
Productivity

## Language
English

## Version
0.1.0

## Privacy Policy URL
https://github.com/m-maciver/openclaw-mission-control/blob/main/ramble/PRIVACY-POLICY.md

---

## Developer Notes (internal — do not paste into Store)

### Visibility setting:
Set to **Unlisted** — not searchable, only accessible via direct link.
Path: Developer Dashboard → Item → Visibility → Unlisted

### Why unlisted:
Private testing only. Change to Public when ready to launch.

### API Key note:
The Anthropic API key is embedded in synthesizer.js. This is fine for personal use.
Before going public, move to: User Settings page → user enters own key → stored in chrome.storage.sync.
