'use client';

import { useManagerDashboard } from '@/lib/hooks/useManagerDashboard';
import { ManagerSnapshotWidget } from './ManagerSnapshotWidget';
import { WeatherConflictCard } from './WeatherConflictCard';
import { ManagerUpcomingLessons } from './ManagerUpcomingLessons';
import { ManagerQuickActions } from './ManagerQuickActions';
import { WeatherWidget } from './WeatherWidget';
import { Loader2 } from 'lucide-react';

export function ManagerDashboard() {
  const { stats, upcomingLessons, isLoading, error } = useManagerDashboard();

  if (isLoading) {
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
        <p className="text-sm">{error.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Manager Dashboard</h1>
        <p className="text-muted-foreground">
          {new Date().toLocaleDateString(undefined, {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats && stats.weatherConflictCount > 0 && (
            <div className="col-span-full mb-4">
                <WeatherConflictCard conflictCount={stats.weatherConflictCount} />
            </div>
        )}

        <div className="col-span-1 lg:col-span-2">
            {stats && <ManagerSnapshotWidget stats={stats} />}
        </div>

        <div className="col-span-1 lg:col-span-2">
            <WeatherWidget />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-7">
        <div className="col-span-1 md:col-span-4 lg:col-span-5">
            {upcomingLessons && <ManagerUpcomingLessons lessons={upcomingLessons} />}
        </div>
        <div className="col-span-1 md:col-span-3 lg:col-span-2">
           <ManagerQuickActions />
        </div>
      </div>
    </div>
  );
}
