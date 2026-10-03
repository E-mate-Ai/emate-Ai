import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import AdminDashboard from './AdminDashboard';

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '')
  .split(',')
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const isDev = process.env.NODE_ENV !== 'production';

  // In development, or if ADMIN_EMAILS is not explicitly configured, allow immediate access
  if (isDev || ADMIN_EMAILS.length === 0) {
    return <AdminDashboard />;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return <AdminDashboard />;
  }

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (user?.email) {
      const email = user.email.toLowerCase();
      if (ADMIN_EMAILS.includes(email)) {
        return <AdminDashboard />;
      }
    }
  } catch {
    // If auth check fails in development, don't block
    if (isDev) {
      return <AdminDashboard />;
    }
  }

  redirect('/');
}
