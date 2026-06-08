import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';

export interface Instructor {
  id: string;
  full_name: string;
}

export interface Customer {
  id: string;
  full_name: string;
}

export interface Lesson {
  id: number;
  name: string;
  duration_minutes: number;
}

export function useLessons() {
  const supabase = createClient();
  return useQuery({
    queryKey: ['lessons'],
    queryFn: async (): Promise<Lesson[]> => {
      const { data, error } = await supabase
        .from('lessons')
        .select('id, name, duration_minutes')
        .eq('active', true)
        .order('name');
      
      if (error) throw error;
      return data as Lesson[];
    },
  });
}

export function useInstructors() {
  const supabase = createClient();
  return useQuery({
    queryKey: ['instructors'],
    queryFn: async (): Promise<Instructor[]> => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('role', 'instructor')
        .order('full_name');
      
      if (error) throw error;
      return data as Instructor[];
    },
  });
}

export function useCustomers() {
  const supabase = createClient();
  return useQuery({
    queryKey: ['customers'],
    queryFn: async (): Promise<Customer[]> => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('role', 'customer')
        .order('full_name');
      
      if (error) throw error;
      return data as Customer[];
    },
  });
}

export function useLessonTypes() {
  const supabase = createClient();
  return useQuery({
    queryKey: ['lesson-types'],
    queryFn: async (): Promise<string[]> => {
      // Fetch unique lesson names from active lessons
      const { data, error } = await supabase
        .from('lessons')
        .select('name')
        .eq('active', true)
        .order('name');
      
      if (error) {
        console.error('Error fetching lesson types:', error);
        return [];
      }

      // Return unique names (though names should probably be unique anyway)
      return Array.from(new Set(data.map((l: any) => l.name)));
    },
  });
}
