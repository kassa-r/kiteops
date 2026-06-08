import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';
import Link from 'next/link';

interface WeatherConflictCardProps {
  conflictCount: number;
}

export function WeatherConflictCard({ conflictCount }: WeatherConflictCardProps) {
  if (conflictCount === 0) return null;

  return (
    <Card className="border-l-4 border-l-yellow-500 shadow-sm">
      <CardHeader className="flex flex-row items-center space-x-2 pb-2">
        <AlertTriangle className="h-5 w-5 text-yellow-600" />
        <CardTitle className="text-lg font-semibold">Resolution Center</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col space-y-4">
          <div>
            <span className="text-2xl font-bold">{conflictCount}</span>
            <span className="text-muted-foreground ml-2">Lessons Need Review</span>
          </div>
          <p className="text-sm text-muted-foreground">
             Weather conditions require attention. Review affected lessons to propose changes.
          </p>
          <Button asChild className="w-full sm:w-auto" variant="default">
             <Link href="/resolution-center">Review Lessons</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
