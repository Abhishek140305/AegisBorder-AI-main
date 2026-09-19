import { useState } from 'react';
import { LifeBuoy, User, Building2, AtSign, MessageSquare, Send, CheckCircle2, Mail, FileQuestion, Headset } from 'lucide-react';
import { PageHeading } from '../../components/PublicSite';

const CHANNELS = [
  { icon: FileQuestion, title: 'General enquiries', text: 'Questions about the platform, its capabilities and how the screening workflow works.' },
  { icon: Headset, title: 'Technical support', text: 'Issues using the secure portal — use the on-device Help guide in the portal for instant answers.' },
  { icon: Mail, title: 'Demonstrations', text: 'To see the screening modules in action, enter the secure portal and run the built-in test scenarios.' },
];

const FIELDS = [
  { id: 'fullname', label: 'Name', icon: User, type: 'text', required: true },
  { id: 'org', label: 'Organization', icon: Building2, type: 'text', required: false },
  { id: 'email', label: 'Email', icon: AtSign, type: 'email', required: true },
  { id: 'subject', label: 'Subject', icon: MessageSquare, type: 'text', required: true },
];

export default function Contact() {
  const [form, setForm] = useState({ fullname: '', org: '', email: '', subject: '', message: '' });
  const [errors, setErrors] = useState({});
  const [sent, setSent] = useState(false);

  const set = (id) => (e) => {
    setForm((f) => ({ ...f, [id]: e.target.value }));
    setErrors((er) => ({ ...er, [id]: undefined }));
  };

  const submit = (e) => {
    e.preventDefault();
    const er = {};
    if (!form.fullname.trim()) er.fullname = 'Enter your name.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email)) er.email = 'Enter a valid email address.';
    if (!form.subject.trim()) er.subject = 'Enter a subject.';
    if (!form.message.trim()) er.message = 'Enter a message.';
    setErrors(er);
    if (Object.keys(er).length === 0) setSent(true);
  };

  return (
    <div>
      <PageHeading
        eyebrow="Contact"
        title="Contact AegisBorder AI"
        sub="Questions, demonstrations, technical enquiries or general information."
      />

      <div className="mx-auto grid max-w-6xl gap-10 px-4 pb-16 lg:grid-cols-[0.9fr_1.1fr] lg:px-6">
        <div>
          <h2 className="text-lg font-extrabold tracking-tight text-navy-900">How we can help</h2>
          <div className="mt-5 space-y-4">
            {CHANNELS.map(({ icon: Icon, title, text }) => (
              <div key={title} className="flex gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-navy-50 text-navy-700">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <div>
                  <h3 className="text-sm font-extrabold text-navy-900">{title}</h3>
                  <p className="mt-1 text-xs leading-relaxed text-slate-500">{text}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-6 text-xs leading-relaxed text-slate-400">
            This is a demonstration platform. The enquiry form is a frontend placeholder and does
            not transmit contact details to any organization.
          </p>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
          {sent ? (
            <div className="flex min-h-[26rem] flex-col items-center justify-center p-8 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                <CheckCircle2 className="h-7 w-7" aria-hidden="true" />
              </span>
              <h2 className="mt-4 text-lg font-extrabold text-navy-900">Enquiry received</h2>
              <p className="mt-2 max-w-sm text-sm text-slate-500">
                Thank you, {form.fullname.split(' ')[0] || 'there'}. Your enquiry has been noted —
                this form is a demonstration only.
              </p>
              <button onClick={() => { setSent(false); setForm({ fullname: '', org: '', email: '', subject: '', message: '' }); }}
                className="mt-6 rounded-md border border-slate-300 px-4 py-2 text-sm font-bold text-slate-600 hover:border-navy-400 hover:text-navy-900">
                Send another enquiry
              </button>
            </div>
          ) : (
            <form onSubmit={submit} noValidate className="p-6 sm:p-8">
              <h2 className="text-lg font-extrabold tracking-tight text-navy-900">Submit an enquiry</h2>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                {FIELDS.map(({ id, label, icon: Icon, type, required }) => (
                  <div key={id}>
                    <label htmlFor={`c-${id}`} className="mb-1 block text-xs font-bold text-slate-600">
                      {label}{required && <span className="text-red-600" aria-hidden="true"> *</span>}
                    </label>
                    <div className="relative">
                      <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
                      <input
                        id={`c-${id}`} type={type} value={form[id]} onChange={set(id)}
                        aria-invalid={!!errors[id]} aria-describedby={errors[id] ? `e-${id}` : undefined}
                        className="w-full rounded-md border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 focus:border-navy-500 focus:outline-none focus:ring-2 focus:ring-navy-200"
                      />
                    </div>
                    {errors[id] && <p id={`e-${id}`} className="mt-1 text-xs font-semibold text-red-600">{errors[id]}</p>}
                  </div>
                ))}
                <div className="sm:col-span-2">
                  <label htmlFor="c-message" className="mb-1 block text-xs font-bold text-slate-600">
                    Message<span className="text-red-600" aria-hidden="true"> *</span>
                  </label>
                  <textarea
                    id="c-message" rows={6} value={form.message} onChange={set('message')}
                    aria-invalid={!!errors.message} aria-describedby={errors.message ? 'e-message' : undefined}
                    className="w-full rounded-md border border-slate-300 bg-white p-3 text-sm text-slate-900 focus:border-navy-500 focus:outline-none focus:ring-2 focus:ring-navy-200"
                  />
                  {errors.message && <p id="e-message" className="mt-1 text-xs font-semibold text-red-600">{errors.message}</p>}
                </div>
              </div>
              <button type="submit"
                className="mt-6 inline-flex items-center gap-2 rounded-md bg-navy-800 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-navy-900">
                <Send className="h-4 w-4" aria-hidden="true" /> Submit Enquiry
              </button>
                <p className="mt-3 flex items-start gap-1.5 text-[11px] leading-relaxed text-slate-400">
                  <LifeBuoy className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  Demonstration placeholder — nothing is transmitted.
                </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}