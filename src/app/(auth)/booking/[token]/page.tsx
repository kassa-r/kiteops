'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { format } from 'date-fns';
import { Calendar, Clock, MapPin, User, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { getBookingByToken } from '@/lib/booking-service';
import Link from 'next/link';

export default function BookingDetailsPage() {
  const params = useParams();
  const token = params?.token as string;
  
  console.log("Client-side token from URL:", token);

  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;

    const fetchBooking = async () => {
      try {
        const response = await getBookingByToken(token);
        if (response.success) {
          setBooking(response.data);
        } else {
          setError(response.error || 'Failed to load booking');
        }
      } catch (err: any) {
        setError(err.message || 'An error occurred while fetching the booking');
      } finally {
        setLoading(false);
      }
    };

    fetchBooking();
  }, [token]);

  if (loading) {
    return (
      <div className="flex h-[50vh] w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-[50vh] w-full items-center justify-center p-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
          <div className="mt-4">
             <Link href="/">
               <Button variant="outline" size="sm">Return Home</Button>
             </Link>
          </div>
        </Alert>
      </div>
    );
  }

  if (!booking) {
      return null; // Should be handled by error state
  }

  const {
    start_time,
    lessons, // joined data
    instructor_name,
    booking_reference,
    status,
    location // Now top-level
  } = booking;

  // Assuming lessons is an object from the single join
  const lessonName = lessons?.name || 'Lesson';
  // const location = lessons?.location || 'Sandy Point Beach';
  const durationMinutes = lessons?.duration_minutes || 60;
  
  const startDate = new Date(start_time);
  const endDate = new Date(startDate.getTime() + durationMinutes * 60000);

  return (
    <div className="container max-w-lg py-10">
      <Card className="shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Booking Details</CardTitle>
          <CardDescription>
            Reference: <span className="font-mono font-bold text-primary">{booking_reference}</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center space-x-4 rounded-lg border p-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Date</p>
                <p className="font-medium">{format(startDate, 'EEEE, MMMM d, yyyy')}</p>
              </div>
            </div>

            <div className="flex items-center space-x-4 rounded-lg border p-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <Clock className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Time</p>
                <p className="font-medium">
                  {format(startDate, 'h:mm a')} - {format(endDate, 'h:mm a')}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4 rounded-lg border p-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <MapPin className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Location</p>
                <p className="font-medium">{location}</p>
              </div>
            </div>

            <div className="flex items-center space-x-4 rounded-lg border p-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Instructor</p>
                <p className="font-medium">{instructor_name}</p>
              </div>
            </div>
            
            <div className="pt-2 text-center">
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${
                    status === 'confirmed' ? 'bg-green-100 text-green-800' : 
                    status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                    'bg-gray-100 text-gray-800'
                }`}>
                    {status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Unknown'}
                </span>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-center">
           <Link href="/">
             <Button variant="outline">Back to Home</Button>
           </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
