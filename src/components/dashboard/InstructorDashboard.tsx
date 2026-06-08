'use client';

import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { useInstructorDashboard } from '@/lib/hooks/useInstructorDashboard';
import { SnapshotWidget } from './SnapshotWidget';
import { WeatherWidget } from './WeatherWidget';
import { UpcomingLessons } from './UpcomingLessons';
import { QuickActions } from './QuickActions';
import { Loader2 } from 'lucide-react';

export function InstructorDashboard() {
  const supabase = createClient();

  const { data: user, isLoading: isUserLoading } = useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    },
  });

  const { stats, upcomingLessons, isLoading: isDashboardLoading, error } = useInstructorDashboard(user?.id);

  if (isUserLoading || isDashboardLoading) {
    return (
        <div className="flex h-[50vh] items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
    );
  }

  if (error) {
    return (
        <div className="p-6 text-destructive">
            <h2 className="text-lg font-bold">Error loading dashboard</h2>
            <p>{(error as Error).message}</p>
            <pre className="mt-4 p-2 bg-muted rounded text-xs overflow-auto">
                {JSON.stringify(error, null, 2)}
            </pre>
        </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
              {new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="col-span-1 lg:col-span-2">
              {stats && <SnapshotWidget stats={stats} />}
          </div>
          <div className="col-span-1 lg:col-span-2">
               <WeatherWidget />
          </div>
      </div>

      <div className="grid gap-4 md:grid-cols-7">
        <div className="col-span-1 md:col-span-4 lg:col-span-5">
           {upcomingLessons && <UpcomingLessons lessons={upcomingLessons} />}
        </div>
        <div className="col-span-1 md:col-span-3 lg:col-span-2">
           <QuickActions />
        </div>
      </div>
    </div>
  );
}
