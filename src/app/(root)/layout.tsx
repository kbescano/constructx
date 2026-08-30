import type { ReactNode } from 'react'

// Minimal root layout just for the '/' redirect page. A route group
// (parens, invisible in the URL) so it doesn't collide with
// admin-dashboard/layout.tsx and admin-login/layout.tsx, which are each
// already their own independent root layout the same way -- see Next.js's
// "multiple root layouts" pattern. Without this, '/' has no layout
// anywhere in its chain at all and Next throws "page.tsx doesn't have a
// root layout".
export default function RootGroupLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0 }}>{children}</body>
    </html>
  )
}
