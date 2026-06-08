'use client';

import { useQuery } from '@tanstack/react-query';
import { AuthService } from '@/lib/auth-service';
import { InstructorDashboard } from '@/components/dashboard/InstructorDashboard';
import { ManagerDashboard } from '@/components/dashboard/ManagerDashboard';
import { Loader2 } from 'lucide-react';

export default function DashboardPage() {
  const { data: role, isLoading, error } = useQuery({
    queryKey: ['userRole'],
    queryFn: () => AuthService.getUserRole(),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 rounded-md bg-destructive/10 text-destructive">
        Error loading user role. Please try again.
      </div>
    );
  }

  if (role === 'instructor') {
    return <InstructorDashboard />;
  }

  if (role === 'manager') {
    return <ManagerDashboard />;
  }

  return (
    <div className="p-4 rounded-md bg-yellow-50 text-yellow-800 border border-yellow-200">
      <h2 className="text-lg font-semibold">Access Restricted</h2>
      <p>Your account role ({role || 'Unknown'}) does not have a dashboard view.</p>
    </div>
  );
}
