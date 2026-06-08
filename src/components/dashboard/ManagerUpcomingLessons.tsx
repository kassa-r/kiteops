import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ManagerBooking } from '@/lib/hooks/useManagerDashboard';
import { format, parseISO } from 'date-fns';

interface ManagerUpcomingLessonsProps {
  lessons: ManagerBooking[];
}

export function ManagerUpcomingLessons({ lessons }: ManagerUpcomingLessonsProps) {
  if (!lessons || lessons.length === 0) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle>Upcoming Lessons (Today)</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">No lessons scheduled for today.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Upcoming Lessons (Today)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {lessons.map((booking) => {
            const start = parseISO(booking.start_time);
            return (
              <div key={booking.id} className="flex items-center justify-between border-b last:border-0 pb-4 last:pb-0">
                <div className="space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {booking.lesson?.name || 'Lesson'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Instructor: {booking.instructor?.full_name || 'Unassigned'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Student: {booking.customer?.full_name || 'Unknown'}
                  </p>
                </div>
                <div className="text-right space-y-1">
                  <p className="text-sm font-medium">{format(start, 'h:mm a')}</p>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full capitalize ${
                      booking.status === 'confirmed'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100'
                        : booking.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100'
                    }`}
                  >
                    {booking.status}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
