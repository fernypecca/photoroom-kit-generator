'use client'

import { useState, useEffect, useRef, useId } from 'react'
import { CheckCircle2, Loader2 } from 'lucide-react'
import type { GeneratedKit } from '@/types'
import { track, EVENTS } from '@/lib/analytics'

// ─── Types ─────────────────────────────────────────────────────────────────────

interface EmailGateProps {
  /** The full generated kit — used to render the blurred background preview. */
  kit: GeneratedKit
  /** Called with the validated email when the user submits. Parent owns the API call. */
  onEmailSubmit: (email: string) => void
  /** True while the parent is calling /api/leads. Disables the button + shows spinner. */
  isSubmitting?: boolean
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** Truncate description to ~100 chars at a word boundary. */
function truncateDescription(text: string, max = 100): string {
  if (text.length <= max) return text
  const cut = text.slice(0, max)
  return cut.slice(0, cut.lastIndexOf(' ')) + '…'
}

/** CSS selector for all keyboard-focusable elements. */
const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'textarea:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ')

// ─── EmailGate component ───────────────────────────────────────────────────────

export function EmailGate({ kit, onEmailSubmit, isSubmitting = false }: EmailGateProps) {
  const [email, setEmail]   = useState('')
  const [error, setError]   = useState<string | null>(null)

  const modalRef  = useRef<HTMLDivElement>(null)
  const inputRef  = useRef<HTMLInputElement>(null)
  const headingId = useId()
  const errorId   = useId()

  // ── Analytics on mount ────────────────────────────────────────────────────
  useEffect(() => {
    track(EVENTS.EMAIL_GATE_SHOWN)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Focus management + focus trap ────────────────────────────────────────
  useEffect(() => {
    // Auto-focus the email input when the modal appears
    inputRef.current?.focus()

    function handleKeyDown(e: KeyboardEvent) {
      // Prevent Escape from doing anything — modal cannot be dismissed
      if (e.key === 'Escape') {
        e.preventDefault()
        return
      }

      // Focus trap: cycle through focusable elements inside the modal
      if (e.key !== 'Tab') return
      const modal = modalRef.current
      if (!modal) return

      const focusable = Array.from(modal.querySelectorAll<HTMLElement>(FOCUSABLE))
      if (focusable.length === 0) return

      const first = focusable[0]
      const last  = focusable[focusable.length - 1]

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault()
          last.focus()
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  // ── Submit handler ────────────────────────────────────────────────────────
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const trimmed = email.trim()
    if (!trimmed) {
      setError('Por favor ingresá tu email.')
      inputRef.current?.focus()
      return
    }
    if (!EMAIL_REGEX.test(trimmed)) {
      setError('Por favor ingresá un email válido.')
      inputRef.current?.focus()
      return
    }

    onEmailSubmit(trimmed.toLowerCase())
  }

  // ── Derived values for the blurred background ─────────────────────────────
  const previewImageUrl = kit.images[0]?.imageUrl ?? null
  const previewText     = truncateDescription(kit.copy.description)

  // ────────────────────────────────────────────────────────────────────────────

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">

      {/* ── Blurred kit preview (background) ──────────────────────────────── */}
      {/*
        aria-hidden: screen readers skip this — the content is decorative.
        The modal itself is the accessible entry point.
      */}
      <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
        {/* First kit image — large, centred, heavily blurred */}
        {previewImageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={previewImageUrl}
            alt=""
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[480px] max-w-[70vw] opacity-40 pointer-events-none select-none"
            style={{ filter: 'blur(8px)' }}
            draggable={false}
          />
        )}

        {/* Copy preview — blurred text below the image */}
        {previewText && (
          <p
            className="absolute bottom-[22%] left-1/2 -translate-x-1/2 w-[480px] max-w-[70vw] text-sm text-fg leading-relaxed opacity-40 pointer-events-none select-none text-center"
            style={{ filter: 'blur(4px)' }}
          >
            {previewText}
          </p>
        )}

        {/* Semi-transparent overlay that dims + soft-blurs the whole background */}
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
      </div>

      {/* ── Modal card ────────────────────────────────────────────────────── */}
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={headingId}
        className="relative z-10 w-full max-w-[440px] bg-background rounded-2xl shadow-2xl border border-border-subtle px-8 py-8 flex flex-col gap-5"
      >
        {/* Check icon */}
        <div className="flex justify-center">
          <CheckCircle2
            size={48}
            className="text-brand"
            strokeWidth={1.5}
            aria-hidden="true"
          />
        </div>

        {/* Headline + subheadline */}
        <div className="text-center flex flex-col gap-1.5">
          <h2
            id={headingId}
            className="text-2xl font-bold tracking-tight text-fg"
          >
            Tu kit está listo 🎉
          </h2>
          <p className="text-sm text-fg-muted">
            30 segundos bien invertidos — desbloqueá todo con tu email.
          </p>
        </div>

        {/* Divider */}
        <hr className="border-border-subtle" />

        {/* Email form */}
        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor={`${headingId}-email`}
              className="text-sm font-medium text-fg"
            >
              Tu email
            </label>

            <input
              ref={inputRef}
              id={`${headingId}-email`}
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                if (error) setError(null)
              }}
              disabled={isSubmitting}
              placeholder="tu@email.com"
              autoComplete="email"
              aria-describedby={error ? errorId : undefined}
              aria-invalid={!!error}
              className={[
                'h-11 w-full px-3.5 rounded-lg border-2 bg-background text-fg text-sm',
                'placeholder:text-fg-muted/50 transition-colors duration-150 outline-none',
                'focus:border-brand focus:ring-2 focus:ring-brand/20',
                error
                  ? 'border-destructive focus:border-destructive focus:ring-destructive/20'
                  : 'border-border-subtle hover:border-brand/40',
                isSubmitting ? 'opacity-50 cursor-not-allowed' : '',
              ].join(' ')}
            />

            {/* Inline validation error */}
            {error && (
              <p
                id={errorId}
                role="alert"
                className="text-xs text-destructive px-0.5"
              >
                {error}
              </p>
            )}
          </div>

          {/* CTA button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className={[
              'w-full h-11 rounded-lg font-semibold text-sm text-white',
              'bg-brand hover:bg-brand-hover active:scale-[0.98]',
              'transition-all duration-150 outline-none',
              'focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2',
              'disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100',
              'flex items-center justify-center gap-2',
            ].join(' ')}
          >
            {isSubmitting ? (
              <>
                <Loader2 size={15} className="animate-spin" aria-hidden="true" />
                Guardando...
              </>
            ) : (
              'Ver mi kit →'
            )}
          </button>
        </form>

        {/* Disclaimer */}
        <p className="text-xs text-fg-muted text-center leading-relaxed">
          Sin spam. Te mandamos el kit por email para que lo tengas guardado.
        </p>
      </div>
    </div>
  )
}
