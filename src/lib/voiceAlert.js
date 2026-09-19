let muted = false;
try { muted = localStorage.getItem('rakshak_voice_mute') === '1'; } catch { /* ignore */ }

export function setVoiceMuted(m) {
  muted = m;
  try { localStorage.setItem('rakshak_voice_mute', m ? '1' : '0'); } catch { /* ignore */ }
}

export function isVoiceMuted() { return muted; }

export function speakAlert(text) {
  if (muted || typeof window === 'undefined' || !('speechSynthesis' in window)) return false;
  try {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'en-IN';
    u.rate = 1;
    u.pitch = 1;
    const v = window.speechSynthesis.getVoices().find((vv) => /en(-|_)in/i.test(vv.lang));
    if (v) u.voice = v;
    window.speechSynthesis.speak(u);
    return true;
  } catch { /* ignore */ }
  return false;
}

export function announceThreat(display) {
  if (!display?.tier) return;
  if (display.tier === 'HIGH' || display.tier === 'CRITICAL') {
    speakAlert(`Alert. ${display.tier} risk threat detected. ${display.statusText || 'Threat detected.'}`);
  }
}