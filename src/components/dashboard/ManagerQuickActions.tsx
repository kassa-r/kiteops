import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { CalendarDays, PlusCircle, Users } from 'lucide-react';

export function ManagerQuickActions() {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-2">
        <Button asChild variant="outline" className="w-full justify-start">
          <Link href="/calendar">
            <CalendarDays className="mr-2 h-4 w-4" />
            View Full Calendar
          </Link>
        </Button>
        <Button asChild variant="outline" className="w-full justify-start">
          <Link href="/calendar?action=new">
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Booking
          </Link>
        </Button>
        <Button asChild variant="outline" className="w-full justify-start">
          <Link href="/instructors">
            <Users className="mr-2 h-4 w-4" />
            Manage Instructors
          </Link>
        </Button>
        <Button asChild variant="outline" className="w-full justify-start">
          <Link href="/customers">
            <Users className="mr-2 h-4 w-4" />
            Manage Customers
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
