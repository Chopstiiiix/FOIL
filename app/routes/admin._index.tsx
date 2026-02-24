import { json, type LoaderFunctionArgs } from '@remix-run/cloudflare';
import { useLoaderData } from '@remix-run/react';
import { useState } from 'react';
import { requireAdmin } from '~/lib/auth/admin.server';

export async function loader({ request, context }: LoaderFunctionArgs) {
  // Ensure user is admin or superadmin
  const user = await requireAdmin(request, context);

  // Mock data for now - will be replaced with real DB queries
  const stats = {
    totalUsers: 1234,
    activeUsers: 892,
    totalProjects: 5678,
    totalDeployments: 3456,
    revenue: {
      monthly: 45678,
      annual: 548136,
    },
    errors: {
      unresolved: 23,
      last24h: 45,
    },
    apiUsage: {
      today: 234567,
      thisMonth: 8901234,
    },
  };

  const recentUsers = [
    { id: '1', email: 'user1@example.com', role: 'user', tier: 'free', createdAt: '2024-02-20' },
    { id: '2', email: 'user2@example.com', role: 'user', tier: 'pro', createdAt: '2024-02-21' },
    { id: '3', email: 'user3@example.com', role: 'user', tier: 'enterprise', createdAt: '2024-02-22' },
  ];

  const recentErrors = [
    { id: '1', message: 'API rate limit exceeded', count: 12, lastOccurred: '2024-02-24T10:30:00' },
    { id: '2', message: 'WebContainer timeout', count: 8, lastOccurred: '2024-02-24T09:15:00' },
    { id: '3', message: 'Database connection failed', count: 3, lastOccurred: '2024-02-24T08:45:00' },
  ];

  return json({
    user,
    stats,
    recentUsers,
    recentErrors,
  });
}

export default function AdminDashboard() {
  const { user, stats, recentUsers, recentErrors } = useLoaderData<typeof loader>();
  const [activeTab, setActiveTab] = useState('overview');

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'users', label: 'Users', icon: '👥' },
    { id: 'projects', label: 'Projects', icon: '📁' },
    { id: 'errors', label: 'Errors', icon: '⚠️' },
    { id: 'billing', label: 'Billing', icon: '💳' },
    { id: 'settings', label: 'Settings', icon: '⚙️' },
  ];

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold text-white">FOIL Admin Dashboard</h1>
              <span className="rounded-full bg-green-500/20 px-3 py-1 text-xs text-green-400">
                {user.role === 'superadmin' ? '🔐 Super Admin' : '👨‍💼 Admin'}
              </span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-400">
                {user.email} ({user.github_username})
              </span>
              <a href="/" className="text-sm text-blue-400 hover:text-blue-300">
                ← Back to App
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="border-b border-gray-800 bg-gray-900/50">
        <div className="container mx-auto px-4">
          <div className="flex gap-2 overflow-x-auto py-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'bg-blue-500/20 text-blue-400'
                    : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Stats Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <StatCard
                title="Total Users"
                value={stats.totalUsers.toLocaleString()}
                change="+12%"
                trend="up"
                icon="👥"
              />
              <StatCard
                title="Active Projects"
                value={stats.totalProjects.toLocaleString()}
                change="+8%"
                trend="up"
                icon="📁"
              />
              <StatCard
                title="Monthly Revenue"
                value={`$${(stats.revenue.monthly / 100).toLocaleString()}`}
                change="+23%"
                trend="up"
                icon="💰"
              />
              <StatCard
                title="Unresolved Errors"
                value={stats.errors.unresolved.toString()}
                change="-5%"
                trend="down"
                icon="⚠️"
                variant="warning"
              />
            </div>

            {/* Recent Activity */}
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Recent Users */}
              <div className="rounded-lg bg-gray-900 p-6">
                <h2 className="mb-4 text-lg font-semibold">Recent Users</h2>
                <div className="space-y-3">
                  {recentUsers.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between rounded-lg bg-gray-800 p-3"
                    >
                      <div>
                        <p className="font-medium text-white">{user.email}</p>
                        <p className="text-sm text-gray-400">
                          {user.tier} tier • Joined {user.createdAt}
                        </p>
                      </div>
                      <button className="rounded bg-blue-500/20 px-3 py-1 text-xs text-blue-400 hover:bg-blue-500/30">
                        View
                      </button>
                    </div>
                  ))}
                </div>
                <button className="mt-4 w-full rounded bg-gray-800 py-2 text-sm text-gray-400 hover:bg-gray-700">
                  View All Users →
                </button>
              </div>

              {/* Recent Errors */}
              <div className="rounded-lg bg-gray-900 p-6">
                <h2 className="mb-4 text-lg font-semibold">Recent Errors</h2>
                <div className="space-y-3">
                  {recentErrors.map((error) => (
                    <div
                      key={error.id}
                      className="flex items-center justify-between rounded-lg bg-gray-800 p-3"
                    >
                      <div>
                        <p className="font-medium text-white">{error.message}</p>
                        <p className="text-sm text-gray-400">
                          {error.count} occurrences • Last: {new Date(error.lastOccurred).toLocaleString()}
                        </p>
                      </div>
                      <button className="rounded bg-red-500/20 px-3 py-1 text-xs text-red-400 hover:bg-red-500/30">
                        Investigate
                      </button>
                    </div>
                  ))}
                </div>
                <button className="mt-4 w-full rounded bg-gray-800 py-2 text-sm text-gray-400 hover:bg-gray-700">
                  View All Errors →
                </button>
              </div>
            </div>

            {/* API Usage Chart (placeholder) */}
            <div className="rounded-lg bg-gray-900 p-6">
              <h2 className="mb-4 text-lg font-semibold">API Usage (Last 7 Days)</h2>
              <div className="flex h-64 items-center justify-center rounded bg-gray-800">
                <p className="text-gray-500">Chart will be implemented with real data</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="rounded-lg bg-gray-900 p-6">
            <h2 className="mb-4 text-xl font-semibold">User Management</h2>
            <p className="text-gray-400">User management interface coming soon...</p>
          </div>
        )}

        {activeTab === 'projects' && (
          <div className="rounded-lg bg-gray-900 p-6">
            <h2 className="mb-4 text-xl font-semibold">Project Management</h2>
            <p className="text-gray-400">Project management interface coming soon...</p>
          </div>
        )}

        {activeTab === 'errors' && (
          <div className="rounded-lg bg-gray-900 p-6">
            <h2 className="mb-4 text-xl font-semibold">Error Logs</h2>
            <p className="text-gray-400">Error log viewer coming soon...</p>
          </div>
        )}

        {activeTab === 'billing' && (
          <div className="rounded-lg bg-gray-900 p-6">
            <h2 className="mb-4 text-xl font-semibold">Billing & Subscriptions</h2>
            <p className="text-gray-400">Billing management interface coming soon...</p>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="rounded-lg bg-gray-900 p-6">
            <h2 className="mb-4 text-xl font-semibold">System Settings</h2>
            <p className="text-gray-400">System settings interface coming soon...</p>
          </div>
        )}
      </main>
    </div>
  );
}

// Stat Card Component
function StatCard({
  title,
  value,
  change,
  trend,
  icon,
  variant = 'default',
}: {
  title: string;
  value: string;
  change: string;
  trend: 'up' | 'down';
  icon: string;
  variant?: 'default' | 'warning';
}) {
  return (
    <div className="rounded-lg bg-gray-900 p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-400">{title}</p>
          <p className="mt-2 text-3xl font-bold text-white">{value}</p>
          <p
            className={`mt-2 text-sm ${
              trend === 'up'
                ? variant === 'warning'
                  ? 'text-orange-400'
                  : 'text-green-400'
                : 'text-red-400'
            }`}
          >
            {change} from last month
          </p>
        </div>
        <span className="text-2xl">{icon}</span>
      </div>
    </div>
  );
}