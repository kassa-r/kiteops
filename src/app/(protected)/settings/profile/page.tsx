'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ProfileService } from '@/lib/profile-service';
import { LessonService } from '@/lib/lesson-service';

const instructorProfileSchema = z.object({
  certifications: z.string().trim().optional(),
});

const lessonSelectionSchema = z.object({
  lessonIds: z.array(z.number()),
});

type InstructorProfileFormValues = z.infer<typeof instructorProfileSchema>;
type LessonSelectionFormValues = z.infer<typeof lessonSelectionSchema>;

export default function ProfileSettingsPage() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  const { data: user, isLoading: isUserLoading } = useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      return user;
    }
  });

  const { data: profile, isLoading: isProfileLoading } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: () => ProfileService.getProfile(user!.id),
    enabled: !!user?.id,
  });

  const { data: lessons, isLoading: isLessonsLoading } = useQuery({
    queryKey: ['lessons'],
    queryFn: () => LessonService.getLessons(),
  });

  const { data: instructorLessonIds, isLoading: isInstructorLessonsLoading } = useQuery({
    queryKey: ['instructorLessonIds', user?.id],
    queryFn: () => LessonService.getInstructorLessonIds(user!.id),
    enabled: !!user?.id,
  });

  const profileForm = useForm<InstructorProfileFormValues>({
    resolver: zodResolver(instructorProfileSchema),
    defaultValues: {
      certifications: '',
    },
  });

  const lessonForm = useForm<LessonSelectionFormValues>({
    resolver: zodResolver(lessonSelectionSchema),
    defaultValues: {
      lessonIds: [],
    },
  });

  useEffect(() => {
    if (profile) {
      profileForm.reset({
        certifications: profile.certifications?.join(', ') || '',
      });
    }
    if (instructorLessonIds) {
      lessonForm.reset({
        lessonIds: instructorLessonIds,
      });
    }
  }, [profile, instructorLessonIds, profileForm, lessonForm]);

  const updateProfileMutation = useMutation({
    mutationFn: async (values: InstructorProfileFormValues) => {
      if (!user?.id) throw new Error("No user ID");

      const certificationsArray = values.certifications
        ? values.certifications.split(',').map((s) => s.trim()).filter(Boolean)
        : [];

      await ProfileService.updateUser(user.id, {
        certifications: certificationsArray,
      });
    },
    onSuccess: () => {
      toast.success('Profile updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
    },
    onError: (error) => {
      toast.error('Failed to update profile: ' + error.message);
    }
  });

  const updateLessonsMutation = useMutation({
    mutationFn: async (values: LessonSelectionFormValues) => {
      if (!user?.id) throw new Error("No user ID");
      await LessonService.updateInstructorLessons(user.id, values.lessonIds);
    },
    onSuccess: () => {
      toast.success('Lesson types updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['instructorLessonIds', user?.id] });
    },
    onError: (error) => {
      toast.error('Failed to update lesson types: ' + error.message);
    }
  });

  function onSubmit(values: InstructorProfileFormValues) {
    updateProfileMutation.mutate(values);
    lessonForm.handleSubmit(onLessonSubmit)();
  }

  function onLessonSubmit(values: LessonSelectionFormValues) {
    updateLessonsMutation.mutate(values);
  }

  const isLoading = isUserLoading || isProfileLoading || isLessonsLoading || isInstructorLessonsLoading;

  if (isLoading) {
    return <div className="p-4">Loading profile...</div>;
  }

  return (
    <div className="space-y-6 p-4">
      <h3 className="text-lg font-medium">Instructor Profile</h3>
      <p className="text-sm text-muted-foreground">
        Manage your professional profile, certifications, and lesson types.
      </p>
      <Form {...profileForm}>
        <form onSubmit={profileForm.handleSubmit(onSubmit)} className="space-y-8">
          <FormField
            control={profileForm.control}
            name="certifications"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Certifications</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="e.g., ISA Level 1, Red Cross First Aid (comma-separated)"
                    className="resize-y"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  List your certifications, separated by commas.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={lessonForm.control}
            name="lessonIds"
            render={() => (
              <FormItem>
                <div className="mb-4">
                  <FormLabel className="text-base">Lesson Types</FormLabel>
                  <FormDescription>
                    Select the types of lessons you are qualified to teach.
                  </FormDescription>
                </div>
                {lessons?.map((lesson) => (
                  <FormField
                    key={lesson.id}
                    control={lessonForm.control}
                    name="lessonIds"
                    render={({ field }) => {
                      return (
                        <FormItem
                          key={lesson.id}
                          className="flex flex-row items-start space-x-3 space-y-0"
                        >
                          <FormControl>
                            <Checkbox
                              checked={field.value?.includes(lesson.id)}
                              onCheckedChange={(checked) => {
                                return checked
                                  ? field.onChange([...field.value, lesson.id])
                                  : field.onChange(
                                      field.value?.filter(
                                        (value) => value !== lesson.id
                                      )
                                    )
                              }}
                            />
                          </FormControl>
                          <FormLabel className="font-normal">
                            {lesson.name}
                          </FormLabel>
                        </FormItem>
                      )
                    }}
                  />
                ))}
                <FormMessage />
              </FormItem>
            )}
          />


          <Button type="submit" disabled={updateProfileMutation.isPending || updateLessonsMutation.isPending}>
            {updateProfileMutation.isPending || updateLessonsMutation.isPending ? 'Saving...' : 'Update profile'}
          </Button>
        </form>
      </Form>
    </div>
  );
}