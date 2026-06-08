'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Calendar, Settings, LogOut, User, Users, GraduationCap } from 'lucide-react';
import { AuthService } from '@/lib/auth-service';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const { data: userRole, isLoading: isLoadingRole } = useQuery({
    queryKey: ['userRole'],
    queryFn: () => AuthService.getUserRole(),
  });

  const handleLogout = async () => {
    try {
      await AuthService.logout();
      router.push('/login');
      toast.success('Logged out successfully');
    } catch (error) {
      toast.error('Failed to logout');
    }
  };

  const settingsHref = userRole === 'manager' ? '/settings' : '/settings/profile';

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: Home },
    { href: '/calendar', label: 'Calendar', icon: Calendar },
    ...(userRole === 'manager' ? [
        { href: '/customers', label: 'Customers', icon: Users },
        { href: '/instructors', label: 'Instructors', icon: GraduationCap },
    ] : []),
    { href: settingsHref, label: 'Settings', icon: Settings },
  ];

  if (isLoadingRole) {
    return <div className="min-h-screen flex items-center justify-center">Loading user role...</div>;
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      <header className="sticky top-0 z-40 w-full border-b bg-background">
        <div className="container mx-auto flex h-16 items-center justify-between py-4 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 font-bold text-xl text-primary">
            <span>KiteOps</span>
          </div>
          <nav className="flex items-center gap-6">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 text-sm font-medium transition-colors hover:text-primary ${
                    isActive ? 'text-primary' : 'text-muted-foreground'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline-block">{item.label}</span>
                </Link>
              );
            })}
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-destructive"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline-block">Logout</span>
            </button>
          </nav>
        </div>
      </header>
      <main className="flex-1 container mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
