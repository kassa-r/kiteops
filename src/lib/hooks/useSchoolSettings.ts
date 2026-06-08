import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSchoolSettings, updateSchoolSettings, SchoolSettings } from '@/lib/settings-service';
import { LessonService, Lesson } from '@/lib/lesson-service';
import { toast } from 'sonner';

export function useSchoolSettings() {
  return useQuery({
    queryKey: ['school-settings'],
    queryFn: getSchoolSettings,
  });
}

export function useUpdateSchoolSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateSchoolSettings,
    onSuccess: () => {
      toast.success('School settings updated successfully');
      queryClient.invalidateQueries({ queryKey: ['school-settings'] });
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update settings');
    },
  });
}

export function useLessonsQuery() {
  return useQuery({
    queryKey: ['lessons'],
    queryFn: LessonService.getLessons,
  });
}

export function useCreateLesson() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: LessonService.createLesson,
    onSuccess: () => {
      toast.success('Lesson created successfully');
      queryClient.invalidateQueries({ queryKey: ['lessons'] });
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to create lesson');
    },
  });
}

export function useUpdateLesson() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updates }: { id: number; updates: Partial<Lesson> }) => 
      LessonService.updateLesson(id, updates),
    onSuccess: () => {
      toast.success('Lesson updated successfully');
      queryClient.invalidateQueries({ queryKey: ['lessons'] });
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update lesson');
    },
  });
}
