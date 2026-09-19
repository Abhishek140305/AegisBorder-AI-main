import React, { useState, useRef } from 'react';
import {
  UserPlus, UploadCloud, AlertTriangle, CheckCircle2,
  FileText, User, Calendar, Globe, Hash, AlertOctagon, Shield
} from 'lucide-react';
import { Badge, Button } from './ui';
import CameraCapture from './CameraCapture';

const SCENARIOS = [
  { id: 'none', label: 'Authentic / Clean', desc: 'Valid ICAO check digits, intact photo forensics, clean watchlist', icon: CheckCircle2, color: 'green' },
  { id: 'tamper_photo', label: 'Photo Tampering', desc: 'Simulates portrait edge discontinuity and compression noise (ELA trigger)', icon: AlertTriangle, color: 'orange' },
  { id: 'tamper_checksum', label: 'Checksum Forgery', desc: 'Alters MRZ check digit algorithm to simulate counterfeit printing', icon: AlertOctagon, color: 'amber' },
  { id: 'tamper_text', label: 'DOB Cross-Mismatch', desc: 'Printed visual zone date differs from encoded MRZ security string', icon: FileText, color: 'blue' },
  { id: 'watchlist', label: 'Interpol Red Notice', desc: 'Matches transnational crime and border denial intelligence database', icon: Shield, color: 'red' },
];

const COMMON_COUNTRIES = ['USA', 'IND', 'GBR', 'DEU', 'FRA', 'CAN'];

const QUICK_TEMPLATES = [
  { title: 'Diplomat / Frequent Traveler', holder_name: 'AMARA K. SEN', doc_number: 'D90124881', nationality: 'IND', dob: '1987-11-20', expiry: '2034-11-19', sex: 'Female', document_type: 'Passport', tamper_scenario: 'none', notes: 'Diplomatic passport holder. Clean biometrics and verified records.' },
  { title: 'Photo Replacement Suspect', holder_name: 'JONAS VOGEL', doc_number: 'P55410982', nationality: 'DEU', dob: '1990-03-08', expiry: '2030-03-07', sex: 'Male', document_type: 'Passport', tamper_scenario: 'tamper_photo', notes: 'Physical photo altered with cut border artifact to test ELA forensics.' },
  { title: 'Counterfeit Schengen Visa', holder_name: 'FARHAN AL-MANSOUR', doc_number: 'V88102394', nationality: 'ARE', dob: '1994-09-15', expiry: '2028-09-14', sex: 'Male', document_type: 'Visa', tamper_scenario: 'tamper_checksum', notes: 'Type-C Visa with corrupted check digit algorithm.' },
  { title: 'Identity Concealment (DOB Fraud)', holder_name: 'CLAIRE BEAUCHAMP', doc_number: 'F77201948', nationality: 'FRA', dob: '1982-05-19', expiry: '2031-05-18', sex: 'Female', document_type: 'Passport', tamper_scenario: 'tamper_text', notes: 'Visual zone shows different birth year than embedded MRZ digits.' },
  { title: 'Transnational Watchlist Match', holder_name: 'MARCO ALVAREZ', doc_number: 'E10948291', nationality: 'COL', dob: '1982-11-04', expiry: '2029-11-03', sex: 'Male', document_type: 'Passport', tamper_scenario: 'watchlist', notes: 'Exact watchlist match. For demonstration this target is simulated.' },
];

const fieldCls = 'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-navy-500 focus:outline-none focus:ring-1 focus:ring-navy-700';
const labelCls = 'mb-1 block text-xs font-semibold text-slate-600';

export default function NewPassengerModal({ isOpen, onClose, onPassengerCreated }) {
  const [activeMode, setActiveMode] = useState('form');
  const [formData, setFormData] = useState({
    holder_name: '', doc_number: '', nationality: 'USA', dob: '1992-06-15',
    expiry: '2032-06-14', sex: 'Male', document_type: 'Passport',
    tamper_scenario: 'none', notes: '', mrz_raw: ''
  });
  const [documentImage, setDocumentImage] = useState(null);
  const [liveImage, setLiveImage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const docInputRef = useRef(null);
  const faceInputRef = useRef(null);

  if (!isOpen) return null;

  const handleUpload = (e, setter) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => setter(event.target?.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!formData.holder_name.trim() || !formData.doc_number.trim()) {
      setErrorMsg('Please enter passenger full name and document number.');
      return;
    }
    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        holder_name: formData.holder_name.toUpperCase().trim(),
        doc_number: formData.doc_number.toUpperCase().trim(),
        document_image_b64: documentImage,
        live_passenger_b64: liveImage
      };
      const res = await fetch('/api/passengers/new', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.detail || 'Failed to register new passenger.');
      onPassengerCreated(data.passenger, data.screening_result);
      onClose();
    } catch (err) {
      setErrorMsg(err.message || 'An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true" aria-label="Register new passenger">
      <div className="fixed inset-0 bg-navy-950/60" aria-hidden="true" onClick={onClose} />
      <div className="relative z-10 mx-auto my-6 w-full max-w-4xl rounded-xl bg-white shadow-2xl border border-slate-200">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-navy-50 text-navy-800">
              <UserPlus className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">Register New Passenger</h2>
                <Badge color="blue">IRL TESTING</Badge>
              </div>
              <p className="text-xs text-slate-500">Create test cases, upload custom documents, or capture passenger faces</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="rounded-lg border border-slate-300 bg-slate-100 p-1 text-xs">
              <button type="button" onClick={() => setActiveMode('form')}
                className={`rounded-md px-3 py-1 font-semibold ${activeMode === 'form' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>
                Custom Entry
              </button>
              <button type="button" onClick={() => setActiveMode('templates')}
                className={`rounded-md px-3 py-1 font-semibold ${activeMode === 'templates' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>
                Quick Templates
              </button>
            </div>
            <button onClick={onClose} aria-label="Close" className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100">✕</button>
          </div>
        </div>

        <div className="max-h-[72vh] overflow-y-auto px-6 py-5">
          {errorMsg && (
            <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
              <AlertTriangle className="h-4 w-4 shrink-0" /> {errorMsg}
            </div>
          )}

          {activeMode === 'templates' && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {QUICK_TEMPLATES.map((tmpl, idx) => (
                <button key={idx} type="button" onClick={() => { setFormData({ ...formData, ...tmpl }); setActiveMode('form'); }}
                  className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-left hover:border-navy-300 hover:bg-navy-50">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-slate-900">{tmpl.title}</span>
                    <Badge color="slate">{tmpl.nationality}</Badge>
                  </div>
                  <div className="mt-1 font-mono text-xs font-bold text-navy-700">{tmpl.holder_name}</div>
                  <p className="mt-1 line-clamp-2 text-xs text-slate-500">{tmpl.notes}</p>
                </button>
              ))}
            </div>
          )}

          {activeMode === 'form' && (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="rounded-lg border border-slate-200 p-4">
                  <label className={labelCls}>Document Image (optional)</label>
                  <div className="mt-2 flex min-h-[130px] items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50">
                    {documentImage ? (
                      <div className="flex flex-col items-center gap-2">
                        <img src={documentImage} alt="Custom Document" className="max-h-[110px] rounded object-contain" />
                        <button type="button" onClick={() => setDocumentImage(null)} className="text-xs text-red-600 underline">Remove</button>
                      </div>
                    ) : (
                      <button type="button" onClick={() => docInputRef.current?.click()} className="p-4 text-center text-slate-500">
                        <UploadCloud className="mx-auto mb-1 h-7 w-7" />
                        <span className="text-sm font-medium text-slate-700">Click to upload document scan</span>
                        <span className="block text-xs text-slate-400">JPG, PNG, WebP up to 10MB</span>
                      </button>
                    )}
                  </div>
                  <input type="file" ref={docInputRef} onChange={(e) => handleUpload(e, setDocumentImage)} accept="image/*" className="hidden" />
                </div>

                <div className="rounded-lg border border-slate-200 p-4">
                  <div className="flex items-center justify-between">
                    <label className={labelCls} style={{ marginBottom: 0 }}>Passenger face / photo (optional)</label>
                  </div>
                  <div className="mt-2 flex min-h-[130px] items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50">
                    {liveImage ? (
                      <div className="flex flex-col items-center gap-2">
                        <img src={liveImage} alt="Passenger photo" className="max-h-[110px] rounded object-contain" />
                        <button type="button" onClick={() => setLiveImage(null)} className="text-xs text-red-600 underline">Remove</button>
                      </div>
                    ) : (
                      <div className="py-3 text-center">
                        <CameraCapture onCapture={setLiveImage} />
                        <button type="button" onClick={() => faceInputRef.current?.click()} className="mt-1 text-xs font-semibold text-navy-700 hover:underline">Upload portrait photo</button>
                      </div>
                    )}
                  </div>
                  <input type="file" ref={faceInputRef} onChange={(e) => handleUpload(e, setLiveImage)} accept="image/*" className="hidden" />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
                <div className="sm:col-span-2">
                  <label className={labelCls}>Full legal name (SURNAME Given Names) *</label>
                  <div className="relative">
                    <input type="text" required placeholder="e.g. MARTINEZ CARLOS ENRIQUE" value={formData.holder_name}
                      onChange={(e) => setFormData({ ...formData, holder_name: e.target.value })} className={fieldCls} />
                    <User className="absolute right-3 top-2.5 h-4 w-4 text-slate-400" />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Document type</label>
                  <select value={formData.document_type} onChange={(e) => setFormData({ ...formData, document_type: e.target.value })} className={fieldCls}>
                    <option value="Passport">Passport (TD3)</option>
                    <option value="Visa">Visa / Permit (TD2)</option>
                    <option value="ID Card">National Identity Card</option>
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Document number *</label>
                  <div className="relative">
                    <input type="text" required placeholder="e.g. P98712344" value={formData.doc_number}
                      onChange={(e) => setFormData({ ...formData, doc_number: e.target.value })} className={fieldCls} />
                    <Hash className="absolute right-3 top-2.5 h-4 w-4 text-slate-400" />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Nationality (ICAO code)</label>
                  <div className="relative">
                    <input type="text" maxLength={3} placeholder="USA" value={formData.nationality}
                      onChange={(e) => setFormData({ ...formData, nationality: e.target.value.toUpperCase() })} className={fieldCls} />
                    <Globe className="absolute right-3 top-2.5 h-4 w-4 text-slate-400" />
                  </div>
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {COMMON_COUNTRIES.map((c) => (
                      <button key={c} type="button" onClick={() => setFormData({ ...formData, nationality: c })}
                        className={`rounded border px-1.5 py-0.5 text-[10px] font-semibold ${formData.nationality === c ? 'border-navy-800 bg-navy-50 text-navy-700' : 'border-slate-300 text-slate-500'}`}>
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Gender / sex</label>
                  <select value={formData.sex} onChange={(e) => setFormData({ ...formData, sex: e.target.value })} className={fieldCls}>
                    <option value="Male">Male (M)</option>
                    <option value="Female">Female (F)</option>
                    <option value="Other">Unspecified</option>
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Date of birth</label>
                  <div className="relative">
                    <input type="date" value={formData.dob} onChange={(e) => setFormData({ ...formData, dob: e.target.value })} className={fieldCls} />
                    <Calendar className="pointer-events-none absolute right-3 top-2.5 h-4 w-4 text-slate-400" />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Date of expiry</label>
                  <input type="date" value={formData.expiry} onChange={(e) => setFormData({ ...formData, expiry: e.target.value })} className={fieldCls} />
                </div>
              </div>

              <div>
                <label className={labelCls}>Verification scenario (simulated)</label>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3">
                  {SCENARIOS.map((sc) => {
                    const Icon = sc.icon;
                    const selected = formData.tamper_scenario === sc.id;
                    return (
                      <button key={sc.id} type="button" onClick={() => setFormData({ ...formData, tamper_scenario: sc.id })}
                        className={`rounded-lg border p-3 text-left ${selected ? 'border-navy-800 bg-navy-50 ring-1 ring-navy-800' : 'border-slate-200 bg-slate-50 hover:border-slate-300'}`}>
                        <div className="flex items-center gap-2">
                          <Icon className={`h-4 w-4 ${selected ? 'text-navy-700' : 'text-slate-400'}`} />
                          <span className="text-xs font-bold text-slate-800">{sc.label}</span>
                        </div>
                        <p className="mt-1 text-[11px] leading-tight text-slate-500">{sc.desc}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className={labelCls}>Operator case notes (optional)</label>
                <input type="text" placeholder="e.g. Terminal gate 14 VIP clearance..." value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })} className={fieldCls} />
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-slate-200 pt-4">
                <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
                <Button type="submit" loading={isSubmitting}>
                  {isSubmitting ? 'Registering & running AI screening…' : 'Register & Run AI Screening'}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}