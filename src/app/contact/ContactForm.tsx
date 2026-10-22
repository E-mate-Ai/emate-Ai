'use client';

import { useActionState, useEffect, useRef } from 'react';
import { submitContactForm, type ContactFormState } from './actions';
import { Send, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

const initialState: ContactFormState = { success: false, message: '' };

const subjects = [
  'Account & Billing',
  'Technical Support',
  'University / Institutional Partnership',
  'Feature Request',
  'Bug Report',
  'Privacy / Data Request',
  'Other',
];

export default function ContactForm() {
  const [state, formAction, isPending] = useActionState(submitContactForm, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
    }
  }, [state.success]);

  return (
    <div className="mt-10">
      <div className="mb-5 flex items-center gap-2">
        <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
        <span className="text-xs font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 px-2">
          Send a Message
        </span>
        <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
      </div>

      {/* Success Banner */}
      {state.success && (
        <div
          role="alert"
          className="mb-6 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-800/50 dark:bg-emerald-950/40"
        >
          <CheckCircle2 className="mt-0.5 flex-shrink-0 text-emerald-600 dark:text-emerald-400" size={18} />
          <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300">{state.message}</p>
        </div>
      )}

      {/* Error Banner */}
      {!state.success && state.message && !state.errors && (
        <div
          role="alert"
          className="mb-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 dark:border-red-800/50 dark:bg-red-950/40"
        >
          <AlertCircle className="mt-0.5 flex-shrink-0 text-red-600 dark:text-red-400" size={18} />
          <p className="text-sm font-medium text-red-800 dark:text-red-300">{state.message}</p>
        </div>
      )}

      <form ref={formRef} action={formAction} noValidate>
        {/* Honeypot — hidden from real users, bots fill it */}
        <input type="text" name="_hp" tabIndex={-1} aria-hidden="true" className="hidden" />

        <div className="grid gap-5 sm:grid-cols-2">
          {/* Name */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="contact-name" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              Full Name <span className="text-red-500" aria-hidden="true">*</span>
            </label>
            <input
              id="contact-name"
              type="text"
              name="name"
              autoComplete="name"
              required
              placeholder="Your full name"
              className={`rounded-xl border px-4 py-3 text-sm bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 outline-none transition focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 dark:focus:border-blue-400 ${
                state.errors?.name
                  ? 'border-red-400 dark:border-red-600'
                  : 'border-zinc-200 dark:border-zinc-700'
              }`}
            />
            {state.errors?.name && (
              <p className="text-xs text-red-600 dark:text-red-400">{state.errors.name}</p>
            )}
          </div>

          {/* Email */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="contact-email" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              Email Address <span className="text-red-500" aria-hidden="true">*</span>
            </label>
            <input
              id="contact-email"
              type="email"
              name="email"
              autoComplete="email"
              required
              placeholder="you@example.com"
              className={`rounded-xl border px-4 py-3 text-sm bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 outline-none transition focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 dark:focus:border-blue-400 ${
                state.errors?.email
                  ? 'border-red-400 dark:border-red-600'
                  : 'border-zinc-200 dark:border-zinc-700'
              }`}
            />
            {state.errors?.email && (
              <p className="text-xs text-red-600 dark:text-red-400">{state.errors.email}</p>
            )}
          </div>

          {/* Subject */}
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <label htmlFor="contact-subject" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              Subject <span className="text-red-500" aria-hidden="true">*</span>
            </label>
            <select
              id="contact-subject"
              name="subject"
              required
              className={`rounded-xl border px-4 py-3 text-sm bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 outline-none transition focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 dark:focus:border-blue-400 ${
                state.errors?.subject
                  ? 'border-red-400 dark:border-red-600'
                  : 'border-zinc-200 dark:border-zinc-700'
              }`}
            >
              <option value="">Select a subject…</option>
              {subjects.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            {state.errors?.subject && (
              <p className="text-xs text-red-600 dark:text-red-400">{state.errors.subject}</p>
            )}
          </div>

          {/* Message */}
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <label htmlFor="contact-message" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              Message <span className="text-red-500" aria-hidden="true">*</span>
            </label>
            <textarea
              id="contact-message"
              name="message"
              rows={5}
              required
              placeholder="Describe your question or issue in detail…"
              className={`rounded-xl border px-4 py-3 text-sm bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 outline-none transition focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 dark:focus:border-blue-400 resize-y min-h-[120px] ${
                state.errors?.message
                  ? 'border-red-400 dark:border-red-600'
                  : 'border-zinc-200 dark:border-zinc-700'
              }`}
            />
            {state.errors?.message && (
              <p className="text-xs text-red-600 dark:text-red-400">{state.errors.message}</p>
            )}
          </div>
        </div>

        <div className="mt-6 flex items-center gap-4">
          <button
            id="contact-submit-btn"
            type="submit"
            disabled={isPending}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-blue-600 px-7 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed min-h-[44px]"
          >
            {isPending ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                Sending…
              </>
            ) : (
              <>
                <Send size={15} />
                Send Message
              </>
            )}
          </button>
          <p className="text-xs text-zinc-400 dark:text-zinc-500">
            We respond within 24 hours (Mon–Sat).
          </p>
        </div>
      </form>
    </div>
  );
}
