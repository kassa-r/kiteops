import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from 'lucide-react';
import { ManagerDashboardStats } from '@/lib/hooks/useManagerDashboard';

interface ManagerSnapshotWidgetProps {
  stats: ManagerDashboardStats;
}

export function ManagerSnapshotWidget({ stats }: ManagerSnapshotWidgetProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Today's Snapshot</CardTitle>
        <Calendar className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex flex-col">
                <div className="text-2xl font-bold">{stats.todayLessonCount}</div>
                <p className="text-xs text-muted-foreground">Scheduled Lessons</p>
            </div>
            <div className="flex flex-col">
                <div className="text-2xl font-bold">{stats.pendingBookingCount}</div>
                 <p className="text-xs text-muted-foreground">Pending Bookings</p>
            </div>
            <div className="flex flex-col">
                 <div className="text-2xl font-bold">{stats.availableInstructorsCount}</div>
                 <p className="text-xs text-muted-foreground">Instructors Available</p>
            </div>
        </div>
      </CardContent>
    </Card>
  );
}
