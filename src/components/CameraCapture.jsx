import { useEffect, useState, useRef } from 'react';
import { Camera, Check, X } from 'lucide-react';
import { useT } from '../i18n';

export default function CameraCapture({ onCapture, onCancel, className = '' }) {
  const { t } = useT();
  const [active, setActive] = useState(false);
  const [err, setErr] = useState(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const stop = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((tr) => tr.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    setActive(false);
  };

  useEffect(() => {
    if (!active) return;
    let cancelled = false;
    setErr(null);
    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' } });
        if (cancelled) {
          stream.getTracks().forEach((tr) => tr.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
      } catch {
        if (!cancelled) setErr(t('camera_failed'));
      }
    })();
    return () => {
      cancelled = true;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((tr) => tr.stop());
        streamRef.current = null;
      }
    };
  }, [active, t]);

  const snap = () => {
    const v = videoRef.current;
    if (!v?.srcObject) return;
    if (v.readyState < 2) return;
    const canvas = document.createElement('canvas');
    canvas.width = v.videoWidth || 640;
    canvas.height = v.videoHeight || 480;
    canvas.getContext('2d').drawImage(v, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    if (!dataUrl || dataUrl.length < 200) return;
    onCapture(dataUrl);
    stop();
  };

  if (!active) {
    return (
      <button type="button" onClick={() => setActive(true)}
        className={`flex flex-col items-center gap-1 text-sm text-slate-400 hover:text-slate-600 ${className}`}>
        <Camera className="h-6 w-6" /> {t('start_webcam')}
      </button>
    );
  }

  return (
    <div className={`w-full ${className}`}>
      <div className="relative overflow-hidden rounded-lg bg-slate-900">
        <video ref={videoRef} autoPlay playsInline muted className="h-44 w-full object-cover" aria-label={t('start_webcam')} />
        {err && <p className="absolute inset-0 flex items-center justify-center bg-slate-900 px-4 text-center text-xs text-red-300">{err}</p>}
      </div>
      {!err && (
        <div className="mt-2 flex items-center justify-center gap-2">
          <button type="button" onClick={snap} className="inline-flex items-center gap-1 rounded-md bg-emerald-700 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-800">
            <Check className="h-3.5 w-3.5" /> {t('snap_photo')}
          </button>
          <button type="button" onClick={() => { stop(); onCancel?.(); }} className="inline-flex items-center gap-1 rounded-md border border-slate-300 px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-100">
            <X className="h-3.5 w-3.5" /> {t('cancel')}
          </button>
        </div>
      )}
      {err && (
        <p className="mt-2 text-center text-[11px] text-slate-500">{t('cam_upload_hint')}</p>
      )}
    </div>
  );
}