import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { Calendar, Clock, Users, User } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function QuickActions() {
  const actions = [
    { label: 'View My Calendar', href: '/calendar', icon: Calendar, variant: 'outline' },
    { label: 'Manage Availability', href: '/calendar', icon: Clock, variant: 'outline' },
    { label: 'Update Profile', href: '/settings/profile', icon: User, variant: 'outline' },
  ];

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-2">
        {actions.map((action) => {
            const Icon = action.icon;
            return (
                <Button key={action.label} variant={action.variant as any} className="w-full justify-start h-auto py-4" asChild>
                    <Link href={action.href}>
                        <Icon className="mr-2 h-4 w-4" />
                        {action.label}
                    </Link>
                </Button>
            )
        })}
      </CardContent>
    </Card>
  );
}
