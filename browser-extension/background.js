// Rakshak AI - background service worker (MV3)
// Runs 24/7 in the background, aggregates detection events from content scripts
// and blocked/visited URLs, then raises notifications + toolbar badge.

import { inspectUrl } from './engine/urlDetector.js';
import { analyzeText } from './engine/nlp.js';
import { inspectUpi } from './engine/upi.js';

// Central detection: runs entirely in the service worker (reliable ES-module
// context). The content script only samples page text and reports overlay/voice.
function scanBlob(text) {
  if (!text || text.length < 3) return null;
  const n = analyzeText(text);

  let urlResult = null;
  if (n.extUrls && n.extUrls.length) {
    for (const u of n.extUrls.slice(0, 12)) {
      const r = inspectUrl(u);
      if (r && r.isThreat) urlResult = r;
    }
  }

  const upiPayload = text.match(/upi:\/\/pay[^\s"'<>()]+/i);
  let upiResult = null;
  if (upiPayload) upiResult = inspectUpi(upiPayload[0]);

  const scores = [
    n.isThreat ? n.riskScore : 0,
    urlResult ? urlResult.riskScore : 0,
    upiResult ? upiResult.riskScore : 0
  ];
  const max = Math.max(...scores);
  if (max < 70) return null;

  const bestNlp = n.best || {};
  let title = bestNlp.title || 'Suspicious message detected';
  let detail = bestNlp.explanation || 'Suspicious patterns detected in a message.';
  let domain = '';

  if (urlResult && urlResult.riskScore === max) {
    title = 'Phishing link in message';
    detail = urlResult.reasons.join(' ');
    domain = urlResult.domain;
  }
  if (upiResult && upiResult.riskScore === max) {
    title = 'UPI debit trap in message';
    detail = upiResult.reasons.join(' ') || upiResult.frictionMessage;
  }

  return {
    riskScore: max,
    severity: max >= 85 ? 'CRITICAL' : 'HIGH',
    title,
    detail,
    domain,
    hash: max + '|' + (domain || title)
  };
}

const DEFAULTS = {
  notifications: true,
  badge: true,
  overlay: true,
  urlScan: true,
  voice: true,
  enabled: true,
  seen: {},
  incidents: []
};

// ---------------------------------------------------------------------------
// Storage helpers
// ---------------------------------------------------------------------------
function getState() {
  return new Promise((resolve) => {
    chrome.storage.local.get(DEFAULTS, (data) => resolve(data));
  });
}

function saveState(state) {
  return new Promise((resolve) => chrome.storage.local.set(state, resolve));
}

async function withState(fn) {
  const state = await getState();
  const out = await fn(state);
  if (out !== undefined) await saveState(out);
  return out;
}

// ---------------------------------------------------------------------------
// URL / navigation monitoring (phishing links you click)
// ---------------------------------------------------------------------------
function normalizeHostname(url) {
  try {
    return new URL(url).hostname.toLowerCase();
  } catch (e) {
    return '';
  }
}

async function handleUrl(url, source) {
  const state = await getState();
  if (!state.enabled || !state.urlScan) return;

  const result = inspectUrl(url);
  if (!result) return;
  if (result.safe) return;

  const host = normalizeHostname(url);
  const key = 'url|' + host;
  const now = Date.now();

  // De-duplicate: don't spam repeated alerts for same host within 60s
  if (state.seen[key] && now - state.seen[key] < 60000) return;

  state.seen[key] = now;
  state.incidents = [
    {
      ts: new Date().toISOString(),
      kind: 'url',
      riskScore: result.riskScore,
      severity: result.riskScore >= 85 ? 'CRITICAL' : 'HIGH',
      title: 'Phishing / scam link detected',
      detail: result.reasons.join(' '),
      domain: host,
      source: source || 'link clicked'
    },
    ...state.incidents.slice(0, 99)
  ];
  await saveState(state);

  raiseAlert(state, {
    title: 'RAKSHAK: Phishing link - ' + host,
    message: (result.spoofedTarget ? 'Mimics ' + result.spoofedTarget + '. ' : '') +
      result.reasons.join(' ')
  }, result.riskScore);
}

// ---------------------------------------------------------------------------
// Alerts raised by content scripts (message scan results)
// ---------------------------------------------------------------------------
async function handleDetection(detection) {
  const state = await getState();
  if (!state.enabled || !state.notifications) return;

  const key = 'msg|' + (detection.hash || (detection.title + '|' + detection.riskScore));
  const now = Date.now();
  if (state.seen[key] && now - state.seen[key] < 90000) return;
  state.seen[key] = now;

  state.incidents = [
    {
      ts: new Date().toISOString(),
      kind: 'message',
      riskScore: detection.riskScore,
      severity: detection.severity,
      title: detection.title,
      detail: detection.detail || '',
      domain: detection.domain || '',
      source: detection.source || 'web message'
    },
    ...state.incidents.slice(0, 99)
  ];
  await saveState(state);

  raiseAlert(state, {
    title: 'RAKSHAK: ' + (detection.title || 'Threat detected'),
    message: detection.detail || 'A suspicious message was detected in the background.'
  }, detection.riskScore);
}

let alertInFlight = false;
async function raiseAlert(state, { title, message }, riskScore) {
  if (state.badge) {
    await chrome.action.setBadgeBackgroundColor({ color: '#ef4444' });
    await chrome.action.setBadgeText({ text: riskScore >= 85 ? '!' : '⚠' });
  }
  if (state.notifications && !alertInFlight) {
    alertInFlight = true;
    const id = 'rakshak_' + Date.now();
    chrome.notifications.create(id, {
      type: 'basic',
      iconUrl: 'icons/icon128.png',
      title: title.slice(0, 50),
      message: message.slice(0, 180),
      priority: riskScore >= 85 ? 2 : 0,
      contextMessage: 'Rakshak AI - Cyber Scam Shield (1930)'
    });
    const clear = () => { alertInFlight = false; };
    chrome.alarms.create('notif_clear', { when: Date.now() + 10000 });
    setTimeout(clear, 11000);
  }
}

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------
chrome.runtime.onInstalled.addListener(async () => {
  const state = await getState();
  state.enabled = true;
  state.notifications = true;
  state.badge = true;
  state.overlay = true;
  state.urlScan = true;
  state.voice = true;
  await saveState(state);
});

// Tell the content script of a tab to draw the overlay (and speak the alert).
function notifyContent(tabId, payload) {
  if (typeof tabId !== 'number') return;
  try {
    setTimeout(() => {
      chrome.tabs.sendMessage(tabId, { type: 'rakshak_show_overlay', payload }).catch?.(() => {});
    }, 50);
  } catch (e) { /* ignore */ }
}

function notifyContentSpeak(tabId, payload) {
  try {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const activeId = tabs && tabs[0] && tabs[0].id;
      const focused = activeId === tabId;
      if (focused) {
        chrome.tabs.sendMessage(tabId, { type: 'rakshak_speak', message: buildSpoken(payload) });
      } else {
        chrome.tabs.update(tabId, { active: true }, () => {
          if (chrome.runtime.lastError) return;
          setTimeout(() => {
            chrome.tabs.sendMessage(tabId, { type: 'rakshak_speak', message: buildSpoken(payload) });
          }, 250);
        });
      }
    });
  } catch (e) { /* ignore */ }
}

function buildSpoken(payload) {
  const t = payload.title || 'Possible scam message detected.';
  return (t + '. ' + (payload.domain || '')).trim();
}

// Message scan results sent from content scripts
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  // Content script sampled page text -> run detection here in the worker.
  if (msg && msg.type === 'rakshak_scan') {
    const statePromise = getState();
    statePromise.then((state) => {
      if (!state || !state.enabled) { sendResponse({ ok: true, reviewed: false }); return; }
      const payload = scanBlob(msg.text || '');
      if (!payload) { sendResponse({ ok: true, reviewed: true, found: false }); return; }
      const tabId = sender.tab && sender.tab.id;

      if (state.overlay) notifyContent(tabId, payload);
      if (state.voice) notifyContentSpeak(tabId, payload);

      handleDetection(payload).then(() => {
        sendResponse({ ok: true, found: true, payload });
      });
    });
    return true; // async response
  }
  if (msg && msg.type === 'rakshak_test') {
    const statePromise = getState();
    statePromise.then((state) => {
      const sample =
        msg.text ||
        'Aapka bijli bill update nahi hai, aaj raat 9 baje connection cut jayega. ' +
        'Pay immediately 9876543210 or click http://sbi-bank-kyc-update.top to reactivate your account.';
      const payload = scanBlob(sample) || {
        riskScore: 99,
        severity: 'CRITICAL',
        title: 'Demo: scam pattern detected',
        detail: 'Rakshak AI engine is running correctly. This is a test alert.',
        domain: 'sbi-bank-kyc-update.top',
        hash: 'test|' + Date.now()
      };
      // Always re-alert on repeated tests (bypass the 90s dedup key).
      if (payload && typeof payload.hash === 'string') payload.hash = payload.hash + '|' + Date.now();
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const tabId = tabs && tabs[0] && tabs[0].id;
        if (state.overlay) notifyContent(tabId, payload);
        if (state.voice) notifyContentSpeak(tabId, payload);
        handleDetection({ ...payload, source: 'test' }).then(() => {
          sendResponse({ ok: true, payload });
        });
      });
    });
    return true;
  }
  if (msg && msg.type === 'rakshak_detection') {
    const detection = {
      ...msg.detection,
      source: sender.tab ? (sender.tab.url || 'web') : 'web'
    };
    handleDetection(detection);
    sendResponse({ ok: true });
    return true;
  }
  if (msg && msg.type === 'rakshak_get_settings') {
    getState().then((s) => sendResponse({
      enabled: s.enabled,
      notifications: s.notifications,
      badge: s.badge,
      overlay: s.overlay,
      urlScan: s.urlScan,
      voice: s.voice,
      incidents: s.incidents
    }));
    return true;
  }
  // Focus the originating tab so Chrome's autoplay policy won't mute the
  // speech voice (voice plays even when the tab was in the background).
  if (msg && msg.type === 'rakshak_focus_and_speak') {
    const tabId = sender.tab && sender.tab.id;
    if (typeof tabId === 'number') {
      chrome.tabs.update(tabId, { active: true }, () => {
        if (chrome.runtime.lastError) return;
        setTimeout(() => {
          chrome.tabs.sendMessage(tabId, { type: 'rakshak_speak', message: msg.message });
        }, 250);
      });
    }
    sendResponse({ ok: true });
    return true;
  }
  if (msg && msg.type === 'rakshak_set_settings') {
    withState((s) => ({ ...s, [msg.key]: msg.value })).then((next) => {
      chrome.action.setBadgeText({ text: '' });
      sendResponse({ ok: true });
    });
    return true;
  }
  if (msg && msg.type === 'rakshak_clear_incidents') {
    withState((s) => ({ ...s, incidents: [], seen: {} })).then((next) => {
      chrome.action.setBadgeText({ text: '' });
      sendResponse({ ok: true });
    });
    return true;
  }
  return false;
});

// Monitor navigations so we can also watch the currently active page URL in background
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'loading' && tab.url && tab.url.startsWith('http')) {
    handleUrl(tab.url, 'visited page');
  }
});
chrome.tabs.onActivated.addListener(async ({ tabId }) => {
  try {
    const tab = await chrome.tabs.get(tabId);
    if (tab && tab.url && tab.url.startsWith('http')) {
      handleUrl(tab.url, 'active tab');
    }
  } catch (e) { /* tab closed */ }
});

// Clear stale notifications
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'notif_clear') {
    chrome.notifications.getAll((ids) => {
      Object.keys(ids).forEach((id) => {
        if (id.startsWith('rakshak_')) chrome.notifications.clear(id);
      });
    });
  }
});

// Open popup on notification click
chrome.notifications.onClicked.addListener((id) => {
  chrome.notifications.clear(id);
  if (chrome.action && typeof chrome.action.openPopup === 'function') {
    chrome.action.openPopup();
  }
});
