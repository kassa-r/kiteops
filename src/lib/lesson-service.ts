import { createClient } from '@/lib/supabase/client';

export type Lesson = {
  id: number;
  name: string;
  description: string | null;
  duration_minutes: number;
  price: number;
  active: boolean;
};

export const LessonService = {
  async getLessons(): Promise<Lesson[]> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('lessons')
      .select('*')
      .order('name');

    if (error) {
      throw new Error(error.message);
    }
    return data || [];
  },

  async getInstructorLessonIds(instructorId: string): Promise<number[]> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('instructor_lesson_types')
      .select('lesson_id')
      .eq('instructor_id', instructorId);

    if (error) {
      throw new Error(error.message);
    }
    return data ? data.map(item => item.lesson_id) : [];
  },

  async updateInstructorLessons(instructorId: string, lessonIds: number[]): Promise<void> {
    const supabase = createClient();

    // First, delete all existing lesson types for this instructor
    const { error: deleteError } = await supabase
      .from('instructor_lesson_types')
      .delete()
      .eq('instructor_id', instructorId);

    if (deleteError) {
      throw new Error(deleteError.message);
    }

    // Then, insert the new lesson types
    if (lessonIds.length > 0) {
      const links = lessonIds.map(lessonId => ({
        instructor_id: instructorId,
        lesson_id: lessonId,
      }));

      const { error: insertError } = await supabase
        .from('instructor_lesson_types')
        .insert(links);

      if (insertError) {
        throw new Error(insertError.message);
      }
    }
  },

  async createLesson(lesson: Omit<Lesson, 'id'>): Promise<Lesson> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('lessons')
      .insert(lesson)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  },

  async updateLesson(id: number, updates: Partial<Lesson>): Promise<Lesson> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('lessons')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  },
};
