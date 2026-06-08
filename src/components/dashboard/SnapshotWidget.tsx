import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Calendar, Clock } from 'lucide-react';
import { DashboardStats } from '@/lib/hooks/useInstructorDashboard';

interface SnapshotWidgetProps {
  stats: DashboardStats;
}

export function SnapshotWidget({ stats }: SnapshotWidgetProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Today's Snapshot</CardTitle>
        <Calendar className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{stats.todayLessonCount}</div>
        <p className="text-xs text-muted-foreground">
          Scheduled lessons for today
        </p>
        <div className="mt-4 flex items-center space-x-2">
           <Users className="h-4 w-4 text-muted-foreground" />
           <span className="text-sm font-medium">{stats.pendingBookingCount} Pending</span>
        </div>
      </CardContent>
    </Card>
  );
}
