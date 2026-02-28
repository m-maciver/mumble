# Ramble — ProductHunt Submission

---

## Name
Ramble

## Tagline
Ramble your idea. Get a perfect AI prompt.

*(59 chars — within 60-char limit)*

---

## Description

You have a great idea. You open Claude or ChatGPT. You type something like "help me with my website copy" and get back something generic and useless. The problem wasn't the AI — it was the prompt.

Ramble fixes that gap. You speak or type your raw thought, and Ramble rewrites it into a structured prompt that actually works — formatted specifically for whichever AI you have open. Claude gets WHY-framing and context. ChatGPT gets clear role + task structure. Gemini gets grounded, factual framing. Ramble detects the tab and adjusts automatically.

It's a Chrome extension. Click the icon, ramble for 10 seconds, get a prompt worth using. Free tier gives you 3/day to try it. We built this because we kept writing bad prompts ourselves — and figured if we're doing this manually anyway, the AI should do it for us.

---

## Topics / Tags
- Productivity
- Artificial Intelligence
- Chrome Extensions
- Developer Tools
- No-Code

---

## First Comment (Hunter's Opening)

I've been using AI daily for a while now, and I kept noticing the same pattern: the quality of what I got out was almost entirely determined by how well I could articulate my request upfront. That's a skill most people don't have time to develop.

We built Ramble to close that gap. The insight was simple — if different models (Claude, ChatGPT, Gemini) each have their own strengths and prompt preferences, why not just detect which one you're using and format the prompt for it automatically?

**What to try first:**
1. Install the extension
2. Open Claude.ai in one tab, ChatGPT in another
3. Think of a vague idea ("help me plan a blog post")
4. Click Ramble on the Claude tab → see how it frames the prompt
5. Try the same thought on the ChatGPT tab — notice the different structure

The difference is subtle but meaningful. Claude gets your WHY. ChatGPT gets a clear role + deliverable. That formatting is usually the difference between a useful answer and a generic one.

It's v0.1 and still rough around the edges. Free tier is 3 prompts/day — enough to feel whether it clicks for you. Happy to answer any questions below.

---

## Maker Comment (Response Template)

**Q: Does it require an API key?**
> The hosted version doesn't — you just install and go. If you want to self-host, yes, you'll need a Claude Haiku API key. Instructions are in the repo.

**Q: Which models does it support?**
> Currently detects Claude.ai, ChatGPT, and Gemini. It reads which tab you have active and formats the output accordingly. More models coming based on what people actually use.

**Q: How does the model-aware formatting work?**
> Each model has different strengths. Claude responds well to prompts that lead with intent and context. ChatGPT does well with explicit role definitions. Gemini benefits from factual grounding. Ramble applies these heuristics automatically — no settings to tweak.

**Q: Is my data private?**
> Your speech/text goes to Claude Haiku for processing. We don't store prompts or results. Standard API privacy applies.

**Q: When does Pro launch?**
> Soon. Pro will be unlimited prompts + a few features we're still testing (custom prompt styles, history). Free tier stays free.
