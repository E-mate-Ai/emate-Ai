import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '')
  .split(',')
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

export async function requireAdminAccess() {
  if (process.env.NODE_ENV !== 'production') return;
  if (ADMIN_EMAILS.length === 0) redirect('/');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) redirect('/');

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user?.email && ADMIN_EMAILS.includes(user.email.toLowerCase())) return;
  } catch {
    // Auth failures are denied in production.
  }

  redirect('/');
}
