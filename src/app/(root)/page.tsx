import { redirect } from 'next/navigation'

// This repo is the admin dashboard only -- no public marketing site was
// copied over -- so the bare domain root has nothing of its own to show.
// Send it straight to the dashboard, which auto-signs the visitor in (see
// /api/demo-auth) rather than gating on a login form.
export default function RootPage() {
  redirect('/admin-dashboard')
}
