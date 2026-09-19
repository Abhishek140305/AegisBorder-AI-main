// Rakshak AI popup dashboard
function send(msg) {
  return new Promise((resolve) => chrome.runtime.sendMessage(msg, resolve));
}

function bindToggle(id, key) {
  const el = document.getElementById(id);
  el.addEventListener('change', () => {
    send({ type: 'rakshak_set_settings', key, value: el.checked });
  });
  return el;
}

function renderIncidents(incidents) {
  const box = document.getElementById('incidents');
  if (!incidents || incidents.length === 0) {
    box.innerHTML = '<div class="empty">No threats detected yet. You are protected.</div>';
    return;
  }
  box.innerHTML = incidents.map((inc) => {
    const sevClass = 'sev ' + (inc.severity || 'HIGH');
    const icon = inc.kind === 'url' ? '🔗' : '💬';
    return (
      '<div class="incident ' + (inc.severity || 'high').toLowerCase() + '">' +
        '<div class="ititle">' + icon + ' ' + escapeHtml(inc.title) +
          ' <span class="' + sevClass + '">' + escapeHtml(inc.severity || '') + ' ' + (inc.riskScore || '') + '</span></div>' +
        '<div class="idetail">' + escapeHtml(inc.detail) + '</div>' +
        '<div class="imeta">' + escapeHtml(new Date(inc.ts).toLocaleString()) +
          (inc.domain ? ' &bull; ' + escapeHtml(inc.domain) : '') +
          ' &bull; ' + escapeHtml(inc.source || '') + '</div>' +
      '</div>'
    );
  }).join('');
}

function escapeHtml(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

async function refresh() {
  const s = await send({ type: 'rakshak_get_settings' });
  if (!s) return;
  document.getElementById('tEnabled').checked = !!s.enabled;
  document.getElementById('tNotify').checked = !!s.notifications;
  document.getElementById('tBadge').checked = !!s.badge;
  document.getElementById('tOverlay').checked = !!s.overlay;
  document.getElementById('tUrl').checked = !!s.urlScan;
  document.getElementById('tVoice').checked = s.voice !== false;

  const dot = document.getElementById('statusDot');
  const text = document.getElementById('statusText');
  dot.classList.toggle('off', !s.enabled);
  text.textContent = s.enabled ? 'Shield active - monitoring in background' : 'Shield paused';

  renderIncidents(s.incidents);
}

bindToggle('tEnabled', 'enabled');
bindToggle('tNotify', 'notifications');
bindToggle('tBadge', 'badge');
bindToggle('tOverlay', 'overlay');
bindToggle('tUrl', 'urlScan');
bindToggle('tVoice', 'voice');

document.getElementById('clearBtn').addEventListener('click', () => {
  send({ type: 'rakshak_clear_incidents' }).then(refresh);
});

const statusEl = document.getElementById('testStatus');

// Full end-to-end test: run a real scam text through the detection engine and
// trigger overlay + voice + notification + badge on the active tab.
document.getElementById('testBtn').addEventListener('click', () => {
  statusEl.textContent = 'Testing pipeline… check the active tab.';
  send({ type: 'rakshak_test' }).then(() => {
    statusEl.textContent = 'Demo alert sent. You should hear a voice + see the red banner.';
    setTimeout(refresh, 800);
  });
});

// Voice-only test (also asks the active tab to speak a short phrase).
document.getElementById('testVoiceBtn').addEventListener('click', () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tabId = tabs && tabs[0] && tabs[0].id;
    chrome.runtime.sendMessage({
      type: 'rakshak_focus_and_speak',
      message: 'Rakshak AI voice alert is working correctly.'
    });
  });
});

refresh();
