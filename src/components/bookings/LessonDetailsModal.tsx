'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ManagerBooking } from '@/lib/hooks/useManagerDashboard';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

interface LessonDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: ManagerBooking | null;
  onEdit?: (booking: ManagerBooking) => void;
  onCancel?: (booking: ManagerBooking) => void;
}

const DetailRow = ({ label, value }: { label: string; value: React.ReactNode }) => (
    <div className="grid grid-cols-3 gap-2 py-1">
        <span className="text-sm font-semibold text-muted-foreground">{label}</span>
        <span className="col-span-2 text-sm">{value || '-'}</span>
    </div>
);

export function LessonDetailsModal({ isOpen, onClose, booking, onEdit, onCancel }: LessonDetailsModalProps) {
  if (!booking) return null;

  const handleEdit = () => {
    onClose();
    if (onEdit) onEdit(booking);
  };

  const handleCancel = () => {
    onClose();
    if (onCancel) onCancel(booking);
  };

  const statusVariant = (status: string) => {
    if (status === 'confirmed') return 'success';
    if (status.includes('cancelled')) return 'destructive';
    return 'default';
  };

  const startDate = new Date(booking.start_time);
  const endDate = new Date(booking.end_time);
  const duration = (endDate.getTime() - startDate.getTime()) / (1000 * 60);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Lesson Details</DialogTitle>
          <DialogDescription>
            Detailed view of the booking for {booking.customer?.full_name || 'N/A'}.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
            <div>
                <h3 className="text-md font-semibold mb-2 border-b pb-1">Lesson Information</h3>
                <DetailRow label="Lesson Type" value={booking.lesson?.name || 'N/A'} />
                <DetailRow label="Instructor" value={booking.instructor?.full_name || 'Unassigned'} />
                <DetailRow label="Date" value={format(startDate, 'PPP')} />
                <DetailRow label="Time" value={`${format(startDate, 'p')} - ${format(endDate, 'p')}`} />
                <DetailRow label="Duration" value={`${duration} minutes`} />
                <DetailRow label="Location" value={booking.location} />
                <DetailRow label="Status" value={<Badge variant={statusVariant(booking.status) as any}>{booking.status}</Badge>} />
            </div>
            <div>
                <h3 className="text-md font-semibold mb-2 border-b pb-1">Student Information</h3>
                <DetailRow label="Name" value={booking.customer?.full_name || 'N/A'} />
                <DetailRow label="Email" value={booking.customer?.email || 'N/A'} />
                <DetailRow label="Phone" value={booking.customer?.phone || 'N/A'} />
                <DetailRow label="Skill Level" value={booking.customer?.customer_details?.skill_level || 'N/A'} />
                <DetailRow label="Age" value={booking.customer?.customer_details?.age || 'N/A'} />
                <DetailRow label="Gender" value={booking.customer?.customer_details?.gender || 'N/A'} />
                <DetailRow label="Experience" value={booking.customer?.customer_details?.experience_hours ? `${booking.customer.customer_details.experience_hours} hours` : 'N/A'} />
                <DetailRow label="Notes" value={booking.customer?.customer_details?.additional_notes || 'None'} />
            </div>
             <div>
                <h3 className="text-md font-semibold mb-2 border-b pb-1">Manager Notes</h3>
                <p className="text-sm text-muted-foreground p-2 bg-muted/50 rounded-md">
                    {booking.manager_notes || 'No manager notes for this booking.'}
                </p>
            </div>
        </div>
        
        <DialogFooter className="justify-between">
          <div>
            <Button variant="outline" onClick={onClose}>
                Close
            </Button>
          </div>
          <div className="space-x-2">
            {onCancel && (
              <Button variant="destructive" onClick={handleCancel}>
                Cancel Booking
              </Button>
            )}
            {onEdit && (
              <Button onClick={handleEdit}>
                Edit Booking
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
