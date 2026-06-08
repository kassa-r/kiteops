'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { ProfileService } from '@/lib/profile-service';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface DeleteInstructorModalProps {
  children?: React.ReactNode;
  instructorId: string;
  instructorName: string;
}

export function DeleteInstructorModal({ children, instructorId, instructorName }: DeleteInstructorModalProps) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () => ProfileService.deleteUser(instructorId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['instructors'] });
      toast.success('Instructor deleted successfully');
    },
    onError: (error) => {
      toast.error(`Failed to delete instructor: ${error.message}`);
    },
  });

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the instructor profile for
            <span className="font-semibold text-foreground"> {instructorName}</span> and remove their data from the system.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            className="bg-red-600 hover:bg-red-700 text-white"
            onClick={() => mutation.mutate()}
          >
            {mutation.isPending ? 'Deleting...' : 'Delete Instructor'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
