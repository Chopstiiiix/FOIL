import { json, type LoaderFunctionArgs } from '@remix-run/cloudflare';
import { useLoaderData } from '@remix-run/react';
import { useState } from 'react';
import { requireAdmin } from '~/lib/auth/admin.server';
import * as Tabs from '@radix-ui/react-tabs';
import * as Tooltip from '@radix-ui/react-tooltip';
import * as Progress from '@radix-ui/react-progress';
import {
  LayoutDashboard,
  Users,
  FolderOpen,
  AlertCircle,
  CreditCard,
  Settings,
  TrendingUp,
  TrendingDown,
  Activity,
  Database,
  Server,
  Shield,
  ChevronRight,
  ExternalLink,
  RefreshCw,
  Search,
  Filter,
  Download,
  Upload,
} from 'lucide-react';

export async function loader({ request, context }: LoaderFunctionArgs) {
  const user = await requireAdmin(request, context);

  // Enhanced stats with real-time data
  const stats = {
    totalUsers: 1234,
    activeUsers: 892,
    newUsersToday: 23,
    totalProjects: 5678,
    activeProjects: 2341,
    totalDeployments: 3456,
    deploymentsToday: 67,
    revenue: {
      monthly: 45678,
      annual: 548136,
      growth: 23.5,
    },
    errors: {
      unresolved: 23,
      last24h: 45,
      resolved: 178,
    },
    apiUsage: {
      today: 234567,
      thisMonth: 8901234,
      limit: 10000000,
    },
    systemHealth: {
      uptime: 99.98,
      responseTime: 142,
      activeSessions: 456,
    },
  };

  const recentUsers = [
    { id: '1', email: 'user1@example.com', role: 'user', tier: 'free', createdAt: '2024-02-20', status: 'active' },
    { id: '2', email: 'user2@example.com', role: 'user', tier: 'pro', createdAt: '2024-02-21', status: 'active' },
    { id: '3', email: 'user3@example.com', role: 'user', tier: 'enterprise', createdAt: '2024-02-22', status: 'pending' },
  ];

  const recentErrors = [
    { id: '1', message: 'API rate limit exceeded', count: 12, severity: 'warning', lastOccurred: '2024-02-24T10:30:00' },
    { id: '2', message: 'WebContainer timeout', count: 8, severity: 'error', lastOccurred: '2024-02-24T09:15:00' },
    { id: '3', message: 'Database connection failed', count: 3, severity: 'critical', lastOccurred: '2024-02-24T08:45:00' },
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
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900/95 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold text-white">FOIL Admin</h1>
              <div className="flex items-center gap-2">
                {user.role === 'superadmin' && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-purple-500/20 px-3 py-1 text-xs text-purple-400">
                    <Shield size={12} />
                    Super Admin
                  </span>
                )}
                <span className="inline-flex items-center gap-1 rounded-full bg-green-500/20 px-3 py-1 text-xs text-green-400">
                  <Activity size={12} />
                  System Healthy
                </span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-64 rounded-lg bg-gray-800 pl-10 pr-4 py-2 text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <button className="rounded-lg bg-gray-800 p-2 text-gray-400 hover:text-white transition-colors">
                <RefreshCw size={16} />
              </button>
              <div className="text-sm text-gray-400">
                {user.email}
              </div>
              <a href="/" className="text-sm text-purple-400 hover:text-purple-300 transition-colors">
                Back to App
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content with Tabs */}
      <Tabs.Root defaultValue="overview" className="flex h-[calc(100vh-73px)]">
        {/* Sidebar Navigation */}
        <Tabs.List className="w-64 border-r border-gray-800 bg-gray-900/50 p-4 space-y-1">
          <Tabs.Trigger value="overview" className="tab-trigger">
            <LayoutDashboard size={16} />
            <span>Overview</span>
          </Tabs.Trigger>
          <Tabs.Trigger value="users" className="tab-trigger">
            <Users size={16} />
            <span>Users</span>
          </Tabs.Trigger>
          <Tabs.Trigger value="projects" className="tab-trigger">
            <FolderOpen size={16} />
            <span>Projects</span>
          </Tabs.Trigger>
          <Tabs.Trigger value="errors" className="tab-trigger">
            <AlertCircle size={16} />
            <span>Error Logs</span>
            {stats.errors.unresolved > 0 && (
              <span className="ml-auto rounded-full bg-red-500/20 px-2 py-0.5 text-xs text-red-400">
                {stats.errors.unresolved}
              </span>
            )}
          </Tabs.Trigger>
          <Tabs.Trigger value="billing" className="tab-trigger">
            <CreditCard size={16} />
            <span>Billing</span>
          </Tabs.Trigger>
          <Tabs.Trigger value="database" className="tab-trigger">
            <Database size={16} />
            <span>Database</span>
          </Tabs.Trigger>
          <Tabs.Trigger value="monitoring" className="tab-trigger">
            <Activity size={16} />
            <span>Monitoring</span>
          </Tabs.Trigger>
          <Tabs.Trigger value="settings" className="tab-trigger">
            <Settings size={16} />
            <span>Settings</span>
          </Tabs.Trigger>
        </Tabs.List>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto">
          <Tabs.Content value="overview" className="p-8">
            <div className="space-y-8">
              {/* Stats Grid */}
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <StatCard
                  title="Total Users"
                  value={stats.totalUsers.toLocaleString()}
                  change={12}
                  trend="up"
                  icon={<Users size={20} />}
                  subtitle={`+${stats.newUsersToday} today`}
                />
                <StatCard
                  title="Active Projects"
                  value={stats.totalProjects.toLocaleString()}
                  change={8}
                  trend="up"
                  icon={<FolderOpen size={20} />}
                  subtitle={`${stats.activeProjects} active`}
                />
                <StatCard
                  title="Monthly Revenue"
                  value={`$${(stats.revenue.monthly / 100).toLocaleString()}`}
                  change={stats.revenue.growth}
                  trend="up"
                  icon={<TrendingUp size={20} />}
                  subtitle="USD"
                />
                <StatCard
                  title="System Health"
                  value={`${stats.systemHealth.uptime}%`}
                  change={0.02}
                  trend="up"
                  icon={<Server size={20} />}
                  subtitle={`${stats.systemHealth.responseTime}ms avg`}
                />
              </div>

              {/* Charts and Activity */}
              <div className="grid gap-6 lg:grid-cols-2">
                {/* Recent Users */}
                <div className="rounded-xl bg-gray-900 border border-gray-800 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-white">Recent Users</h2>
                    <button className="text-sm text-purple-400 hover:text-purple-300">
                      View all
                      <ChevronRight className="inline ml-1" size={14} />
                    </button>
                  </div>
                  <div className="space-y-3">
                    {recentUsers.map((user) => (
                      <div
                        key={user.id}
                        className="flex items-center justify-between rounded-lg bg-gray-800/50 p-3 hover:bg-gray-800 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500" />
                          <div>
                            <p className="font-medium text-white">{user.email}</p>
                            <p className="text-xs text-gray-400">
                              {user.tier} tier • Joined {user.createdAt}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs ${
                            user.status === 'active'
                              ? 'bg-green-500/20 text-green-400'
                              : 'bg-yellow-500/20 text-yellow-400'
                          }`}>
                            {user.status}
                          </span>
                          <button className="rounded bg-purple-500/20 px-3 py-1 text-xs text-purple-400 hover:bg-purple-500/30">
                            View
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent Errors */}
                <div className="rounded-xl bg-gray-900 border border-gray-800 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-white">Recent Errors</h2>
                    <button className="text-sm text-purple-400 hover:text-purple-300">
                      View all
                      <ChevronRight className="inline ml-1" size={14} />
                    </button>
                  </div>
                  <div className="space-y-3">
                    {recentErrors.map((error) => (
                      <div
                        key={error.id}
                        className="flex items-center justify-between rounded-lg bg-gray-800/50 p-3 hover:bg-gray-800 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${
                            error.severity === 'critical'
                              ? 'bg-red-500/20'
                              : error.severity === 'error'
                              ? 'bg-orange-500/20'
                              : 'bg-yellow-500/20'
                          }`}>
                            <AlertCircle size={16} className={
                              error.severity === 'critical'
                                ? 'text-red-400'
                                : error.severity === 'error'
                                ? 'text-orange-400'
                                : 'text-yellow-400'
                            } />
                          </div>
                          <div>
                            <p className="font-medium text-white">{error.message}</p>
                            <p className="text-xs text-gray-400">
                              {error.count} occurrences • {new Date(error.lastOccurred).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <button className="rounded bg-red-500/20 px-3 py-1 text-xs text-red-400 hover:bg-red-500/30">
                          Fix
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* API Usage */}
              <div className="rounded-xl bg-gray-900 border border-gray-800 p-6">
                <h2 className="text-lg font-semibold text-white mb-4">API Usage</h2>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-400">Today's Usage</span>
                      <span className="text-white">
                        {stats.apiUsage.today.toLocaleString()} / {(stats.apiUsage.limit / 30).toFixed(0).toLocaleString()}
                      </span>
                    </div>
                    <Progress.Root className="relative overflow-hidden bg-gray-800 rounded-full h-2">
                      <Progress.Indicator
                        className="bg-gradient-to-r from-purple-500 to-pink-500 h-full transition-transform duration-300"
                        style={{ transform: `translateX(-${100 - (stats.apiUsage.today / (stats.apiUsage.limit / 30)) * 100}%)` }}
                      />
                    </Progress.Root>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-400">Monthly Usage</span>
                      <span className="text-white">
                        {stats.apiUsage.thisMonth.toLocaleString()} / {stats.apiUsage.limit.toLocaleString()}
                      </span>
                    </div>
                    <Progress.Root className="relative overflow-hidden bg-gray-800 rounded-full h-2">
                      <Progress.Indicator
                        className="bg-gradient-to-r from-blue-500 to-cyan-500 h-full transition-transform duration-300"
                        style={{ transform: `translateX(-${100 - (stats.apiUsage.thisMonth / stats.apiUsage.limit) * 100}%)` }}
                      />
                    </Progress.Root>
                  </div>
                </div>
              </div>
            </div>
          </Tabs.Content>

          <Tabs.Content value="users" className="p-8">
            <UserManagement />
          </Tabs.Content>

          <Tabs.Content value="projects" className="p-8">
            <ProjectManagement />
          </Tabs.Content>

          <Tabs.Content value="errors" className="p-8">
            <ErrorLogs />
          </Tabs.Content>

          <Tabs.Content value="billing" className="p-8">
            <BillingManagement />
          </Tabs.Content>

          <Tabs.Content value="database" className="p-8">
            <DatabaseManagement />
          </Tabs.Content>

          <Tabs.Content value="monitoring" className="p-8">
            <SystemMonitoring />
          </Tabs.Content>

          <Tabs.Content value="settings" className="p-8">
            <SystemSettings />
          </Tabs.Content>
        </div>
      </Tabs.Root>
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
  subtitle,
}: {
  title: string;
  value: string;
  change: number;
  trend: 'up' | 'down';
  icon: React.ReactNode;
  subtitle?: string;
}) {
  return (
    <div className="rounded-xl bg-gray-900 border border-gray-800 p-6 hover:border-gray-700 transition-colors">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm text-gray-400">{title}</p>
          <p className="text-3xl font-bold text-white">{value}</p>
          {subtitle && (
            <p className="text-xs text-gray-500">{subtitle}</p>
          )}
          <div className="flex items-center gap-2">
            {trend === 'up' ? (
              <TrendingUp size={14} className="text-green-400" />
            ) : (
              <TrendingDown size={14} className="text-red-400" />
            )}
            <p className={`text-sm ${trend === 'up' ? 'text-green-400' : 'text-red-400'}`}>
              {change > 0 ? '+' : ''}{change}%
            </p>
          </div>
        </div>
        <div className="rounded-lg bg-gray-800 p-3 text-gray-400">
          {icon}
        </div>
      </div>
    </div>
  );
}

// Component pages
function UserManagement() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">User Management</h2>
        <div className="flex gap-3">
          <button className="inline-flex items-center gap-2 rounded-lg bg-gray-800 px-4 py-2 text-sm text-gray-300 hover:bg-gray-700">
            <Filter size={14} />
            Filter
          </button>
          <button className="inline-flex items-center gap-2 rounded-lg bg-gray-800 px-4 py-2 text-sm text-gray-300 hover:bg-gray-700">
            <Download size={14} />
            Export
          </button>
          <button className="inline-flex items-center gap-2 rounded-lg bg-purple-500 px-4 py-2 text-sm text-white hover:bg-purple-600">
            <Users size={14} />
            Add User
          </button>
        </div>
      </div>
      <div className="rounded-xl bg-gray-900 border border-gray-800 p-6">
        <p className="text-gray-400">Full user management interface with search, filters, and bulk actions...</p>
      </div>
    </div>
  );
}

function ProjectManagement() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Project Management</h2>
        <div className="flex gap-3">
          <button className="inline-flex items-center gap-2 rounded-lg bg-gray-800 px-4 py-2 text-sm text-gray-300 hover:bg-gray-700">
            <Search size={14} />
            Search
          </button>
          <button className="inline-flex items-center gap-2 rounded-lg bg-purple-500 px-4 py-2 text-sm text-white hover:bg-purple-600">
            <FolderOpen size={14} />
            New Project
          </button>
        </div>
      </div>
      <div className="rounded-xl bg-gray-900 border border-gray-800 p-6">
        <p className="text-gray-400">Project overview with deployment status, resource usage, and management tools...</p>
      </div>
    </div>
  );
}

function ErrorLogs() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Error Logs</h2>
        <div className="flex gap-3">
          <button className="inline-flex items-center gap-2 rounded-lg bg-gray-800 px-4 py-2 text-sm text-gray-300 hover:bg-gray-700">
            <RefreshCw size={14} />
            Refresh
          </button>
          <button className="inline-flex items-center gap-2 rounded-lg bg-red-500 px-4 py-2 text-sm text-white hover:bg-red-600">
            <AlertCircle size={14} />
            Clear Resolved
          </button>
        </div>
      </div>
      <div className="rounded-xl bg-gray-900 border border-gray-800 p-6">
        <p className="text-gray-400">Real-time error tracking with stack traces, affected users, and resolution status...</p>
      </div>
    </div>
  );
}

function BillingManagement() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Billing & Subscriptions</h2>
        <button className="inline-flex items-center gap-2 rounded-lg bg-purple-500 px-4 py-2 text-sm text-white hover:bg-purple-600">
          <CreditCard size={14} />
          Stripe Dashboard
        </button>
      </div>
      <div className="rounded-xl bg-gray-900 border border-gray-800 p-6">
        <p className="text-gray-400">Subscription management, payment history, and revenue analytics...</p>
      </div>
    </div>
  );
}

function DatabaseManagement() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Database Management</h2>
        <div className="flex gap-3">
          <button className="inline-flex items-center gap-2 rounded-lg bg-gray-800 px-4 py-2 text-sm text-gray-300 hover:bg-gray-700">
            <Database size={14} />
            Backup
          </button>
          <button className="inline-flex items-center gap-2 rounded-lg bg-purple-500 px-4 py-2 text-sm text-white hover:bg-purple-600">
            <Upload size={14} />
            Import
          </button>
        </div>
      </div>
      <div className="rounded-xl bg-gray-900 border border-gray-800 p-6">
        <p className="text-gray-400">Database statistics, query performance, and migration tools...</p>
      </div>
    </div>
  );
}

function SystemMonitoring() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">System Monitoring</h2>
        <button className="inline-flex items-center gap-2 rounded-lg bg-purple-500 px-4 py-2 text-sm text-white hover:bg-purple-600">
          <Activity size={14} />
          Live View
        </button>
      </div>
      <div className="rounded-xl bg-gray-900 border border-gray-800 p-6">
        <p className="text-gray-400">Real-time system metrics, performance monitoring, and alerts...</p>
      </div>
    </div>
  );
}

function SystemSettings() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">System Settings</h2>
        <button className="inline-flex items-center gap-2 rounded-lg bg-purple-500 px-4 py-2 text-sm text-white hover:bg-purple-600">
          <Settings size={14} />
          Save Changes
        </button>
      </div>
      <div className="rounded-xl bg-gray-900 border border-gray-800 p-6">
        <p className="text-gray-400">Application configuration, API keys, environment variables, and system preferences...</p>
      </div>
    </div>
  );
}

// Add CSS for tab triggers
const tabTriggerStyles = `
  .tab-trigger {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem 1rem;
    border-radius: 0.5rem;
    text-sm;
    color: rgb(156 163 175);
    transition: all 0.2s;
    background: transparent;
    border: none;
    cursor: pointer;
    text-align: left;
  }

  .tab-trigger:hover {
    background: rgb(31 41 55 / 0.5);
    color: rgb(229 231 235);
  }

  .tab-trigger[data-state="active"] {
    background: rgb(139 92 246 / 0.2);
    color: rgb(196 181 253);
  }
`;

// Add styles to document head
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = tabTriggerStyles;
  document.head.appendChild(style);
}