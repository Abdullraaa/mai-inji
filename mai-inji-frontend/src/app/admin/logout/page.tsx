'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { useAuth } from '@/store/authStore';

export default function AdminLogoutPage() {
  const router = useRouter();
  const { clearAuth } = useAuth();

  useEffect(() => {
    // Clear auth state
    clearAuth();

    // Clear localStorage
    localStorage.removeItem('auth_token');
    localStorage.removeItem('admin_user');

    // Show success message
    toast.success('Logged out successfully');

    // Redirect to home
    setTimeout(() => {
      router.push('/');
    }, 1000);
  }, [router, clearAuth]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin text-4xl mb-4">⟳</div>
        <p className="text-gray-600">Logging out...</p>
      </div>
    </div>
  );
}
