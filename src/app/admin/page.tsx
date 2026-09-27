import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import AdminDashboard from './AdminDashboard';

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '')
  .split(',')
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    redirect('/');
  }

  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user?.email) {
      redirect('/');
    }

    const email = user.email.toLowerCase();
    const isAdmin = ADMIN_EMAILS.length === 0 || ADMIN_EMAILS.includes(email);

    if (!isAdmin) {
      redirect('/');
    }
  } catch {
    redirect('/');
  }

  return <AdminDashboard />;
}
