import { useCallback, useEffect, useRef, useState } from 'react';
import { apiBiometricStatus, apiBiometricSession, apiBiometricLiveness, apiBiometricVerify } from '../lib/api';
import { Button } from './ui';
import { useT } from '../i18n';

const FRAME_INTERVAL_MS = 400;

/**
 * Guided 1:1 face verification against the already-captured document image.
 *
 * Flow: engine status -> create biometric session (server keeps the document
 * portrait in memory) -> getUserMedia -> randomized active-liveness challenge
 * (head turn / move closer) -> server-side quality-gated frame scoring ->
 * final /verify with the strongest accepted frame. No images are stored.
 */
export default function BiometricVerification({ documentImageB64, onComplete, compact = false }) {
  const { t } = useT();
  const [phase, setPhase] = useState('idle'); // idle|starting|live|verifying|done|error
  const [message, setMessage] = useState('');
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const loopRef = useRef(null);
  const lastTickRef = useRef(0);
  const sessionIdRef = useRef(null);
  const bestFrameRef = useRef(null);
  const mountedRef = useRef(true);

  const stopCamera = useCallback(() => {
    const stream = streamRef.current;
    if (stream) {
      stream.getTracks().forEach((tr) => tr.stop());
      streamRef.current = null;
    }
    if (loopRef.current) {
      cancelAnimationFrame(loopRef.current);
      loopRef.current = null;
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      stopCamera();
    };
  }, [stopCamera]);

  const begin = useCallback(async () => {
    setError(null);
    setMessage('');
    setResult(null);
    setPhase('starting');
    try {
      const status = await apiBiometricStatus();
      if (!status.engine_ready) throw new Error(t('biover_engine_unavailable'));
    } catch (e) {
      setError(e.message || t('biover_start_failed'));
      setPhase('error');
      return;
    }
    try {
      const ses = await apiBiometricSession(documentImageB64);
      if (!ses.success) {
        const cause = { DOCUMENT_FACE_NOT_FOUND: 'biover_doc_noface', DOCUMENT_FACE_QUALITY_LOW: 'biover_doc_quality' }[ses.error_code] || 'biover_session_failed';
        setError(t(cause));
        setPhase('error');
        return;
      }
      sessionIdRef.current = ses.session_id;
      setSessionId(ses.session_id);
      setMessage(ses.challenge_hint);
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } }, audio: false });
      if (!mountedRef.current) {
        stream.getTracks().forEach((tr) => tr.stop());
        return;
      }
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
      setPhase('live');
      lastTickRef.current = 0;
      const loop = async (ts) => {
        if (!mountedRef.current || phaseRef.current !== 'live') return;
        if (ts - lastTickRef.current >= FRAME_INTERVAL_MS) {
          lastTickRef.current = ts;
          await analyzeFrame();
        }
        loopRef.current = requestAnimationFrame(loop);
      };
      phaseRef.current = 'live';
      loopRef.current = requestAnimationFrame(loop);
    } catch (e) {
      if (!mountedRef.current) return;
      setError(e.name === 'NotAllowedError' || e.name === 'NotFoundError' ? t('biover_camera_denied') : e.message || t('biover_start_failed'));
      setPhase('error');
    }
  }, [documentImageB64, t]);

  const phaseRef = useRef('idle');
  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  const analyzeFrame = useCallback(async () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    const frameB64 = canvas.toDataURL('image/jpeg', 0.72);
    const sid = sessionIdRef.current;
    if (!sid) return;
    try {
      const res = await apiBiometricLiveness(sid, frameB64);
      setMessage(res.hint || res.message || '');
      if (res.quality?.pass && !bestFrameRef.current) {
        bestFrameRef.current = frameB64;
      }
      if (res.complete && res.passed) {
        finish(sid, bestFrameRef.current || frameB64);
      } else if (res.failed) {
        setError(t('biover_liveness_failed'));
        setPhase('error');
        stopCamera();
      }
    } catch (e) {
      if (sessionIdRef.current !== sid) return; // session already ended
      if (String(e.message || '').includes('404')) {
        setError(t('biover_session_expired'));
        setPhase('error');
        stopCamera();
      }
    }
  }, [t, stopCamera]);

  const finish = useCallback(async (sid, frameB64) => {
    stopCamera();
    setPhase('verifying');
    setMessage(t('biover_verifying'));
    try {
      const res = await apiBiometricVerify({ session_id: sid, live_image_b64: frameB64 });
      sessionIdRef.current = null;
      if (!mountedRef.current) return;
      setResult(res);
      setPhase('done');
      if (onComplete) onComplete(res, frameB64);
    } catch (e) {
      if (mountedRef.current) {
        setError(e.message || t('biover_verify_failed'));
        setPhase('error');
      }
    }
  }, [t, stopCamera, onComplete]);

  const reset = useCallback(async () => {
    stopCamera();
    sessionIdRef.current = null;
    bestFrameRef.current = null;
    await begin();
  }, [begin, stopCamera]);

  const retry = useCallback(() => {
    setPhase('idle');
  }, []);

  if (phase === 'idle') {
    return (
      <div className="text-center">
        <Button onClick={begin} variant="primary" className="w-full">
          {t('biover_start')}
        </Button>
      </div>
    );
  }

  if (phase === 'error') {
    return (
      <div className="text-center">
        <p className="mb-3 text-sm text-red-600">{error}</p>
        <Button onClick={retry} variant="secondary" className="w-full">
          {t('biover_retry')}
        </Button>
      </div>
    );
  }

  return (
    <div className={compact ? 'space-y-2' : 'space-y-3'}>
      <div className="relative mx-auto overflow-hidden rounded-lg border border-slate-300 bg-black">
        <video ref={videoRef} muted playsInline className="mx-auto max-h-[220px] w-full object-contain" style={{ transform: 'scaleX(-1)' }} />
        {phase === 'live' && (
          <div className="absolute inset-6 rounded-full border-2 border-emerald-400/80" />
        )}
      </div>
      <p className="text-center text-sm font-semibold text-slate-700">{message}</p>
      {(phase === 'starting' || phase === 'verifying') && (
        <div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-navy-700 border-t-transparent" />
      )}
      {phase === 'done' && result && (
        <div className={`rounded-lg border px-3 py-2 text-center text-sm font-bold ${result.verified ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-amber-200 bg-amber-50 text-amber-900'}`}>
          {result.verified ? `✓ ${t('biover_verified')}` : `${result.decision}${result.error_code ? ` · ${result.error_code}` : ''}`}
          <div className="mt-1 text-xs font-normal">
            {t('biover_match')}: {result.match_score ?? '—'}% · {t('biover_liveness')}: {result.liveness?.is_live ? t('liveness_ok') : t('liveness_failed')}
          </div>
        </div>
      )}
      {phase === 'live' && (
        <Button variant="secondary" onClick={() => { stopCamera(); setPhase('idle'); }} className="w-full">
          {t('biover_cancel')}
        </Button>
      )}
    </div>
  );
}