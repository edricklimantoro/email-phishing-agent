import { useState, useEffect, FormEvent } from 'react';
import { ImapSettings } from '../types';

interface Props {
  onBack: () => void;
}

export function SettingsPage({ onBack }: Props) {
  const [form, setForm] = useState<ImapSettings>({
    host: 'imap.gmail.com',
    port: 993,
    user: '',
    password: '',
    mailbox: 'INBOX',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    fetch('/api/settings')
      .then(r => r.json())
      .then(data => {
        setForm({
          host: data.host || 'imap.gmail.com',
          port: data.port || 993,
          user: data.user || '',
          password: data.password || '',
          mailbox: data.mailbox || 'INBOX',
        });
        setTimeout(() => setLoading(false), 200);
      })
      .catch(() => {
        setLoading(false);
        setMessage({ type: 'error', text: 'Failed to load current settings. Ensure the email-agent is running.' });
      });
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error('Save failed');
      setMessage({ type: 'success', text: 'IMAP settings saved. The agent will use the new credentials on the next poll cycle.' });
    } catch {
      setMessage({ type: 'error', text: 'Failed to save settings. Check that the email-agent service is running on port 8001.' });
    } finally {
      setSaving(false);
    }
  };

  const inputClass = "w-full rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] px-4 py-2.5 text-sm text-[var(--text-primary)] outline-none transition-all duration-200 placeholder:text-[var(--text-muted)] focus:border-[var(--accent-primary)] focus:ring-2 focus:ring-[var(--accent-primary)]/20 hover:border-[var(--text-muted)]";

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4 opacity-0 animate-fade-in">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-[var(--accent-primary)] border-t-transparent" />
          <p className="text-sm text-[var(--text-muted)]">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-8 py-10 animate-fade-in">
      {/* Back button + title */}
      <div className="mb-8 flex items-center gap-4 opacity-0 animate-slide-in">
        <button
          onClick={onBack}
          className="group flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-secondary)] transition-all duration-200 hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)] active:scale-95"
          aria-label="Back to dashboard"
        >
          <svg className="h-5 w-5 transition-transform duration-200 group-hover:-translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </button>
        <div>
          <h2 className="text-xl font-bold tracking-tight text-[var(--text-primary)]">IMAP Settings</h2>
          <p className="mt-1 text-sm text-[var(--text-muted)]">Configure the mailbox the security agent monitors</p>
        </div>
      </div>

      {/* Main card */}
      <div className="relative overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--bg-secondary)] p-8 opacity-0 animate-scale-in">
        {/* Decorative background elements */}
        <div className="pointer-events-none absolute -right-20 -top-20 h-40 w-40 rounded-full bg-[var(--color-grape-soda)]/10 transition-all duration-500 group-hover:scale-110" />
        <div className="pointer-events-none absolute -bottom-12 -left-12 h-28 w-28 rounded-full bg-[var(--color-blush-rose)]/8" />
        <div className="pointer-events-none absolute right-1/4 top-1/3 h-16 w-16 rounded-full bg-[var(--color-tangerine-dream)]/5" />

        <form onSubmit={handleSubmit} className="relative z-10 flex flex-col gap-6">
          {/* IMAP Host + Port */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="flex flex-col gap-1.5 md:col-span-2 opacity-0 animate-fade-in stagger-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]" htmlFor="host">IMAP Host</label>
              <div className="group relative">
                <input
                  id="host"
                  type="text"
                  value={form.host}
                  onChange={e => setForm({ ...form, host: e.target.value })}
                  className={inputClass + " transition-all duration-200 group-hover:border-[var(--text-muted)]"}
                />
                <div className="absolute inset-x-0 bottom-0 h-0.5 origin-left scale-x-0 rounded-full bg-[var(--accent-primary)] transition-transform duration-300 group-focus-within:scale-x-100" />
              </div>
            </div>
            <div className="flex flex-col gap-1.5 opacity-0 animate-fade-in stagger-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]" htmlFor="port">Port</label>
              <input
                id="port"
                type="number"
                value={form.port}
                onChange={e => setForm({ ...form, port: Number(e.target.value) })}
                className={inputClass}
              />
            </div>
          </div>

          {/* Mailbox */}
          <div className="flex flex-col gap-1.5 opacity-0 animate-fade-in stagger-3">
            <label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]" htmlFor="mailbox">Mailbox Folder</label>
            <input
              id="mailbox"
              type="text"
              value={form.mailbox}
              onChange={e => setForm({ ...form, mailbox: e.target.value })}
              className={inputClass}
            />
          </div>

          {/* Separator */}
          <div className="border-t border-[var(--border)] opacity-0 animate-fade-in stagger-4" />

          {/* Email */}
          <div className="flex flex-col gap-1.5 opacity-0 animate-fade-in stagger-4">
            <label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]" htmlFor="user">Gmail Address</label>
            <input
              id="user"
              type="email"
              value={form.user}
              onChange={e => setForm({ ...form, user: e.target.value })}
              required
              placeholder="you@gmail.com"
              className={inputClass}
            />
          </div>

          {/* App Password */}
          <div className="flex flex-col gap-1.5 opacity-0 animate-fade-in stagger-5">
            <label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]" htmlFor="password">App Password</label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                required
                placeholder="16-character app password"
                className={inputClass + " pr-12"}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] transition-all duration-200 hover:text-[var(--text-secondary)] active:scale-90"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
            <p className="text-xs text-[var(--text-muted)]">
              Use an App Password from Google Account &rarr; Security &rarr; 2-Step Verification &rarr; App Passwords
            </p>
          </div>

          {/* Status message */}
          {message && (
            <div
              className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-sm opacity-0 animate-scale-in ${
                message.type === 'success'
                  ? 'border-[var(--status-safe)]/30 bg-[var(--status-safe)]/10 text-[var(--status-safe)]'
                  : 'border-[var(--status-phishing)]/30 bg-[var(--status-phishing)]/10 text-[var(--status-phishing)]'
              }`}
            >
              {message.type === 'success' ? (
                <svg className="mt-0.5 h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ) : (
                <svg className="mt-0.5 h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
              <span>{message.text}</span>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={saving}
            className="group relative flex items-center justify-center gap-2 overflow-hidden rounded-xl bg-[var(--accent-primary)] px-6 py-3 text-sm font-semibold text-white transition-all duration-200 hover:bg-[var(--accent-hover)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
            {saving ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Saving...
              </>
            ) : (
              <>
                <svg className="h-4 w-4 transition-transform duration-200 group-hover:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                Save Settings
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
