'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import apiClient from '@/services/api';
import { useAuth } from '@/store/authStore';
import { ApiResponse, AuthToken } from '@/types/api';

export default function AdminLoginPage() {
  const router = useRouter();
  const { setAuth } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: 'admin@mai-inji.com',
    password: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!formData.password) {
      toast.error('Please enter your password');
      return;
    }

    setLoading(true);

    try {
      const response = await apiClient.post<AuthToken | ApiResponse<AuthToken>>('/auth/login', formData);
      const payload = response.data as AuthToken | ApiResponse<AuthToken>;
      const auth = payload && typeof payload === 'object' && 'success' in payload
        ? payload.data
        : payload;

      if (auth?.token && auth?.user) {
        // Store in Zustand
        setAuth(auth.token, auth.user);

        // Store in localStorage for persistence
        localStorage.setItem('auth_token', auth.token);
        localStorage.setItem('admin_user', JSON.stringify(auth.user));

        toast.success('Login successful!');

        // Redirect to dashboard
        setTimeout(() => {
          router.push('/admin/dashboard');
        }, 1000);
      }
    } catch (error: any) {
      console.error('Login error:', error);
      const message = error.response?.data?.message || 'Login failed. Please try again.';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Mai Inji</h1>
          <p className="text-gray-600">Admin Login</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-2">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              disabled
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
            />
            <p className="text-xs text-gray-500 mt-1">Default admin email</p>
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-2">
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter admin password"
              disabled={loading}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-2 rounded-lg font-semibold text-white transition-all ${
              loading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-green-600 hover:bg-green-700 active:scale-95'
            }`}
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <span className="animate-spin mr-2">⟳</span>
                Signing in...
              </span>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        {/* Info Box */}
        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-xs text-blue-800">
            <strong>Demo Credentials:</strong> Use password <code>maiini@2026</code> for admin account.
          </p>
        </div>
      </div>
    </div>
  );
}
