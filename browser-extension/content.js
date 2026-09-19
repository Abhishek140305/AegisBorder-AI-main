// Rakshak AI - content script
// Samples visible page text on messaging web apps in the background and asks
// the service worker to run scam detection. When the worker flags a threat it
// replies and tells us to draw the in-page overlay and speak the alert.
//
// NOTE: all detection logic lives in the background service worker
// (background.js) to avoid fragile in-page module imports. This script only
// extracts text and manages the overlay + voice.

'use strict';

// ------------------------------------------------------------------
// Settings (via background worker)
// ------------------------------------------------------------------
function getSettings() {
  return new Promise((resolve) => {
    try {
      chrome.runtime.sendMessage({ type: 'rakshak_get_settings' }, (r) => resolve(r || {}));
    } catch (e) {
      resolve({});
    }
  });
}

// ------------------------------------------------------------------
// Text extraction: gather visible text (msg panels, body, inputs).
// Bounded to keep it cheap on heavy virtual-DOM apps (WhatsApp Web etc.)
// ------------------------------------------------------------------
const IGNORE_TAGS = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'SVG', 'CODE', 'TEXTAREA', 'INPUT']);
const MAX_SAMPLE = 30000; // gather plenty of text so we sweep more of the page

function extractText(el) {
  if (!el) return '';
  const parts = [];
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const parent = node.parentElement;
      if (!parent) return NodeFilter.FILTER_REJECT;
      if (IGNORE_TAGS.has(parent.tagName)) return NodeFilter.FILTER_REJECT;
      const s = node.nodeValue;
      if (!s || s.trim().length < 3) return NodeFilter.FILTER_REJECT;
      // keep anything with letters / numbers / URLs / upi links
      if (!/[a-z0-9]{3,}/i.test(s)) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    }
  }, false);

  while (walker.nextNode() && parts.join(' ').length < MAX_SAMPLE) {
    const t = walker.currentNode.nodeValue.trim();
    if (t) parts.push(t);
  }
  return parts.join(' \u2022 ').slice(0, MAX_SAMPLE);
}

// ------------------------------------------------------------------
// Overlay UI (in-page warning banner)
// ------------------------------------------------------------------
function injectOverlayCss() {
  if (document.getElementById('rakshak-overlay-style')) return;
  const link = document.createElement('link');
  link.id = 'rakshak-overlay-style';
  link.rel = 'stylesheet';
  link.href = chrome.runtime.getURL('overlay.css');
  (document.head || document.documentElement).appendChild(link);
}

function showOverlay(payload) {
  injectOverlayCss();
  if (document.getElementById('rakshak-overlay')) return; // one at a time

  const host = document.createElement('div');
  host.id = 'rakshak-overlay';
  host.className = 'rakshak-overlay rakshak-' + (payload.severity || 'HIGH').toLowerCase();

  host.innerHTML =
    '<div class="rakshak-overlay-inner">' +
      '<div class="rakshak-overlay-icon">RAKSHAK</div>' +
      '<div class="rakshak-overlay-body">' +
        '<div class="rakshak-overlay-title">' + escapeHtml(payload.title || 'Threat detected') + '</div>' +
        '<div class="rakshak-overlay-detail">' + escapeHtml(payload.detail || '') + '</div>' +
        (payload.domain
          ? '<div class="rakshak-overlay-domain">Suspicious domain: <b>' + escapeHtml(payload.domain) + '</b></div>'
          : '') +
        '<div class="rakshak-overlay-foot">Rakshak AI - Cyber Scam Shield &bull; Report at <b>1930</b></div>' +
      '</div>' +
      '<button class="rakshak-overlay-close" title="Close">&times;</button>' +
    '</div>';

  host.querySelector('.rakshak-overlay-close').addEventListener('click', () => {
    host.remove();
  });

  (document.body || document.documentElement).appendChild(host);
}

function speak(message) {
  try {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(message || 'Attention. Possible scam message detected.');
    utter.lang = 'en-IN';
    utter.rate = 1;
    utter.pitch = 1;
    window.speechSynthesis.speak(utter);
  } catch (e) { /* voice is optional */ }
}

function escapeHtml(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ------------------------------------------------------------------
// Commands from the background worker
// ------------------------------------------------------------------
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg && msg.type === 'rakshak_show_overlay' && msg.payload) {
    showOverlay(msg.payload);
    sendResponse && sendResponse({ ok: true });
    return true;
  }
  if (msg && msg.type === 'rakshak_speak' && msg.message) {
    speak(msg.message);
    sendResponse && sendResponse({ ok: true });
    return true;
  }
  return false;
});

// ------------------------------------------------------------------
// Main loop: periodically sample the page and send it to the worker.
// ------------------------------------------------------------------
let lastSample = '';
let running = false;
// Threats already surfaced (overlay + voice), keyed by worker payload hash,
// so a dismissed alert stays gone until a different threat appears.
const handledThreats = new Set();

async function tick() {
  try {
    const settings = await getSettings();
    if (!settings || !settings.enabled) return;

    const root = document.body;
    if (!root) return;
    const sample = extractText(root);
    if (!sample || sample === lastSample) return;
    lastSample = sample;

    // Ask the worker to run detection (it returns whether a threat was found).
    chrome.runtime.sendMessage({ type: 'rakshak_scan', text: sample }, (resp) => {
      if (!resp || !resp.found || !resp.payload) return;
      const payload = resp.payload;
      if (handledThreats.has(payload.hash)) return;
      handledThreats.add(payload.hash);
      // Worker already triggered overlay + voice via rakshak_show_overlay /
      // rakshak_speak. Nothing more needed here.
    });
  } catch (e) {
    // keep the loop resilient
  }
}

// Throttled interval (also start with an immediate sample on load).
setInterval(() => {
  if (running) return;
  running = true;
  setTimeout(() => { running = false; }, 500);
  tick();
}, 4000);

setTimeout(tick, 1200);
