import { redirect } from 'next/navigation';
import AdminDashboard, { type AdminSection } from '../AdminDashboard';
import { requireAdminAccess } from '../access';

export const dynamic = 'force-dynamic';

const ADMIN_SECTIONS: AdminSection[] = [
  'activity',
  'users',
  'system-health',
  'model-routing',
  'feature-controls',
];

export default async function AdminSectionPage({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  await requireAdminAccess();
  const { section } = await params;
  if (!ADMIN_SECTIONS.includes(section as AdminSection)) redirect('/admin');

  return <AdminDashboard section={section as AdminSection} />;
}
