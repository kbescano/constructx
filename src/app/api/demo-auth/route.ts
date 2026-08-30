import { NextRequest, NextResponse } from 'next/server'
import { getPayloadClient } from '@/lib/getPayloadClient'
import { generatePayloadCookie } from 'payload/shared'

// This is a demo build meant to be shared as a link, so there's no
// password-entry login wall -- instead, the root '/' page shows a role
// picker (Sales / Admin / Marketing & Logistics) and this route performs
// the actual sign-in for whichever role was picked, using the matching
// seeded account (see scripts/seed.ts). admin-dashboard/layout.tsx
// redirects to '/' (not straight here) when there's no session yet;
// AdminSidebar's "Switch Role" and Logout links also point at '/', so
// switching roles is just "go there, pick a different card."
const ROLE_ACCOUNTS: Record<string, string> = {
  sales: process.env.DEMO_LOGIN_EMAIL_SALES || 'juan@constructx.demo',
  admin: process.env.DEMO_LOGIN_EMAIL_ADMIN || 'admin@constructx.demo',
  marketing: process.env.DEMO_LOGIN_EMAIL_MARKETING || 'marketing@constructx.demo',
}
const DEMO_PASSWORD = process.env.DEMO_LOGIN_PASSWORD || 'Demo1234!'

export async function GET(req: NextRequest) {
  const requested = req.nextUrl.searchParams.get('redirect') || '/admin-dashboard'
  const safeRedirect = requested.startsWith('/') ? requested : '/admin-dashboard'
  const role = req.nextUrl.searchParams.get('role') || ''
  const email = ROLE_ACCOUNTS[role]

  // No (recognized) role picked -- send them to the picker instead of
  // guessing which persona they want.
  if (!email) {
    return NextResponse.redirect(
      new URL(`/?redirect=${encodeURIComponent(safeRedirect)}`, req.nextUrl.origin),
    )
  }

  try {
    const payload = await getPayloadClient()
    const result = await payload.login({
      collection: 'users',
      data: { email, password: DEMO_PASSWORD },
    })

    if (!result.token) throw new Error('Demo login returned no token')

    // Same cookie Payload's own /api/users/login endpoint sets on success --
    // built with Payload's own helper so the name/format always matches
    // whatever this collection's auth config (cookie prefix, expiry, secure
    // flag) actually is, rather than this route guessing and drifting.
    const cookie = generatePayloadCookie({
      collectionAuthConfig: (payload.collections.users.config as any).auth,
      cookiePrefix: payload.config.cookiePrefix as string,
      token: result.token,
    })

    // Marketing lands on Inquiry Tracker (their actual home tab, per
    // AdminSidebar's nav) rather than the Quotation Inbox they can't see.
    const target = role === 'marketing' && safeRedirect === '/admin-dashboard'
      ? '/admin-dashboard/inquiry-tracker'
      : safeRedirect

    const response = NextResponse.redirect(new URL(target, req.nextUrl.origin))
    response.headers.set('Set-Cookie', cookie as string)
    return response
  } catch (err) {
    // Most likely cause: the demo accounts don't exist yet because
    // `npx tsx scripts/seed.ts` hasn't been run. Fall back to the picker
    // (which also has the manual-login fallback) instead of a broken page.
    console.error(`Demo auto-login failed for role "${role}":`, err)
    return NextResponse.redirect(
      new URL(`/?redirect=${encodeURIComponent(safeRedirect)}`, req.nextUrl.origin),
    )
  }
}
