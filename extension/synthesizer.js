/**
 * synthesizer.js — Core synthesis logic for Ramble
 *
 * Transforms raw voice/text rambles into structured AI prompts.
 * Called by popup.js (Render's domain).
 *
 * CONTRACT (what Render needs to call):
 *   synthesize(rawInput: string, targetLLM: string)
 *   → Promise<{ refined: string, explanation: string, error?: string }>
 *
 * HOW TO USE IN POPUP.JS:
 *   <!-- popup.html: load BEFORE popup.js -->
 *   <script src="synthesizer.js"></script>
 *   <script src="popup.js"></script>
 *
 *   // popup.js:
 *   const { refined, explanation, error } = await window.RambleSynthesizer.synthesize(text, targetLLM);
 *
 * ⚠️  API KEY NOTE: This key is embedded for beta/MVP only.
 *     Before any public release, move to chrome.storage.sync or a user
 *     settings page. See ramble/FORGE-HANDOFF.md for migration notes.
 */

(function (global) {
  "use strict";

  // ─── Config ────────────────────────────────────────────────────────────────
  // TODO: Move ANTHROPIC_API_KEY to user settings before production release.
  const ANTHROPIC_API_KEY =
    "YOUR_ANTHROPIC_API_KEY_HERE";
  const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
  const MODEL = "claude-haiku-4-5";
  const MAX_TOKENS = 1024;
  const MAX_INPUT_CHARS = 8000;

  // ─── System prompt ─────────────────────────────────────────────────────────

  const SYSTEM_PROMPT_BASE = `You are Ramble, an expert prompt engineer who transforms messy human thoughts into precision AI prompts.

Your job: take a user's raw ramble (voice transcription or typed stream-of-consciousness) and turn it into a clean, structured prompt that will get excellent results from an AI model.

Output format — use exactly these headers on separate lines:
[Role] Who should the AI be? (e.g. "You are an expert copywriter with 15 years of experience in B2B SaaS")
[Context] What background does the AI need to understand the situation?
[Task] Exactly what to do — specific, actionable, 1-3 sentences.
[Format] How should the output be structured? (e.g. bullet list, numbered steps, prose, code block, table)
[Constraints] Limits, tone, what to avoid, length targets.

Then on a new line (after a blank line), write exactly one sentence:
RAMBLE_EXPLANATION: Ramble turned your [brief description of input type/topic] into [brief description of what the output achieves].

Rules:
1. Extract the REAL intent — what they actually want, not just what they said
2. Strip ALL filler: ums, ahs, repetition, tangents, self-corrections, false starts
3. Fill in reasonable unstated constraints the user likely forgot (don't invent new goals)
4. Make [Task] specific enough that an AI with zero context would know exactly what to do
5. Keep the entire structured prompt under 300 words
6. No placeholders like [INSERT X] — make it immediately copy-pasteable
7. Output ONLY the structured prompt + RAMBLE_EXPLANATION line. No preamble, no commentary.`;

  // Per-model optimisation hints appended to system prompt
  const LLM_HINTS = {
    chatgpt: `

TARGET MODEL: ChatGPT (GPT-4 / GPT-4o)
Optimise for GPT-4/4o: this model follows explicit, directive instructions best.

Role guidance: Use "You are a [specific job title] with [X] years of experience in [specific domain]." Be concrete — no vague titles.

Task guidance: Make [Task] directive and literal. Use "First X. Then Y." for multi-step tasks. GPT-4 performs best when told exactly what to do in sequence.

Format guidance: Specify the exact output structure — numbered list, JSON keys, table columns, or prose paragraphs. Structure the prompt with clear Markdown headers (# Role, # Task, # Format, # Constraints). Include "Return only [format] — no preamble or explanation." in [Constraints] for focused output.

Constraints guidance: Include "Return only X" for focused output. Use bullet constraints. Add "Think step by step" in [Constraints] if the task involves reasoning or multi-step decisions.`,

    claude: `

TARGET MODEL: Claude (Anthropic — Claude 3.5/4.x)
Optimise for Claude: this model excels at nuanced, structured prompts with clear role + personality.

Role guidance: Include personality traits AND expertise in [Role] — not just a job title. E.g. "You are a pragmatic technical writer who values clarity over jargon, with 10 years in developer documentation." Claude uses this to calibrate tone throughout the response.

Context guidance: Explain the WHY behind key constraints in [Context] — Claude generalises intelligently from motivation. E.g. "This will be read by non-technical executives, so avoid jargon because they won't have technical background." Place long documents or background material at the TOP of [Context], before the task.

Task guidance: Include "Think step by step before answering." at the end of [Task] for reasoning-heavy requests.

Constraints guidance: Use positive framing ("Write in flowing prose paragraphs") not negative ("Don't use bullet points"). Add "If unsure about any fact, say so explicitly — do not guess." Include "Be thorough but concise" — Claude takes dual directives seriously.`,

    gemini: `

TARGET MODEL: Gemini (Google — Gemini 1.5 / 2.0 / 2.5 Pro)
Optimise for Gemini: this model is strongest on structured, factual synthesis with explicit scope.

Role guidance: Use the combined formula in [Role]: "You are a [specific role], expert in [domain], with experience in [relevant area]." Gemini responds best to role + expertise stated together.

Task guidance: Make [Task] specific with an explicit scope boundary — Gemini will range broadly without limits. Add "Limit your response to [specific scope]" in [Constraints]. For research/comparison tasks, use "compare and contrast", "research and synthesise", or "list and evaluate" framing — Gemini excels here.

Format guidance: Always specify the format explicitly. Prefer numbered lists, tables, and step-by-step structures over flowing prose. If the task has multiple parts, label them explicitly (Part 1, Part 2). Use "Please provide step-by-step [output]" rather than just "List [output]" — the guidance framing activates Gemini's reasoning layer.

Constraints guidance: Add explicit scope limits and length guidance. Avoid ambiguity — Gemini interprets unclear constraints broadly.`,

    other: `

TARGET MODEL: Generic (works across ChatGPT, Claude, Gemini, and others)
Write a universally effective prompt: clear [Role], sufficient [Context], specific [Task], defined [Format], and practical [Constraints]. Avoid model-specific idioms. Prioritise clarity and specificity over cleverness. The prompt should produce good results regardless of which AI model is used.

Guiding principles: Role → Context → Task → Format → Constraints. One clear primary ask. Be specific: "Summarise in 3 bullet points" beats "Summarise". Include "Think step by step" if the task requires reasoning.`,
  };

  function buildSystemPrompt(targetLLM) {
    const hint = LLM_HINTS[targetLLM] || LLM_HINTS.other;
    return SYSTEM_PROMPT_BASE + hint;
  }

  function buildUserMessage(rawInput) {
    return (
      `Here's the user's raw input:\n---\n${rawInput}\n---\n\n` +
      `Transform this into a structured Ramble prompt. Follow the [Role]/[Context]/[Task]/[Format]/[Constraints] format exactly, then add the RAMBLE_EXPLANATION line.`
    );
  }

  // ─── API call ───────────────────────────────────────────────────────────────

  async function callClaude(systemPrompt, userMessage) {
    // In Node.js (test environment), fetch is available natively in Node 18+
    // In Chrome extension popup, fetch is always available
    const fetchFn = typeof fetch !== "undefined" ? fetch : global.fetch;

    const response = await fetchFn(ANTHROPIC_API_URL, {
      method: "POST",
      headers: {
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: MAX_TOKENS,
        system: systemPrompt,
        messages: [{ role: "user", content: userMessage }],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Anthropic API ${response.status}: ${errText}`);
    }

    const data = await response.json();
    return data.content[0].text.trim();
  }

  // ─── Response parser ────────────────────────────────────────────────────────

  function parseResponse(raw) {
    const lines = raw.split("\n");
    const explIdx = lines.findIndex((l) => l.startsWith("RAMBLE_EXPLANATION:"));

    let explanation = "";
    let promptLines = [...lines];

    if (explIdx !== -1) {
      explanation = lines[explIdx].replace("RAMBLE_EXPLANATION:", "").trim();
      promptLines = lines.filter((_, i) => i !== explIdx);
    }

    // Trim trailing blank lines
    while (promptLines.length > 0 && promptLines[promptLines.length - 1].trim() === "") {
      promptLines.pop();
    }

    return {
      refined: promptLines.join("\n").trim(),
      explanation,
    };
  }

  // ─── Public API ─────────────────────────────────────────────────────────────

  /**
   * Synthesise a raw ramble into a structured AI prompt.
   *
   * @param {string} rawInput - Raw voice transcription or typed text (may contain ums, ahs, filler)
   * @param {"chatgpt"|"claude"|"gemini"|"other"} targetLLM - Target model to optimise for
   * @returns {Promise<{ refined: string, explanation: string, error?: string }>}
   *
   * On success: { refined: "<structured prompt>", explanation: "<1-sentence description>" }
   * On failure: { refined: "", explanation: "", error: "<error message>" }
   */
  async function synthesize(rawInput, targetLLM = "other") {
    if (!rawInput || !rawInput.trim()) {
      return {
        refined: "",
        explanation: "",
        error: "Empty input — nothing to synthesise.",
      };
    }

    const VALID_LLMS = ["chatgpt", "claude", "gemini", "other"];
    const llm = VALID_LLMS.includes(targetLLM) ? targetLLM : "other";

    // Truncate very long inputs
    const input =
      rawInput.length > MAX_INPUT_CHARS
        ? rawInput.slice(0, MAX_INPUT_CHARS) + "\n[...truncated]"
        : rawInput;

    try {
      const systemPrompt = buildSystemPrompt(llm);
      const userMessage = buildUserMessage(input);
      const raw = await callClaude(systemPrompt, userMessage);
      const { refined, explanation } = parseResponse(raw);

      return { refined, explanation };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error("[Ramble synthesizer] Error:", message);
      return { refined: "", explanation: "", error: message };
    }
  }

  // ─── Export ─────────────────────────────────────────────────────────────────
  // Works in both Chrome extension (window global) and Node.js (module.exports)

  const exports = { synthesize };

  if (typeof module !== "undefined" && typeof module.exports !== "undefined") {
    // Node.js / CommonJS (used by test-synth.js)
    module.exports = exports;
  } else {
    // Browser / Chrome extension: expose as global namespace + bare function
    // popup.js calls synthesize() directly — expose both for compatibility
    global.RambleSynthesizer = exports;
    global.synthesize = exports.synthesize;
  }
})(typeof globalThis !== "undefined" ? globalThis : typeof window !== "undefined" ? window : this);
