import { NextRequest, NextResponse } from 'next/server'
import { getPayloadClient } from '@/lib/getPayloadClient'
import { generatePayloadCookie } from 'payload/shared'

// This is a demo build meant to be shared as a link, so there's no login
// wall -- visitors following the link are auto-signed-in as the seeded demo
// admin account (see scripts/seed.ts) and land straight on the dashboard.
// admin-dashboard/layout.tsx redirects here instead of /admin-login when
// there's no session yet; AdminSidebar's Logout button also comes back
// through here so clicking it doesn't dead-end on a login form.
const DEMO_EMAIL = process.env.DEMO_LOGIN_EMAIL || 'admin@constructx.demo'
const DEMO_PASSWORD = process.env.DEMO_LOGIN_PASSWORD || 'Demo1234!'

export async function GET(req: NextRequest) {
  const requested = req.nextUrl.searchParams.get('redirect') || '/admin-dashboard'
  const safeRedirect = requested.startsWith('/') ? requested : '/admin-dashboard'

  try {
    const payload = await getPayloadClient()
    const result = await payload.login({
      collection: 'users',
      data: { email: DEMO_EMAIL, password: DEMO_PASSWORD },
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

    const response = NextResponse.redirect(new URL(safeRedirect, req.nextUrl.origin))
    response.headers.set('Set-Cookie', cookie as string)
    return response
  } catch (err) {
    // Most likely cause: the demo account doesn't exist yet because
    // `npx tsx scripts/seed.ts` hasn't been run. Fall back to the real
    // login form instead of leaving the visitor on a broken page.
    console.error('Demo auto-login failed, falling back to manual login:', err)
    return NextResponse.redirect(
      new URL(`/admin-login?redirect=${encodeURIComponent(safeRedirect)}`, req.nextUrl.origin),
    )
  }
}
