# Ramble — Chrome Web Store Submit Checklist

## Before you start: swap the API key
The extension currently uses the team Anthropic key. Before uploading, replace it with your personal one:

1. Open: `ramble/extension/synthesizer.js`
2. Find: `const ANTHROPIC_API_KEY = "sk-ant-..."`
3. Replace with your personal Anthropic API key
4. Re-zip: `cd ramble && zip -r store-assets/ramble-extension.zip extension/ -x "*.DS_Store"`

---

## Chrome Web Store Dashboard
URL: https://chrome.google.com/webstore/devconsole

---

## Step-by-step Upload

### 1. Create new item
- Dashboard → "New Item" → Upload ZIP
- File: `ramble/store-assets/ramble-extension.zip`

### 2. Store listing tab
- **Name:** Ramble
- **Summary (short description):** Turn voice rambles and typed thoughts into polished, model-optimised AI prompts for Claude, ChatGPT, and Gemini.
- **Description:** (paste from STORE-LISTING.md — the "Detailed Description" section)
- **Category:** Productivity
- **Language:** English

### 3. Screenshots (upload from `ramble/store-assets/screenshots/`)
- `ss1-hero.png` — Hero shot with tagline + UI
- `ss2-before-after.png` — Before/after transformation
- Minimum 1 required, you have 2 ✓

### 4. Icons
- Already embedded in the ZIP ✓ (manifest.json references icons/icon128.png for Store)

### 5. Privacy policy
- URL: `https://github.com/m-maciver/openclaw-mission-control/blob/main/ramble/PRIVACY-POLICY.md`
- Paste this URL into the "Privacy policy URL" field

### 6. Visibility (IMPORTANT — set this before publishing)
- Go to: "Visibility" tab or "Distribution" section
- Set to: **Unlisted**
- This means: only people with the direct link can install it. NOT searchable.

### 7. Permissions justification
If prompted to justify permissions:
- **activeTab**: "Detect which AI model the user has open to optimise prompt output"
- **storage**: "Store current LLM tab locally for badge colour display"
- **clipboardWrite**: "Copy refined prompt to clipboard when user clicks Copy"
- **scripting**: "Inject Ramble button on ChatGPT, Claude, Gemini pages"
- **host_permissions (api.anthropic.com)**: "Make API calls to Anthropic to synthesise prompts"

### 8. Submit for review
- Click "Publish" / "Submit for Review"
- Google review: typically 1-3 business days for new extensions
- You'll get an email when approved

---

## After approval
- You'll get a Chrome Web Store URL like: `https://chrome.google.com/webstore/detail/ramble/[id]`
- Install from that URL on any Chrome browser you want
- To go public later: Dashboard → Visibility → Public

---

## Files in this package
```
ramble/store-assets/
├── ramble-extension.zip          ← Upload this to the Store
├── STORE-LISTING.md              ← Copy-paste the description from here
├── SUBMIT-CHECKLIST.md           ← This file
├── screenshots/
│   ├── ss1-hero.png              ← Screenshot 1 (hero)
│   └── ss2-before-after.png     ← Screenshot 2 (before/after)
```

And the privacy policy is already in the repo:
```
ramble/PRIVACY-POLICY.md  →  github.com/m-maciver/openclaw-mission-control/blob/main/ramble/PRIVACY-POLICY.md
```
