import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ConflictedBooking } from '@/lib/hooks/useManagerDashboard';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar'; // Assuming calendar component exists

interface ResolutionConflictItemProps {
  booking: ConflictedBooking;
}

const ResolutionConflictItem: React.FC<ResolutionConflictItemProps> = ({ booking }) => {
  const { lesson, customer, instructor, start_time, weather_data } = booking;
  const [isCancelModalOpen, setCancelModalOpen] = useState(false);
  const [isRebookModalOpen, setRebookModalOpen] = useState(false);

  const weatherIssue = weather_data 
    ? Object.entries(weather_data)
        .filter(([key, value]) => value.conflict)
        .map(([key, value]) => `${key.replace(/_/g, ' ')}: ${value.value} ${value.unit} (threshold: ${value.threshold})`)
        .join(', ')
    : 'Unknown weather issue';

  const handleAutoRebook = () => {
    alert('Auto-Rebook is not implemented yet.');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{lesson?.name || 'Unknown Lesson'}</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div>
          <p><strong>Customer:</strong> {customer?.full_name || 'N/A'}</p>
          <p><strong>Instructor:</strong> {instructor?.full_name || 'N/A'}</p>
          <p><strong>Time:</strong> {format(new Date(start_time), 'PPP p')}</p>
        </div>
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4">
          <p className="font-bold">Weather Issue:</p>
          <p>{weatherIssue}</p>
        </div>
        <div className="flex justify-end space-x-2">
          {/* Manual Rebook Modal */}
          <Dialog open={isRebookModalOpen} onOpenChange={setRebookModalOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">Manual Rebook</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Manual Rebook</DialogTitle>
              </DialogHeader>
              <p>Select a new date and time for the lesson.</p>
              {/* Assuming a Calendar component exists */}
              {/* <Calendar /> */}
               <div className="text-center p-8">Calendar placeholder</div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="ghost">Cancel</Button>
                </DialogClose>
                <Button onClick={() => setRebookModalOpen(false)}>Confirm Rebooking</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Cancel Lesson Modal */}
          <Dialog open={isCancelModalOpen} onOpenChange={setCancelModalOpen}>
            <DialogTrigger asChild>
              <Button variant="destructive">Cancel Lesson</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Are you sure you want to cancel?</DialogTitle>
              </DialogHeader>
              <p>This action cannot be undone. The customer will be notified.</p>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="ghost">Close</Button>
                </DialogClose>
                <Button variant="destructive" onClick={() => setCancelModalOpen(false)}>Confirm Cancellation</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          
          <Button onClick={handleAutoRebook}>Auto-Rebook</Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ResolutionConflictItem;
