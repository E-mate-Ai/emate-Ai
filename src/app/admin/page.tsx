import type { Metadata } from 'next';
import AdminDashboard from './AdminDashboard';
import { requireAdminAccess } from './access';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Admin Dashboard',
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminPage() {
  await requireAdminAccess();
  return <AdminDashboard section="overview" />;
}
