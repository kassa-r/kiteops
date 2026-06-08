import { createClient } from '@/lib/supabase/client';

export interface WeatherThresholds {
  min_wind_speed: number;
  max_wind_speed: number;
  preferred_wind_directions: string[]; // e.g. ["N", "NE"]
  allow_precipitation: boolean;
}

export interface LessonType {
  id: string; // uuid
  name: string;
  description?: string;
  default_duration_minutes: number;
  price: number;
  active: boolean;
}

export interface SchoolSettings {
  weather_api_thresholds: WeatherThresholds;
  lesson_types: LessonType[];
  school_logo_url?: string;
}

export async function getSchoolSettings(): Promise<SchoolSettings> {
  console.log('Fetching settings...');
  const supabase = createClient();
  try {
    const { data, error } = await supabase.functions.invoke('manager-settings', {
      method: 'GET',
    });

    console.log('Settings fetch result:', { data, error });

    if (error) {
      console.error('Settings fetch error object:', error);
      throw new Error('Failed to fetch school settings: ' + (error.message || JSON.stringify(error)));
    }

    return data as SchoolSettings;
  } catch (err) {
    console.error('Settings fetch EXCEPTION:', err);
    throw err;
  }
}

export async function updateSchoolSettings(settings: Partial<SchoolSettings>): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.functions.invoke('manager-settings', {
    method: 'PUT',
    body: settings,
  });

  if (error) {
    throw new Error('Failed to update school settings: ' + error.message);
  }
}

export async function uploadSchoolLogo(file: File): Promise<string> {
  const supabase = createClient();
  const fileExt = file.name.split('.').pop();
  const fileName = `school-logo-${Date.now()}.${fileExt}`;
  const filePath = `logos/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('school-assets')
    .upload(filePath, file);

  if (uploadError) {
    throw new Error('Failed to upload logo: ' + uploadError.message);
  }

  const { data } = supabase.storage
    .from('school-assets')
    .getPublicUrl(filePath);

  return data.publicUrl;
}
