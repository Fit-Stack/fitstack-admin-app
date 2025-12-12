import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { useThemeStore } from '@/store/themeStore';
import { brandConfig } from '@/config/branding';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard,
  Dumbbell,
  Calendar,
  Users,
  ShoppingBag,
  MessageSquare,
  CalendarDays,
  Megaphone,
  LogOut,
  Menu,
  X,
  Sun,
  Moon,
} from 'lucide-react';
import { useState, useEffect } from 'react';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Classes', href: '/classes', icon: Dumbbell },
  { name: 'Sessions', href: '/sessions', icon: Calendar },
  { name: 'Trainers', href: '/trainers', icon: Users },
  { name: 'Marketplace', href: '/marketplace', icon: ShoppingBag },
  { name: 'Enquiries', href: '/enquiries', icon: MessageSquare },
  { name: 'Events', href: '/events', icon: CalendarDays },
  { name: 'Announcements', href: '/announcements', icon: Megaphone },
];

export default function DashboardLayout() {
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const { isDarkMode, toggleTheme, setTheme } = useThemeStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Initialize theme on mount
  useEffect(() => {
    setTheme(isDarkMode);
  }, []);

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-gray-900/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transform transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo & Branding */}
          <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              {brandConfig.logoUrl ? (
                <img src={brandConfig.logoUrl} alt={brandConfig.name} className="h-10 w-auto" />
              ) : (
                <div 
                  className="p-2 rounded-lg"
                  style={{ backgroundColor: brandConfig.primaryColor }}
                >
                  <Dumbbell className="h-5 w-5 text-white" />
                </div>
              )}
              <div>
                <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
                  {brandConfig.name}
                </span>
                <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium tracking-wider uppercase">
                  {brandConfig.tagline}
                </p>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'text-white shadow-sm'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                  style={isActive ? { backgroundColor: brandConfig.primaryColor } : {}}
                >
                  <item.icon className="h-5 w-5" />
                  <span className="font-medium">{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* User info & logout */}
          <div className="border-t border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center space-x-3 mb-3">
              <div 
                className="h-10 w-10 rounded-full flex items-center justify-center text-white font-semibold shadow-sm"
                style={{ backgroundColor: brandConfig.primaryColor }}
              >
                {user?.firstName?.[0] || user?.email[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                  {user?.firstName || user?.email}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{user?.role.replace('_', ' ')}</p>
              </div>
            </div>
            <Button
              variant="outline"
              className="w-full"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <header className="sticky top-0 z-30 h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex items-center justify-between h-full px-6">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            >
              <Menu className="h-6 w-6" />
            </button>
            <div className="flex-1" />
            <div className="flex items-center space-x-4">
              {user?.tenantId && (
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 rounded-lg">
                  <div 
                    className="h-2 w-2 rounded-full animate-pulse"
                    style={{ backgroundColor: brandConfig.primaryColor }}
                  ></div>
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                    {user.tenantId}
                  </span>
                </div>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                className="relative h-9 w-9 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 text-gray-700" />
                <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 text-gray-300" />
                <span className="sr-only">Toggle theme</span>
              </Button>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-6 bg-gray-50 dark:bg-gray-900 min-h-[calc(100vh-4rem)]">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
