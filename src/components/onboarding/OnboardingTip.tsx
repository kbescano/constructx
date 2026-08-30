'use client'

import { useEffect, useState, type ReactNode } from 'react'

// Lightweight, dismissible coach marks for first-time visitors exploring the
// demo. No scripted/forced tour -- each tip just sits near the control it
// explains until dismissed, and dismissal is remembered per-browser via
// localStorage so it never nags a returning visitor. Wrap any existing
// button/link/element with <OnboardingTip> and it renders untouched --
// this only adds an absolutely-positioned bubble alongside it.

const STORAGE_KEY = 'constructx_dismissed_tips'

function readDismissed(): string[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    // localStorage can throw in private-browsing/blocked-storage contexts --
    // treat as "nothing dismissed yet" rather than breaking the page.
    return []
  }
}

function writeDismissed(ids: string[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ids))
  } catch {
    // Storage full/blocked -- the tip will just reappear next visit, not fatal.
  }
}

/** Clears all dismissed tips so the guided experience starts over. Used by
 * the "Show tips again" control in AdminSidebar. */
export function resetOnboardingTips() {
  try {
    window.localStorage.removeItem(STORAGE_KEY)
    window.dispatchEvent(new Event('constructx-tips-reset'))
  } catch {
    // no-op
  }
}

type Side = 'top' | 'bottom' | 'left' | 'right'

const SIDE_POSITION: Record<Side, string> = {
  bottom: 'top-full mt-2.5 left-1/2 -translate-x-1/2',
  top: 'bottom-full mb-2.5 left-1/2 -translate-x-1/2',
  left: 'right-full mr-2.5 top-1/2 -translate-y-1/2',
  right: 'left-full ml-2.5 top-1/2 -translate-y-1/2',
}

const SIDE_ARROW: Record<Side, string> = {
  bottom: 'left-1/2 -translate-x-1/2 -top-[5px] border-l-transparent border-r-transparent border-b-[#050505] border-l-[5px] border-r-[5px] border-b-[5px]',
  top: 'left-1/2 -translate-x-1/2 -bottom-[5px] border-l-transparent border-r-transparent border-t-[#050505] border-l-[5px] border-r-[5px] border-t-[5px]',
  left: 'top-1/2 -translate-y-1/2 -right-[5px] border-t-transparent border-b-transparent border-l-[#050505] border-t-[5px] border-b-[5px] border-l-[5px]',
  right: 'top-1/2 -translate-y-1/2 -left-[5px] border-t-transparent border-b-transparent border-r-[#050505] border-t-[5px] border-b-[5px] border-r-[5px]',
}

export default function OnboardingTip({
  id,
  text,
  children,
  side = 'bottom',
  wrapperClassName = 'inline-block',
}: {
  /** Unique, stable key for this tip -- used as the dismissal record. */
  id: string
  text: string
  children: ReactNode
  side?: Side
  /** Applied to the positioning wrapper around `children`. Defaults to
   * `inline-block`; pass e.g. `"block w-full"` for a full-width child. */
  wrapperClassName?: string
}) {
  // Starts hidden so server-rendered and first-paint markup never shows a
  // tip the visitor already dismissed on a prior visit -- avoids a flash.
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    setVisible(!readDismissed().includes(id))
    const onReset = () => setVisible(true)
    window.addEventListener('constructx-tips-reset', onReset)
    return () => window.removeEventListener('constructx-tips-reset', onReset)
  }, [id])

  function handleDismiss() {
    const current = readDismissed()
    if (!current.includes(id)) writeDismissed([...current, id])
    setVisible(false)
  }

  return (
    <span className={`relative ${wrapperClassName}`}>
      {children}
      {visible && (
        <span
          className={`absolute z-[80] ${SIDE_POSITION[side]} w-max max-w-[230px]`}
          style={{ animation: 'onboardingTipIn 0.25s ease-out' }}
        >
          <span className={`absolute w-0 h-0 ${SIDE_ARROW[side]}`} />
          <span className="flex items-start gap-2 bg-[#050505] text-white text-[11px] leading-snug rounded-lg px-3 py-2.5 shadow-xl">
            <span className="flex-1">{text}</span>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                handleDismiss()
              }}
              aria-label="Dismiss tip"
              className="shrink-0 -mt-0.5 -mr-0.5 text-white/50 hover:text-white transition-colors leading-none text-base"
            >
              &times;
            </button>
          </span>
        </span>
      )}
    </span>
  )
}
