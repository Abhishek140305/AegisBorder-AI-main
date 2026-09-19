import { useCallback, useEffect, useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import {
  Scan, FileText, Camera, User, FlaskConical, CheckCircle2, AlertTriangle,
  UploadCloud, RefreshCw, Loader2, ShieldCheck, Lock, ArrowRight, Eye, EyeOff, KeyRound, X
} from 'lucide-react';
import { Card, Badge, Button, ProgressSteps, cx, verifyIcon } from '../components/ui';
import { apiPresets, apiPresetDetail, apiScreenDocument, apiDeletePassenger } from '../lib/api';
import { addToHistory, updateRecordStatus, tierMeta } from '../lib/store';
import { toast } from '../components/Toast';
import NewPassengerModal from '../components/NewPassengerModal';
import CameraCapture from '../components/CameraCapture';
import BiometricVerification from '../components/BiometricVerification';
import AuditReport from '../components/AuditReport';
import { speakAlert } from '../lib/voiceAlert';
import { useT } from '../i18n';

const STEPS = ['step_document', 'step_information', 'step_face_short', 'step_analysis_short', 'step_result'];

function StepCard({ children, step, title, desc, id }) {
  return (
    <Card id={id} className="p-5">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-navy-900 text-sm font-extrabold text-white">{step}</div>
        <div>
          <h2 className="text-sm font-bold text-slate-900">{title}</h2>
          {desc && <p className="text-xs text-slate-500">{desc}</p>}
        </div>
      </div>
      {children}
    </Card>
  );
}

function InfoRow({ label, value, tone }) {
  return (
    <div className="flex items-center justify-between border-b border-slate-100 py-2 last:border-0">
      <span className="text-xs font-medium text-slate-500">{label}</span>
      <span className={cx('text-sm font-semibold', tone === 'warn' ? 'text-amber-700' : tone === 'fail' ? 'text-red-700' : 'text-slate-900', tone === 'mono' && 'font-mono')}>{value || '—'}</span>
    </div>
  );
}

export default function Screening({ focus = 'document' }) {
  const { t } = useT();
  const [step, setStep] = useState(0);
  const [presets, setPresets] = useState([]);
  const [activePreset, setActivePreset] = useState(null);
  const [documentImage, setDocumentImage] = useState(null);
  const [liveImage, setLiveImage] = useState(null);
  const [mrzText, setMrzText] = useState('');
  const [uploadName, setUploadName] = useState(null);
  const [result, setResult] = useState(null);
  const [recordId, setRecordId] = useState(null);
  const [officerStatus, setOfficerStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showTechnical, setShowTechnical] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [showMrz, setShowMrz] = useState(false);
  const [docCamOn, setDocCamOn] = useState(false);
  const [guidedBio, setGuidedBio] = useState(null);
  const fileRef = useRef(null);
  const liveFileRef = useRef(null);
  const confettiFiredRef = useRef(false);
  const spokeRef = useRef(null);

  useEffect(() => {
    if (!result || spokeRef.current === result) return;
    const tier = result.risk_assessment?.risk_tier;
    const flagged = !!result.watchlist_screening?.flagged;
    if (!flagged && tier !== 'HIGH' && tier !== 'CRITICAL') return;
    spokeRef.current = result;
    speakAlert(tier === 'CRITICAL' || flagged ? t('critical_risk_alert') : t('high_risk_alert'));
  }, [result, t]);

  useEffect(() => {
    let active = true;
    apiPresets().then((data) => active && setPresets(data.presets || [])).catch(() => active && setPresets([]));
    return () => { active = false; };
  }, []);

  const refreshPresets = useCallback(() => {
    apiPresets().then((data) => setPresets(data.presets || [])).catch(() => {});
  }, []);

  const applyFocus = useCallback(() => {
    switch (focus) {
      case 'biometrics': setStep(2); break;
      case 'forensics': setStep(3); setShowTechnical(true); break;
      case 'watchlist': setStep(4); break;
      case 'audit': setStep(4); setShowReport(true); break;
      default: setStep(1);
    }
  }, [focus]);

  const deletePassenger = useCallback(async (id, holderName, e) => {
    e.stopPropagation();
    try {
      await apiDeletePassenger(id);
      if (activePreset?.id === id) {
        setActivePreset(null);
        setDocumentImage(null);
        setLiveImage(null);
        setMrzText('');
        setGuidedBio(null);
      }
      refreshPresets();
      toast(`${holderName} ${t('removed_from_passengers')}`, { type: 'info', title: t('passenger_deleted') });
    } catch (err) {
      toast(err.message || t('could_not_remove_passenger'), { type: 'error', title: t('delete_failed') });
    }
  }, [activePreset, refreshPresets, t]);

  const loadPreset = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    try {
      const p = await apiPresetDetail(id);
      const full = presets.find((x) => x.id === id) || {};
      setActivePreset({ ...full, ...p });
      setDocumentImage(p.image_b64 || null);
      setLiveImage(p.live_passenger_b64 || null);
      setMrzText(p.mrz_raw || '');
      setUploadName(null);
      setResult(null);
      setRecordId(null);
      setGuidedBio(null);
      setStep(0);
    } catch (e) {
      setError(e.message || t('failed_to_load_scenario'));
    } finally {
      setLoading(false);
    }
  }, [presets, t]);

  const runScreening = useCallback(async (liveOverride) => {
    const doc = documentImage;
    const face = liveOverride ?? liveImage;
    if (!doc && !mrzText.trim()) {
      setError(t('need_document'));
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const payload = { document_image_b64: doc, live_passenger_b64: face, mrz_text_raw: mrzText };
      const data = await apiScreenDocument(payload);
      // The guided active-liveness verification is the strongest biometric
      // evidence; when present, its result overrides the screening engine's
      // passive-only comparison.
      const merged = guidedBio ? { ...data, biometrics: { ...data.biometrics, ...guidedBio } } : data;
      const rc = addToHistory(merged, { source: activePreset ? 'scenario' : 'live', scenario: activePreset?.title || uploadName || null });
      setResult(merged);
      setRecordId(rc.id);
      applyFocus();
      const tier = merged.risk_assessment?.risk_tier || 'LOW';
      toast(
        tier === 'LOW' ? t('screen_cleared') : t('screen_review', { score: merged.risk_assessment?.overall_risk_score, tier }),
        { type: tier === 'LOW' ? 'success' : tier === 'CRITICAL' ? 'error' : 'warning', title: t('screening_complete') },
      );
    } catch (e) {
      setError(e.message || t('screen_failed'));
      toast(t('screen_failed'), { type: 'error', title: t('screening_error') });
    } finally {
      setLoading(false);
    }
  }, [documentImage, liveImage, mrzText, activePreset, uploadName, applyFocus, guidedBio, t]);

  const handleGuidedVerify = useCallback((bio, frameB64) => {
    setGuidedBio(bio);
    setLiveImage(frameB64);
    setResult((prev) => (prev ? { ...prev, biometrics: { ...prev.biometrics, ...bio } } : prev));
  }, []);

  const handleUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setDocumentImage(ev.target?.result);
        setUploadName(file.name);
        setActivePreset(null);
        setResult(null);
        setRecordId(null);
        setGuidedBio(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const takeAction = (status) => {
    if (recordId) updateRecordStatus(recordId, status);
    setOfficerStatus(status);
    if (status === 'approved') {
      confetti({ particleCount: 100, spread: 75, origin: { y: 0.6 } });
      toast(t('entry_granted_msg'), { type: 'success', title: t('entry_granted') });
    } else if (status === 'review') {
      toast(t('secondary_msg'), { type: 'warning', title: t('secondary_insp') });
    } else {
      toast(t('detained_msg'), { type: 'error', title: t('detained') });
    }
  };

  const mrz = result?.extracted_data?.mrz || {};
  const viz = result?.extracted_data?.viz || {};
  const risk = result?.risk_assessment || {};
  const bio = result?.biometrics || {};
  const forensics = result?.forensics?.summary || {};
  const docVal = result?.document_validation || {};
  const watch = result?.watchlist_screening || {};
  const meta = tierMeta(risk.risk_tier);

  const granted = risk.recommended_decision?.toUpperCase().includes('GRANT');
  useEffect(() => {
    if (step === 4 && granted && !confettiFiredRef.current) {
      confettiFiredRef.current = true;
      confetti({ particleCount: 120, spread: 75, origin: { y: 0.25 } });
    }
    if (!granted) confettiFiredRef.current = false;
  }, [step, granted]);

  const checks = result ? [
    { name: t('chk_ocr'), state: result?.extracted_data ? 'pass' : 'fail', desc: t('chk_ocr_desc') },
    { name: t('chk_mrz'), state: mrz?.checksums?.overall_valid ? 'pass' : 'fail', desc: t('chk_mrz_desc') },
    { name: t('chk_doc_valid'), state: docVal.is_valid ? 'pass' : 'fail', desc: docVal.is_valid ? t('chk_no_discrep') : (docVal.discrepancies || []).map((d) => d.description).join('; ') },
    { name: t('chk_forensics'), state: forensics.is_photo_tampered === false ? 'pass' : 'fail', desc: forensics.is_photo_tampered ? t('chk_tamper_detected') : t('chk_no_tamper') },
    { name: t('chk_metadata'), state: forensics.detected_software ? 'warn' : 'pass', desc: forensics.detected_software ? `${t('editing_software')}: ${forensics.detected_software.join(', ')}` : t('no_editing_traces') },
    { name: t('chk_face'), state: bio.biometric_available === false ? 'warn' : (bio.is_matched ? 'pass' : 'fail'), desc: bio.biometric_available === false ? t('no_live_capture') : (bio.is_matched ? `${t('match')} ${bio.match_score}% · ${t('liveness')} ${bio.liveness?.is_live ? t('liveness_ok') : t('liveness_failed')}` : `${t('match')} ${bio.match_score}% — ${bio.confidence || 'MISMATCH'}`) },
    { name: t('chk_watchlist'), state: watch.flagged ? 'fail' : 'pass', desc: watch.flagged ? (watch.alerts || []).map((a) => a.reason).join('; ') : t('no_watchlist_match') },
  ] : [];

  const compKeys = [
    { label: t('comp_mrz'), key: 'integrity_risk' },
    { label: t('comp_forensics'), key: 'forensic_tamper_risk' },
    { label: t('comp_face'), key: 'biometric_mismatch_risk' },
    { label: t('comp_watchlist'), key: 'watchlist_risk' },
  ];

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <ProgressSteps steps={STEPS.map((s) => t(s))} current={step} />
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          <AlertTriangle className="h-4 w-4 shrink-0" /> {error}
          <button className="ml-auto text-xs font-semibold underline" onClick={() => setError(null)}>{t('dismiss')}</button>
        </div>
      )}

      {step >= 1 && result && (
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white p-2 shadow-sm">
          {[
            { id: 1, label: t('mrz_validation'), icon: FileText },
            { id: 2, label: t('biometrics'), icon: Camera },
            { id: 3, label: t('forensics'), icon: FlaskConical },
            { id: 4, label: t('risk_decision'), icon: ShieldCheck },
          ].map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => { setStep(id); if (id === 3) setShowTechnical(true); }}
              className={cx('flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-colors',
                step === id ? 'bg-navy-800 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100')}>
              <Icon className="h-3.5 w-3.5" /> {label}
            </button>
          ))}
          <span className="ml-auto hidden text-[11px] font-medium text-slate-400 md:inline">{t('module_reviews')}</span>
        </div>
      )}

      {step === 0 && (
        <StepCard step={1} title={t('step_document')} desc={t('step_document_desc')} id="step-document">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-500">{t('input_source')}:</span>
            <Button variant="secondary" onClick={() => setShowRegister(true)}><User className="h-4 w-4" /> {t('register_passenger')}</Button>
          </div>

          <p className="mb-2 text-xs font-semibold text-slate-500">{t('test_scenarios')}</p>
          {presets.length === 0 ? (
            <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin" /> {t('loading_scenarios')}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {presets.map((p) => (
                <button key={p.id} type="button" onClick={() => loadPreset(p.id)}
                  className={cx('group relative rounded-lg border p-3 text-left transition-colors',
                    activePreset?.id === p.id ? 'border-navy-800 bg-navy-50 ring-1 ring-navy-800' : 'border-slate-200 bg-slate-50 hover:border-slate-300')}>
                  {p.is_custom && (
                    <span
                      role="button"
                      tabIndex={0}
                      aria-label={`Delete ${p.holder_name}`}
                      onClick={(e) => deletePassenger(p.id, p.holder_name, e)}
                      onKeyDown={(e) => e.key === 'Enter' && deletePassenger(p.id, p.holder_name, e)}
                      className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-400 opacity-0 shadow transition-opacity hover:text-red-600 group-hover:opacity-100"
                    >
                      <X className="h-3 w-3" />
                    </span>
                  )}
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-xs font-bold text-slate-800">{p.holder_name}</span>
                    <Badge color={p.badge_color || 'slate'}>{p.badge}</Badge>
                  </div>
                  <div className="mt-1 text-[11px] text-slate-500">{p.document_type} · {p.nationality || '—'} · {p.doc_number}</div>
                  <p className="mt-1 line-clamp-1 text-[11px] text-slate-400">{p.description}</p>
                </button>
              ))}
            </div>
          )}

          <div className="my-5 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-lg border border-slate-200 p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-600"><FileText className="mr-1.5 inline h-3.5 w-3.5 text-navy-700" />{t('document_scan')}</span>
                <div className="flex items-center gap-2">
                  {!docCamOn && (
                    <button type="button" onClick={() => setDocCamOn(true)} className="flex items-center gap-1 rounded-md border border-slate-300 px-2 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-100">
                      <Camera className="h-3.5 w-3.5" /> {t('scan_with_webcam')}
                    </button>
                  )}
                  <button onClick={() => fileRef.current?.click()} className="flex items-center gap-1 rounded-md border border-slate-300 px-2 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-100">
                    <UploadCloud className="h-3.5 w-3.5" /> {t('upload')}
                  </button>
                  <input type="file" ref={fileRef} onChange={handleUpload} accept="image/*" className="hidden" />
                </div>
              </div>
              <div className="flex min-h-[190px] items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50">
                {documentImage ? (
                  <img src={documentImage} alt={t('document_scan')} className="max-h-[190px] rounded object-contain" />
                ) : docCamOn ? (
                  <CameraCapture onCapture={(b64) => { setDocumentImage(b64); setUploadName('Webcam capture'); setActivePreset(null); setResult(null); setRecordId(null); setDocCamOn(false); }} onCancel={() => setDocCamOn(false)} className="py-4" />
                ) : (
                  <p className="px-4 text-center text-sm text-slate-400">{t('select_scenario_hint')}</p>
                )}
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-600"><Camera className="mr-1.5 inline h-3.5 w-3.5 text-emerald-600" />{t('live_passenger')}</span>
                {liveImage && (
                  <Button variant="secondary" className="!px-2 !py-1 text-xs" onClick={() => setLiveImage(null)}>
                    <Camera className="h-3.5 w-3.5" /> {t('retake')}
                  </Button>
                )}
              </div>
              <div className="flex min-h-[190px] items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50">
                {liveImage ? (
                  <img src={liveImage} alt={t('passenger_face')} className="max-h-[190px] rounded object-contain" />
                ) : documentImage ? (
                  <div className="w-full px-4 py-3">
                    <BiometricVerification documentImageB64={documentImage} onComplete={handleGuidedVerify} compact />
                    <button onClick={() => liveFileRef.current?.click()} className="mt-2 w-full text-xs font-semibold text-navy-700 hover:underline">
                      {t('upload_photo')} / {t('scan_with_webcam')}
                    </button>
                  </div>
                ) : (
                  <div className="w-full px-4 py-3 text-center">
                    <CameraCapture onCapture={(b64) => { setLiveImage(b64); if (result) runScreening(b64); }} className="mx-auto mb-1" />
                    <button onClick={() => liveFileRef.current?.click()} className="text-xs font-semibold text-navy-700 hover:underline">{t('upload_photo')}</button>
                    <p className="mt-1 text-xs text-slate-400">{t('face_optional')}</p>
                  </div>
                )}
              </div>
              <input type="file" ref={liveFileRef} accept="image/*" className="hidden" onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) {
                  const r = new FileReader();
                  r.onload = (ev) => setLiveImage(ev.target?.result);
                  r.readAsDataURL(f);
                }
              }} />
            </div>
          </div>

          <button onClick={() => setShowMrz(!showMrz)} className="mb-2 flex items-center gap-1.5 text-xs font-bold text-navy-700 hover:underline">
            {showMrz ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            {showMrz ? t('hide') : t('show')} {t('raw_mrz_string')}
          </button>
          {showMrz && (
            <textarea rows={3} value={mrzText} onChange={(e) => setMrzText(e.target.value)}
              placeholder="MRZ Line 1&#10;MRZ Line 2" className="mb-4 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-xs focus:border-navy-500 focus:outline-none" />
          )}

          <div className="flex items-center justify-end gap-3 border-t border-slate-200 pt-4">
            <div className="mr-auto text-xs text-slate-400">
              {result ? 'Screening completed — advance to review.' : 'Run the AI pipeline to start the guided review.'}
            </div>
            <Button onClick={() => runScreening()} loading={loading}>
              <Scan className="h-4 w-4" /> {loading ? 'Running AI screening…' : 'Run AI Screening'}
            </Button>
          </div>
        </StepCard>
      )}

      {step >= 1 && (
        <StepCard step={2} title="Information" desc="Extracted document fields from OCR and MRZ. Cross-validation between the visual zone and MRZ." id="step-info">
          {!result ? (
            <Placeholder text="Run the screening to extract document information." />
          ) : (
            <div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                <InfoRow label="Full name" value={mrz.full_name || viz.full_name} />
                <InfoRow label="Document number" value={mrz.document_number || viz.document_number} tone="mono" />
                <InfoRow label="Document type" value={`${mrz.document_type || ''} (${mrz.format || ''})`.trim()} />
                <InfoRow label="Nationality" value={mrz.nationality || viz.nationality} />
                <InfoRow label="Date of birth" value={mrz.date_of_birth || viz.date_of_birth} />
                <InfoRow label="Date of expiry" value={mrz.date_of_expiry || viz.date_of_expiry} />
                <InfoRow label="Sex" value={mrz.sex || viz.sex} />
                <InfoRow label="MRZ checksums" value={mrz.checksums?.overall_valid ? 'Valid' : 'Invalid'} tone={mrz.checksums?.overall_valid ? undefined : 'fail'} />
                <InfoRow label="Document validity" value={docVal.is_valid ? 'Valid' : 'Discrepancies found'} tone={docVal.is_valid ? undefined : 'warn'} />
                <InfoRow label="Expiration" value={docVal.is_expired ? 'EXPIRED' : 'Valid'} tone={docVal.is_expired ? 'fail' : undefined} />
              </div>
              {mrz.checksums && (
                <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <div className="mb-2 text-xs font-bold text-slate-600">ICAO 9303 check digits</div>
                  <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                    {Object.entries(mrz.checksums).filter(([k]) => k !== 'overall_valid').map(([ck, cv]) => (
                      <div key={ck} className={cx('flex items-center justify-between rounded-md border px-3 py-1.5 text-xs', cv.valid ? 'border-emerald-200 bg-emerald-50' : 'border-red-200 bg-red-50')}>
                        <span className="font-semibold text-slate-700">{ck.replace(/_/g, ' ')}</span>
                        <span className="font-mono text-slate-600">extracted {cv.extracted} · calc {cv.calculated} {cv.valid ? '✓' : '✗'}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {docVal.discrepancies?.length > 0 && (
                <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                  <strong>Discrepancies flagged:</strong>
                  <ul className="mt-1 list-inside list-disc space-y-0.5">
                    {docVal.discrepancies.map((d, i) => (
                      <li key={i}>{d.description || `${d.field} (${d.category})`}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </StepCard>
      )}

      {step >= 2 && (
        <StepCard step={3} title="Face analysis" desc="One-to-one biometric comparison of the document portrait against the passenger." id="step-face">
          {!result ? (
            <Placeholder text="Run the screening to compare faces." />
          ) : (
            <div>
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg border border-slate-200 p-3">
                  <p className="mb-2 text-xs font-bold text-slate-500">Document portrait</p>
                  <div className="flex min-h-[160px] items-center justify-center rounded-lg bg-slate-50">
                    {forensics?.visuals?.original || documentImage ? (
                      <img src={forensics?.visuals?.original || documentImage} alt="Document portrait" className="max-h-[160px] rounded object-contain" />
                    ) : (
                      <p className="text-sm text-slate-400">No document image</p>
                    )}
                  </div>
                </div>
                <div className="rounded-lg border border-slate-200 p-3">
                  <p className="mb-2 text-xs font-bold text-slate-500">Passenger</p>
                  <div className="flex min-h-[160px] items-center justify-center rounded-lg bg-slate-50">
                    {liveImage ? (
                      <img src={liveImage} alt="Passenger face" className="max-h-[160px] rounded object-contain" />
                    ) : (
                      <p className="text-sm text-slate-400">No capture provided</p>
                    )}
                  </div>
                </div>
              </div>

              {bio.biometric_available === false && (
                <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                  <strong>Biometric verification NOT AVAILABLE.</strong> No live passenger capture was provided, so the engine performed a document-only screening. Face match and liveness results are suppressed.
                </div>
              )}

              <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
                <div className="rounded-lg border border-slate-200 px-4 py-3">
                  <div className="text-xs font-semibold text-slate-500">Match score</div>
                  {bio.biometric_available !== false ? (
                    <div className="text-xl font-extrabold">{bio.match_score != null ? `${bio.match_score}%` : 'No comparison'}</div>
                  ) : (
                    <div className="text-xl font-extrabold text-slate-400">Not available</div>
                  )}
                </div>
                <div className="rounded-lg border border-slate-200 px-4 py-3">
                  <div className="text-xs font-semibold text-slate-500">Liveness</div>
                  {bio.biometric_available !== false ? (
                    <div className="text-xl font-extrabold">{bio.liveness ? (bio.liveness.is_live ? 'Live' : 'Failed') : 'No capture'}</div>
                  ) : (
                    <div className="text-xl font-extrabold text-slate-400">Not available</div>
                  )}
                </div>
                <div className="rounded-lg border border-slate-200 px-4 py-3">
                  <div className="text-xs font-semibold text-slate-500">Confidence</div>
                  {bio.biometric_available !== false ? (
                    <div className="text-xl font-extrabold">{bio.confidence != null ? bio.confidence : '—'}</div>
                  ) : (
                    <div className="text-xl font-extrabold text-slate-400">Not available</div>
                  )}
                </div>
              </div>

              {bio.biometric_available !== false && bio.liveness && (
                <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <div className="mb-2 text-xs font-bold text-slate-600">Anti-spoofing & presentation attack defense</div>
                  <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-3">
                    <div className="flex items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-xs">
                      <span className="text-slate-500">Liveness score</span>
                      <span className="font-bold text-slate-800">{bio.liveness.liveness_score != null ? `${bio.liveness.liveness_score}%` : '—'}</span>
                    </div>
                    <div className="flex items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-xs">
                      <span className="text-slate-500">Screen moiré</span>
                      <span className={bio.liveness.moire_artifact_detected ? 'font-bold text-red-600' : 'font-bold text-emerald-600'}>
                        {bio.liveness.moire_artifact_detected ? 'Detected' : 'None'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-xs">
                      <span className="text-slate-500">Sharpness index</span>
                      <span className="font-bold text-slate-800">{bio.liveness.sharpness_index ?? '—'}</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-4 flex items-center justify-end gap-3">
                {liveImage ? (
                  <Button variant="secondary" onClick={() => setLiveImage(null)}><Camera className="h-4 w-4" /> Capture new face & re-run</Button>
                ) : (
                  <CameraCapture onCapture={(b64) => { setLiveImage(b64); runScreening(b64); }} className="mx-auto" />
                )}
                <Button onClick={() => setStep(3)}>Continue <ArrowRight className="h-4 w-4" /></Button>
              </div>
            </div>
          )}
        </StepCard>
      )}

      {step >= 3 && (
        <StepCard step={4} title="Analysis" desc="Module-by-module screening summary. Technical evidence is available in the details view." id="step-analysis">
          {!result ? (
            <Placeholder text="Run the screening to view the analysis." />
          ) : (
            <div>
              <ul className="space-y-2">
                {checks.map((c) => (
                  <li key={c.name} className="flex items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                    {verifyIcon(c.state)}
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-slate-800">{c.name}</div>
                      <div className="text-xs text-slate-500">{c.desc}</div>
                    </div>
                    <Badge color={c.state === 'pass' ? 'green' : c.state === 'warn' ? 'amber' : 'red'}>
                      {c.state === 'pass' ? 'Passed' : c.state === 'warn' ? 'Review' : 'Failed'}
                    </Badge>
                  </li>
                ))}
              </ul>

              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {compKeys.map(({ label, key }) => (
                  <div key={key} className="rounded-lg border border-slate-200 px-3 py-2.5">
                    <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500">
                      <span>{label}</span><span>{risk.component_scores?.[key] ?? 0}%</span>
                    </div>
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full rounded-full bg-navy-700" style={{ width: `${risk.component_scores?.[key] ?? 0}%` }} />
                    </div>
                  </div>
                ))}
              </div>

              <button onClick={() => setShowTechnical(!showTechnical)} className="mt-4 flex items-center gap-1.5 text-xs font-bold text-navy-700 hover:underline">
                {showTechnical ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                {showTechnical ? 'Hide' : 'View'} technical forensics detail
              </button>

              {showTechnical && result?.forensics?.visuals && (
                <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {Object.entries(result.forensics.visuals).filter(([k]) => k !== 'original' && result.forensics.visuals[k]).slice(0, 4).map(([k, v]) => (
                    <figure key={k} className="rounded-lg border border-slate-200 p-2">
                      <img src={v} alt={k} className="w-full rounded object-contain" />
                      <figcaption className="mt-1 text-center text-[10px] font-semibold uppercase text-slate-400">{k.replace(/_/g, ' ')}</figcaption>
                    </figure>
                  ))}
                </div>
              )}

              {showTechnical && (
                <div className="mt-3 space-y-2 text-sm">
                  <InfoRow label="ELA score" value={`${Number(forensics.ela_score ?? 0).toFixed(1)}%`} />
                  <InfoRow label="Noise discrepancy" value={`${Number(forensics.noise_discrepancy_score ?? 0).toFixed(1)}%`} />
                  <InfoRow label="Photo tamper score" value={`${Number(forensics.photo_tamper_score ?? 0).toFixed(1)}%`} />
                  <InfoRow label="Metadata tamper" value={`${Number(forensics.metadata_tamper_score ?? 0).toFixed(1)}%`} />
                  <InfoRow label="Noise anomaly blocks" value={forensics.noise_anomalies_count != null ? String(forensics.noise_anomalies_count) : '—'} />
                  <InfoRow label="Suspicious splicing regions" value={forensics.suspicious_bboxes?.length != null ? String(forensics.suspicious_bboxes.length) : '—'} />
                  {forensics.detected_software?.length > 0 && (
                    <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-amber-900">
                      Editing software detected: {forensics.detected_software.join(', ')}
                    </div>
                  )}
                </div>
              )}

              <div className="mt-5 flex justify-end border-t border-slate-200 pt-4">
                <Button onClick={() => setStep(4)}>Continue to result <ArrowRight className="h-4 w-4" /></Button>
              </div>
            </div>
          )}
        </StepCard>
      )}

      {step === 4 && result && (
        <Card className="overflow-hidden">
          <div className={cx('p-5', meta.color === 'green' && 'border-t-4 border-emerald-500', meta.color === 'amber' && 'border-t-4 border-amber-500', meta.color === 'orange' && 'border-t-4 border-orange-500', meta.color === 'red' && 'border-t-4 border-red-600')}>
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
              <div className="flex items-center gap-4">
                <div className={cx('flex h-16 w-16 items-center justify-center rounded-full text-white', meta.color === 'green' ? 'bg-emerald-600' : meta.color === 'amber' ? 'bg-amber-500' : meta.color === 'orange' ? 'bg-orange-500' : 'bg-red-600')}>
                  {meta.color === 'green' ? <CheckCircle2 className="h-8 w-8" /> : <ShieldCheck className="h-8 w-8" />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-extrabold text-slate-900">{meta.label}</h2>
                    <Badge color={meta.color}>{risk.risk_tier} · {risk.overall_risk_score}%</Badge>
                  </div>
                  <p className="mt-0.5 text-sm text-slate-500">{risk.recommended_decision}</p>
                </div>
              </div>
              <div className="text-left md:text-right">
                <div className="text-xs font-semibold uppercase text-slate-400">Composite risk score</div>
                <div className="text-3xl font-black text-slate-900">{risk.overall_risk_score}<span className="text-lg text-slate-400">%</span></div>
              </div>
            </div>

            {risk.action_summary && (
              <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                <strong className="text-slate-800">Recommendation:</strong> {risk.action_summary}
              </div>
            )}

            {risk.risk_factors?.length > 0 && (
              <div className="mt-4">
                <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">Reasons for this decision</p>
                <ul className="space-y-1.5">
                  {risk.risk_factors.map((f, i) => (
                    <li key={i} className="flex items-start justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
                      <span className="text-slate-700">
                        <span className="font-bold text-slate-900">{f.module}:</span> {f.description}
                      </span>
                      {f.impact && <span className="shrink-0 text-xs font-bold text-slate-500">{f.impact}</span>}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {watch.flagged && (
              <div className="critical-flicker mt-4 flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-bold text-white">
                <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>WATCHLIST ALERT — {watch.highest_severity} severity. {(watch.alerts || []).map((a) => a.reason).join(' ')}</span>
              </div>
            )}

            {risk.risk_tier === 'CRITICAL' && !watch.flagged && (
              <div className="critical-flicker mt-4 flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-bold text-white">
                <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>CRITICAL — {risk.overall_risk_score}% composite risk. {risk.recommended_decision}</span>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 border-t border-slate-200 bg-slate-50 px-5 py-4">
            <span className="mr-auto text-xs font-semibold text-slate-500 flex items-center gap-1.5">
              <Lock className="h-3.5 w-3.5" /> Officer action:
            </span>
            <Button variant="success" onClick={() => takeAction('approved')} disabled={!!officerStatus}>
              <CheckCircle2 className="h-4 w-4" /> Verify & clear
            </Button>
            <Button variant="secondary" onClick={() => takeAction('review')} disabled={!!officerStatus}>
              Send to secondary
            </Button>
            <Button variant="danger" onClick={() => takeAction('escalated')} disabled={!!officerStatus}>
              Escalate / detain
            </Button>
            <Button variant="secondary" onClick={() => setShowReport(true)}><KeyRound className="h-4 w-4" /> Audit report</Button>
          </div>
          {officerStatus && (
            <div className="flex items-center justify-between gap-3 border-t border-slate-100 px-5 py-3">
              <span className="text-sm text-slate-600">
                Case recorded as <strong>{officerStatus === 'approved' ? 'Verified & cleared' : officerStatus === 'review' ? 'Sent to secondary inspection' : 'Escalated / detain'}</strong>.
              </span>
              <Button variant="secondary" onClick={() => { setResult(null); setRecordId(null); setOfficerStatus(null); setStep(0); setActivePreset(null); setDocumentImage(null); setLiveImage(null); setMrzText(''); }}>
                <RefreshCw className="h-4 w-4" /> New screening
              </Button>
            </div>
          )}
        </Card>
      )}

      {step >= 1 && step < 4 && result && (
        <div className="flex justify-end">
          <Button variant="secondary" onClick={() => setStep(step + 1)}>
            Continue to {t(STEPS[step + 1])} <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      <NewPassengerModal
        isOpen={showRegister}
        onClose={() => setShowRegister(false)}
        onPassengerCreated={(passenger, screeningResult) => {
          const rc = addToHistory(screeningResult, { source: 'live', scenario: `${passenger.holder_name} (registered)` });
          setResult(screeningResult);
          setRecordId(rc.id);
          setDocumentImage(screeningResult?.extracted_data?.document_image_b64 || documentImage);
          setLiveImage(screeningResult?.extracted_data?.live_passenger_b64 || liveImage);
          setActivePreset(null);
          setUploadName(passenger.holder_name);
          applyFocus();
        }}
      />

      {showReport && <AuditReport screening={result} onClose={() => setShowReport(false)} />}
    </div>
  );
}

function Placeholder({ text }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-400">
      <FlaskConical className="h-4 w-4 shrink-0" /> {text}
    </div>
  );
}