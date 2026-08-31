'use client'

import { useLayoutEffect, useRef, useState, useSyncExternalStore, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

// Two ways to see a tip:
//   1. Hover (or keyboard focus) it -- opens after a short delay, closes
//      when you leave. No coordination needed between tips since only one
//      thing can be hovered at a time.
//   2. Click "Show tips" in the top bar -- walks every tip on the page top
//      to bottom, one at a time, advancing each time you close the current
//      one. This is opt-in (nothing auto-opens on page load) and reuses
//      the same page-wide registry every tip already maintains for
//      ordering purposes, just gated behind an explicit "start" action
//      instead of running automatically.
//
// The bubble renders through a portal into document.body, positioned
// `absolute` from real measurements (converted to document coordinates)
// rather than CSS placement relative to the anchor + guesswork:
//   1. Several containers clip overflow for unrelated reasons (rounded
//      card corners, scrollable modals) -- a bubble positioned relative to
//      the anchor and nested inside one of those gets silently cut off the
//      moment it needs to extend past that ancestor's own box. A portal
//      into document.body, with no positioned ancestor of its own,
//      sidesteps every one of those at once -- and being `absolute` in
//      document flow (not `fixed` in viewport space) means it scrolls
//      together with its anchor for free.
//   2. A bubble's height depends on its text, which a fixed-size CSS rule
//      can't know. This measures the bubble for real after it opens and
//      flips to the opposite side when the requested one doesn't have
//      room, the same way a proper tooltip library does.

// ---------------------------------------------------------------------------
// Page-wide registry + tour state
// ---------------------------------------------------------------------------
// Plain module state + a subscriber set rather than React Context, so it
// works without wrapping the app in a provider -- every OnboardingTip
// anywhere just works together automatically.
type Listener = () => void
const registeredTops = new Map<string, number>() // id -> document-relative top, kept live while mounted
const listeners = new Set<Listener>()
let tourActive = false
const tourSeenIds = new Set<string>() // ids already advanced past in the *current* tour
let tourCurrentId: string | null = null

function notify() {
  listeners.forEach((l) => l())
}

function recomputeTourCurrent() {
  let topId: string | null = null
  let topValue = Infinity
  for (const [id, top] of registeredTops) {
    if (tourSeenIds.has(id)) continue
    if (top < topValue) {
      topValue = top
      topId = id
    }
  }
  tourCurrentId = topId
  if (tourActive && tourCurrentId === null) tourActive = false // nothing left -- tour's over
}

function registerTip(id: string, documentTop: number) {
  registeredTops.set(id, documentTop)
  if (tourActive) recomputeTourCurrent()
  notify()
}

function unregisterTip(id: string) {
  if (!registeredTops.has(id)) return
  registeredTops.delete(id)
  tourSeenIds.delete(id)
  if (tourActive) recomputeTourCurrent()
  notify()
}

function subscribe(listener: Listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function getTourSnapshot(id: string) {
  return tourActive && tourCurrentId === id
}
function getServerTourSnapshot() {
  return false
}

/** Starts (or restarts) the guided walkthrough -- used by "Show tips" in
 * AdminSidebar. Always begins from whatever's currently topmost on the page. */
export function startTipsTour() {
  tourSeenIds.clear()
  tourActive = true
  recomputeTourCurrent()
  notify()
}

function advanceTour(id: string) {
  tourSeenIds.add(id)
  recomputeTourCurrent()
  notify()
}

type Side = 'top' | 'bottom' | 'left' | 'right'

const VIEWPORT_MARGIN = 10
const GAP = 8
// Matches Tailwind's `sm:` -- most of this app's row layouts (card headers,
// step buttons) switch from side-by-side to stacked below this width, so a
// control that sits at a row's far edge on desktop can end up anywhere
// (dead center, near the left) once mobile stacks that row vertically.
const MOBILE_BREAKPOINT = 640
// How long the pointer has to stay before a hover-triggered tip opens/
// closes -- long enough that just passing over a button on the way
// somewhere else doesn't pop a bubble, short enough it doesn't feel laggy
// when you actually pause on one. Doesn't apply to the tour -- that opens
// each tip immediately since it's an explicit, deliberate action.
const OPEN_DELAY_MS = 250
const CLOSE_DELAY_MS = 100

// Smaller on phones so a bubble takes up noticeably less of a narrow
// screen -- costs more line-wrapping, but that's the right trade there.
function maxBubbleWidth() {
  return window.innerWidth < MOBILE_BREAKPOINT ? 170 : 220
}

type BubblePos = { top: number; left: number; arrowSide: Side }

/**
 * Places the bubble using its *actual* measured size (bw/bh), not a guess --
 * this is what makes the flip logic below correct instead of heuristic.
 * Falls back from the requested side to whichever of the two opposite
 * directions actually has room, and always clamps fully inside the
 * viewport as a last resort so nothing is ever unreachable.
 */
function placeBubble(anchor: DOMRect, bw: number, bh: number, requestedSide: Side): BubblePos {
  const vw = window.innerWidth
  const vh = window.innerHeight
  // A `side="left"`/`"right"` choice is a desktop-layout call -- it assumes
  // the trigger sits at one predictable edge of a row. Below the mobile
  // breakpoint that assumption no longer holds (rows stack vertically), so
  // every tip drops straight down from wherever the trigger actually
  // landed instead of guessing a side that might now open back over
  // something else on the card.
  const side: Side = vw < MOBILE_BREAKPOINT ? 'bottom' : requestedSide

  if (side === 'top' || side === 'bottom') {
    const spaceBelow = vh - anchor.bottom - GAP
    const spaceAbove = anchor.top - GAP
    const openDown = side === 'bottom' ? spaceBelow >= bh || spaceBelow >= spaceAbove : spaceBelow > bh && spaceBelow > spaceAbove

    let left = anchor.left + anchor.width / 2 - bw / 2
    left = Math.min(Math.max(left, VIEWPORT_MARGIN), vw - VIEWPORT_MARGIN - bw)

    if (openDown) {
      const top = Math.min(anchor.bottom + GAP, vh - VIEWPORT_MARGIN - bh)
      return { top: Math.max(top, VIEWPORT_MARGIN), left, arrowSide: 'top' }
    }
    const top = Math.max(anchor.top - GAP - bh, VIEWPORT_MARGIN)
    return { top, left, arrowSide: 'bottom' }
  }

  // left / right: vertically centered on the anchor, then flipped to
  // whichever side actually has room, same idea as top/bottom above.
  const spaceRight = vw - anchor.right - GAP
  const spaceLeft = anchor.left - GAP
  const openRight = side === 'right' ? spaceRight >= bw || spaceRight >= spaceLeft : spaceRight > bw && spaceRight > spaceLeft

  let top = anchor.top + anchor.height / 2 - bh / 2
  top = Math.min(Math.max(top, VIEWPORT_MARGIN), vh - VIEWPORT_MARGIN - bh)

  if (openRight) {
    const left = Math.min(anchor.right + GAP, vw - VIEWPORT_MARGIN - bw)
    return { top, left: Math.max(left, VIEWPORT_MARGIN), arrowSide: 'left' }
  }
  const left = Math.max(anchor.left - GAP - bw, VIEWPORT_MARGIN)
  return { top, left, arrowSide: 'right' }
}

const ARROW_POSITION: Record<Side, string> = {
  // Points back toward the anchor -- named for which edge of the bubble it
  // sits on, which is the opposite of the direction the bubble opened in.
  top: 'left-1/2 -translate-x-1/2 -top-[5px] border-l-transparent border-r-transparent border-b-[#050505] border-l-[5px] border-r-[5px] border-b-[5px]',
  bottom: 'left-1/2 -translate-x-1/2 -bottom-[5px] border-l-transparent border-r-transparent border-t-[#050505] border-l-[5px] border-r-[5px] border-t-[5px]',
  right: 'top-1/2 -translate-y-1/2 -right-[5px] border-t-transparent border-b-transparent border-l-[#050505] border-t-[5px] border-b-[5px] border-l-[5px]',
  left: 'top-1/2 -translate-y-1/2 -left-[5px] border-t-transparent border-b-transparent border-r-[#050505] border-t-[5px] border-b-[5px] border-r-[5px]',
}

export default function OnboardingTip({
  id,
  text,
  children,
  side = 'bottom',
  wrapperClassName = 'inline-block',
}: {
  /** Unique, stable key for this tip -- used for tour ordering. */
  id: string
  text: string
  children: ReactNode
  side?: Side
  /** Applied to the anchor wrapper around `children`. Defaults to
   * `inline-block`; pass e.g. `"block w-full"` for a full-width child. */
  wrapperClassName?: string
}) {
  const anchorRef = useRef<HTMLSpanElement>(null)
  const bubbleRef = useRef<HTMLSpanElement>(null)
  const [hoverOpen, setHoverOpen] = useState(false)
  const [pos, setPos] = useState<BubblePos | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const isTourCurrent = useSyncExternalStore(subscribe, () => getTourSnapshot(id), getServerTourSnapshot)
  const open = hoverOpen || isTourCurrent

  function clearTimer() {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }
  function scheduleOpen() {
    clearTimer()
    timerRef.current = setTimeout(() => setHoverOpen(true), OPEN_DELAY_MS)
  }
  function scheduleClose() {
    clearTimer()
    timerRef.current = setTimeout(() => setHoverOpen(false), CLOSE_DELAY_MS)
  }

  // Keeps this tip's position registered for as long as it's mounted,
  // regardless of hover/tour state -- the tour needs the full, live-
  // ordered list of every tip on the page to know what's "next", not just
  // whichever one happens to be open right now.
  useLayoutEffect(() => {
    const updateRegistration = () => {
      if (!anchorRef.current) return
      const rect = anchorRef.current.getBoundingClientRect()
      // A `display:none` anchor (e.g. wrapped in a `hidden md:flex` nav
      // that's collapsed at this viewport width) measures as an all-zero
      // rect -- nothing to point a bubble at, so nothing to register.
      if (rect.width === 0 && rect.height === 0) {
        unregisterTip(id)
        return
      }
      registerTip(id, rect.top + window.scrollY)
    }
    updateRegistration()
    window.addEventListener('resize', updateRegistration)
    return () => {
      window.removeEventListener('resize', updateRegistration)
      unregisterTip(id)
    }
  }, [id])

  // Measures and places the bubble once it opens -- see placeBubble's own
  // comment for why this needs the bubble's real size, not an assumption.
  useLayoutEffect(() => {
    if (!open) {
      setPos(null)
      return
    }
    const reposition = () => {
      if (!anchorRef.current || !bubbleRef.current) return
      const anchorRect = anchorRef.current.getBoundingClientRect()
      if (anchorRect.width === 0 && anchorRect.height === 0) {
        setPos(null)
        return
      }
      const bubbleRect = bubbleRef.current.getBoundingClientRect()
      const viewportPos = placeBubble(anchorRect, bubbleRect.width, bubbleRect.height, side)
      setPos({
        ...viewportPos,
        top: viewportPos.top + window.scrollY,
        left: viewportPos.left + window.scrollX,
      })
    }
    reposition()
    window.addEventListener('resize', reposition)
    return () => window.removeEventListener('resize', reposition)
  }, [open, side])

  function handleClose() {
    clearTimer()
    setHoverOpen(false)
    if (isTourCurrent) advanceTour(id)
  }

  return (
    // Kept `relative` even though the bubble itself is portal/absolute-
    // positioned (not relative-to-this-wrapper) -- some wrapped content has
    // its own nested `absolute` element (e.g. a <select>'s chevron icon)
    // that depends on this being its positioning context.
    <span
      ref={anchorRef}
      className={`relative ${wrapperClassName}`}
      onMouseEnter={scheduleOpen}
      onMouseLeave={scheduleClose}
      onFocus={scheduleOpen}
      onBlur={scheduleClose}
    >
      {children}
      {open && createPortal(
        <span
          ref={bubbleRef}
          // Portaled straight into document.body with no positioned
          // ancestor, so `absolute` here positions in document (not
          // viewport) coordinates. Also now stacks directly against
          // page-level overlays (the request/order/quotation detail modals
          // use up to z-[200]) rather than just its old DOM siblings -- has
          // to clear the highest of those. Rendered (invisible) even
          // before `pos` is known -- the position effect needs this node
          // in the DOM to measure it in the first place.
          className="absolute z-[300] w-max"
          style={{
            top: pos ? pos.top : -9999,
            left: pos ? pos.left : -9999,
            maxWidth: maxBubbleWidth(),
            visibility: pos ? 'visible' : 'hidden',
            animation: pos ? 'onboardingTipIn 0.15s ease-out' : undefined,
          }}
        >
          {pos && <span className={`absolute w-0 h-0 ${ARROW_POSITION[pos.arrowSide]}`} />}
          <span className="flex items-start gap-1.5 bg-[#050505] text-white text-[11px] leading-[1.35] rounded-md px-2.5 py-2 shadow-xl">
            <span className="flex-1">{text}</span>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                handleClose()
              }}
              aria-label={isTourCurrent ? 'Next tip' : 'Dismiss tip'}
              className="shrink-0 -mt-0.5 -mr-0.5 text-white/50 hover:text-white transition-colors leading-none text-sm"
            >
              &times;
            </button>
          </span>
        </span>,
        document.body,
      )}
    </span>
  )
}
