import { env } from '@/lib/env';

export const metadata = {
  title: 'Admin Dashboard - Mai Inji',
  description: 'Manage orders and analytics',
};

// Prevent prerendering so the page can run server-side checks at request time
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminDashboardPage() {
  // If no API base is configured, avoid importing admin components
  // which may depend on backend services.
  if (!env.apiBaseUrl) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-semibold">Admin disabled for soft launch</h1>
        <p className="mt-2 text-sm text-muted-foreground">The admin interface is disabled because no backend is configured.</p>
      </div>
    );
  }

  const { AdminDashboard } = await import('@/components/AdminDashboard');
  return <AdminDashboard />;
}
