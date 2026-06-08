import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Booking } from '@/lib/hooks/useInstructorDashboard';
import { format, parseISO, isToday, isTomorrow } from 'date-fns';

interface UpcomingLessonsProps {
  lessons: Booking[];
}

export function UpcomingLessons({ lessons }: UpcomingLessonsProps) {
  if (!lessons || lessons.length === 0) {
      return (
        <Card className="h-full">
            <CardHeader>
                <CardTitle>Upcoming Lessons</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground text-sm">No upcoming lessons scheduled for today or tomorrow.</p>
            </CardContent>
        </Card>
      )
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Upcoming Lessons</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
        {lessons.map((booking) => {
            const start = parseISO(booking.start_time);
            let dayLabel = format(start, 'MMM d');
            if (isToday(start)) dayLabel = 'Today';
            if (isTomorrow(start)) dayLabel = 'Tomorrow';

            return (
                <div key={booking.id} className="flex items-center justify-between border-b last:border-0 pb-4 last:pb-0">
                    <div className="space-y-1">
                        <p className="text-sm font-medium leading-none">{booking.lesson?.name || 'Lesson'}</p>
                        <p className="text-sm text-muted-foreground">{booking.profiles?.full_name || 'Unknown Student'}</p>
                    </div>
                    <div className="text-right space-y-1">
                        <p className="text-sm font-medium">{dayLabel}, {format(start, 'h:mm a')}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${
                            booking.status === 'confirmed' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100' :
                            booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100' :
                            'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100'
                        }`}>
                            {booking.status}
                        </span>
                    </div>
                </div>
            )
        })}
        </div>
      </CardContent>
    </Card>
  );
}
