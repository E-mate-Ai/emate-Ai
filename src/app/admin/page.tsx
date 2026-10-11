import AdminDashboard from './AdminDashboard';
import { requireAdminAccess } from './access';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  await requireAdminAccess();
  return <AdminDashboard section="overview" />;
}
