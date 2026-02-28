/**
 * Ramble — popup.js
 * Interaction logic for the Ramble Chrome extension popup.
 * States: IDLE → RECORDING → LOADING → OUTPUT
 */

'use strict';

/* ── DOM refs ──────────────────────────────────────────────────────── */
const promptInput      = document.getElementById('promptInput');
const micBtn           = document.getElementById('micBtn');
const micIcon          = document.getElementById('micIcon');
const stopIcon         = document.getElementById('stopIcon');
const refineBtn        = document.getElementById('refineBtn');
const btnLabel         = refineBtn.querySelector('.btn-label');
const btnSpinner       = refineBtn.querySelector('.btn-spinner');
const outputSection    = document.getElementById('outputSection');
const refinedOutput    = document.getElementById('refinedOutput');
const copyBtn          = document.getElementById('copyBtn');
const explanationLine  = document.getElementById('explanationLine');
const refineAgainBtn   = document.getElementById('refineAgainBtn');
const voiceUnavailable = document.getElementById('voiceUnavailable');
const inputLabel       = document.getElementById('inputLabel');
const inputLabelText   = document.getElementById('inputLabelText');
const llmBadge         = document.getElementById('llmBadge');

/* ── State ─────────────────────────────────────────────────────────── */
let targetLLM   = 'other';
let isRecording = false;
let recognition = null;

// Track committed (final) vs in-progress (interim) transcript
let finalTranscript   = '';
let interimTranscript = '';

/* ── Init: read targetLLM from chrome.storage ──────────────────────── */
if (typeof chrome !== 'undefined' && chrome.storage) {
  chrome.storage.local.get(['currentLLM'], (res) => {
    targetLLM = res.currentLLM || 'other';
    llmBadge.textContent = targetLLM;
    llmBadge.setAttribute('data-llm', targetLLM);
  });
} else {
  // Dev/test context without chrome APIs
  llmBadge.textContent = targetLLM;
  llmBadge.setAttribute('data-llm', targetLLM);
}

/* ── Speech Recognition setup ──────────────────────────────────────── */
const SpeechRecognition =
  window.SpeechRecognition || window.webkitSpeechRecognition || null;

if (!SpeechRecognition) {
  voiceUnavailable.classList.add('visible');
  micBtn.classList.add('hidden');
} else {
  recognition = new SpeechRecognition();
  recognition.continuous     = true;
  recognition.interimResults = true;
  recognition.lang           = 'en-AU';

  recognition.onresult = (event) => {
    interimTranscript = '';
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const transcript = event.results[i][0].transcript;
      if (event.results[i].isFinal) {
        finalTranscript += transcript + ' ';
      } else {
        interimTranscript += transcript;
      }
    }

    // Show final text normally, interim in muted style via a combined display
    promptInput.value = finalTranscript + interimTranscript;

    // Dim the interim part (we can't colour partial text in a textarea,
    // but we toggle a class on the textarea so the whole field dims slightly
    // while speaking, clears when speech finalises)
    if (interimTranscript) {
      promptInput.classList.add('is-interim');
    } else {
      promptInput.classList.remove('is-interim');
    }
  };

  recognition.onerror = (event) => {
    console.warn('Ramble: speech error', event.error);
    if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
      voiceUnavailable.classList.add('visible');
      micBtn.classList.add('hidden');
    }
    stopRecording();
  };

  recognition.onend = () => {
    // If still flagged as recording (e.g. browser auto-stopped), clean up
    if (isRecording) stopRecording();
  };
}

/* ── Mic button: hold-to-record ────────────────────────────────────── */
function startRecording() {
  if (!recognition || isRecording) return;
  isRecording      = true;
  finalTranscript  = promptInput.value;   // preserve any typed text
  interimTranscript = '';

  micBtn.classList.add('recording');
  micBtn.setAttribute('aria-pressed', 'true');
  micIcon.style.display = 'none';
  stopIcon.style.display = 'block';
  inputLabel.classList.add('recording');
  inputLabelText.textContent = 'Recording…';

  try {
    recognition.start();
  } catch (e) {
    console.warn('Ramble: recognition.start() error', e);
    stopRecording();
  }
}

function stopRecording() {
  isRecording = false;

  micBtn.classList.remove('recording');
  micBtn.setAttribute('aria-pressed', 'false');
  micIcon.style.display = 'block';
  stopIcon.style.display = 'none';
  inputLabel.classList.remove('recording');
  inputLabelText.textContent = 'Speak your mind, then refine it.';
  promptInput.classList.remove('is-interim');

  try {
    if (recognition) recognition.stop();
  } catch (_) {}

  // Commit any trailing interim text
  if (interimTranscript) {
    promptInput.value = (finalTranscript + interimTranscript).trim();
    interimTranscript = '';
  }
}

// Pointer events (works for mouse + touch)
micBtn.addEventListener('pointerdown', (e) => {
  e.preventDefault();
  startRecording();
});

micBtn.addEventListener('pointerup', () => {
  stopRecording();
});

micBtn.addEventListener('pointerleave', () => {
  if (isRecording) stopRecording();
});

// Keyboard accessibility: hold Space/Enter on mic button
micBtn.addEventListener('keydown', (e) => {
  if ((e.key === ' ' || e.key === 'Enter') && !isRecording) {
    e.preventDefault();
    startRecording();
  }
});

micBtn.addEventListener('keyup', (e) => {
  if (e.key === ' ' || e.key === 'Enter') {
    stopRecording();
  }
});

/* ── State transitions ─────────────────────────────────────────────── */

function setStateIdle() {
  refineBtn.disabled = false;
  refineBtn.classList.remove('loading');
  btnLabel.textContent = 'Refine →';
  outputSection.classList.remove('loading', 'visible');
  explanationLine.classList.remove('visible');
  refineAgainBtn.classList.remove('visible');
  promptInput.focus();
}

function setStateLoading() {
  refineBtn.disabled = true;
  refineBtn.classList.add('loading');
  btnLabel.textContent = 'Refining…';
  refinedOutput.textContent = '';
  refinedOutput.classList.remove('error');
  outputSection.classList.add('loading');
  outputSection.classList.remove('visible');
  explanationLine.classList.remove('visible');
  refineAgainBtn.classList.remove('visible');
}

function setStateOutput({ refined, explanation, error }) {
  refineBtn.disabled = false;
  refineBtn.classList.remove('loading');
  btnLabel.textContent = 'Refine →';

  outputSection.classList.remove('loading');
  outputSection.classList.add('visible');

  if (error) {
    refinedOutput.textContent = '⚠️  ' + error;
    refinedOutput.classList.add('error');
    explanationLine.classList.remove('visible');
  } else {
    refinedOutput.classList.remove('error');
    refinedOutput.textContent = refined || '';

    if (explanation) {
      explanationLine.textContent = '✨ ' + explanation;
      explanationLine.classList.add('visible');
    }
  }

  refineAgainBtn.classList.add('visible');
}

/* ── Refine button ─────────────────────────────────────────────────── */
refineBtn.addEventListener('click', async () => {
  // Stop any active recording first
  if (isRecording) stopRecording();

  const rawInput = promptInput.value.trim();
  if (!rawInput) {
    // Shake the textarea to indicate empty input
    promptInput.focus();
    promptInput.style.transition = 'none';
    promptInput.style.outline = '2px solid #EF4444';
    setTimeout(() => {
      promptInput.style.outline = '';
      promptInput.style.transition = '';
    }, 800);
    return;
  }

  setStateLoading();

  try {
    // synthesize() is provided by synthesizer.js (or the stub below)
    const result = await synthesize(rawInput, targetLLM);

    if (result.error) {
      setStateOutput({
        error: result.error
      });
    } else {
      setStateOutput({
        refined:     result.refined     || rawInput,
        explanation: result.explanation || ''
      });
    }
  } catch (err) {
    console.error('Ramble: synthesize() threw', err);
    setStateOutput({
      error: 'Something went wrong. Please try again.'
    });
  }
});

/* ── Copy button ───────────────────────────────────────────────────── */
copyBtn.addEventListener('click', async () => {
  const text = refinedOutput.textContent;
  if (!text) return;

  try {
    await navigator.clipboard.writeText(text);
    copyBtn.classList.add('copied');
    copyBtn.innerHTML = `
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="20 6 9 17 4 12"/>
      </svg>
      Copied!
    `;
    setTimeout(() => {
      copyBtn.classList.remove('copied');
      copyBtn.innerHTML = `
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="9" y="9" width="13" height="13" rx="2"/>
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
        </svg>
        Copy
      `;
    }, 2000);
  } catch (err) {
    console.warn('Ramble: clipboard write failed', err);
    // Fallback: select text in output
    const range = document.createRange();
    range.selectNode(refinedOutput);
    window.getSelection().removeAllRanges();
    window.getSelection().addRange(range);
  }
});

/* ── Refine again button ───────────────────────────────────────────── */
refineAgainBtn.addEventListener('click', () => {
  setStateIdle();
  // Don't clear the textarea — user may want to tweak their input
});

/* ── Focus textarea on load ────────────────────────────────────────── */
window.addEventListener('load', () => {
  promptInput.focus();
});
