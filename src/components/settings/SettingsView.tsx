'use client';

import { useSchoolSettings, useLessonsQuery } from '@/lib/hooks/useSchoolSettings';
import { WeatherParamsForm } from './WeatherParamsForm';
import { LessonTypesList } from './LessonTypesList';
import { BrandingForm } from './BrandingForm';

export function SettingsView() {
  const { data: settings, isLoading: isSettingsLoading, error: settingsError } = useSchoolSettings();
  const { data: lessons, isLoading: isLessonsLoading, error: lessonsError } = useLessonsQuery();

  if (isSettingsLoading || isLessonsLoading) {
    return <div className="p-8">Loading settings...</div>;
  }

  if (settingsError) {
    return <div className="p-8 text-red-500">Error loading settings: {settingsError.message}</div>;
  }

  if (lessonsError) {
    return <div className="p-8 text-red-500">Error loading lessons: {lessonsError.message}</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">School Settings</h1>
        <p className="text-muted-foreground">
          Manage your school's configuration, weather rules, and offerings.
        </p>
      </div>

      <div className="grid gap-6">
        <WeatherParamsForm initialData={settings?.weather_api_thresholds} />
        <LessonTypesList lessonTypes={lessons} />
        <BrandingForm initialLogoUrl={settings?.school_logo_url} />
      </div>
    </div>
  );
}
