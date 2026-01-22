import { env } from '@/lib/env';

export const metadata = {
  title: 'Admin Dashboard - Mai Inji',
  description: 'Manage orders and analytics',
};

// Prevent prerendering so the page can run server-side checks at request time
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminDashboardPage() {
  // If in Soft Launch Mode OR no API base is configured, disable admin.
  // This explicitly prevents importing backend-dependent components during build.
  if (env.softLaunchMode || !env.apiBaseUrl) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-center p-8">
        <div className="bg-white p-12 rounded-3xl shadow-xl max-w-lg">
          <h1 className="text-3xl font-black text-burgundy mb-4 tracking-tight uppercase">Admin Access Disabled</h1>
          <p className="text-gray-600 mb-6 font-medium">
            The system is currently running in <strong>Soft Launch Mode</strong>.
            Backend administration services are offline.
          </p>
          <p className="text-xs text-gray-400 uppercase tracking-widest font-bold">
            Deployment: Frontend Only
          </p>
        </div>
      </div>
    );
  }

  const { AdminDashboard } = await import('@/components/AdminDashboard');
  return <AdminDashboard />;
}
