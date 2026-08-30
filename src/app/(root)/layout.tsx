import type { ReactNode } from 'react'
// @ts-ignore: allow importing global CSS without module declarations in this nested layout
import '../globals.css'

// Root layout for the '/' role-picker page. A route group (parens,
// invisible in the URL) so it doesn't collide with admin-dashboard/layout.tsx,
// which is its own independent root layout the same way -- see Next.js's
// "multiple root layouts" pattern. Without this, '/' has no layout anywhere
// in its chain at all and Next throws "page.tsx doesn't have a root layout".
// Needs its own globals.css import too, same as admin-dashboard/layout.tsx --
// each independent root layout pulls in Tailwind separately, it isn't
// shared automatically just because another route group already imports it.
export default function RootGroupLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0 }}>{children}</body>
    </html>
  )
}
