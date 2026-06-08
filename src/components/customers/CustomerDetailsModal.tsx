'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { CustomerProfile } from '@/lib/profile-service';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';

interface CustomerDetailsModalProps {
  children?: React.ReactNode;
  customer: CustomerProfile;
}

export function CustomerDetailsModal({ children, customer }: CustomerDetailsModalProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Customer Details</DialogTitle>
          <DialogDescription>
            Detailed profile information for {customer.name}.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-medium text-muted-foreground">Full Name</h4>
              <p className="text-base font-semibold">{customer.name}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-muted-foreground">Skill Level</h4>
              <Badge variant="secondary" className="mt-1">
                {customer.skill_level || 'Unknown'}
              </Badge>
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-2 gap-4">
             <div>
              <h4 className="text-sm font-medium text-muted-foreground">Email</h4>
              <p className="text-sm">{customer.email}</p>
            </div>
             <div>
              <h4 className="text-sm font-medium text-muted-foreground">Phone</h4>
              <p className="text-sm">{customer.phone || '-'}</p>
            </div>
          </div>
          
           <div className="grid grid-cols-2 gap-4">
             <div>
              <h4 className="text-sm font-medium text-muted-foreground">Age</h4>
              <p className="text-sm">{customer.age || '-'}</p>
            </div>
             <div>
              <h4 className="text-sm font-medium text-muted-foreground">Gender</h4>
              <p className="text-sm capitalize">{customer.gender || '-'}</p>
            </div>
          </div>

          <div>
              <h4 className="text-sm font-medium text-muted-foreground">Experience</h4>
              <p className="text-sm">{customer.experience_hours ? `${customer.experience_hours} hours` : '0 hours'}</p>
          </div>

          <div>
              <h4 className="text-sm font-medium text-muted-foreground">Notes</h4>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {customer.additional_notes || 'No additional notes.'}
              </p>
          </div>

          <Separator />
          
          <div>
            <h4 className="text-xs font-medium text-muted-foreground">Member Since</h4>
            <p className="text-xs text-muted-foreground">
                {customer.created_at ? format(new Date(customer.created_at), 'MMMM d, yyyy') : '-'}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
