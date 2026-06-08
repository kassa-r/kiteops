'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { WeatherThresholds } from '@/lib/settings-service';
import { useUpdateSchoolSettings } from '@/lib/hooks/useSchoolSettings';
import { useEffect } from 'react';

const weatherSchema = z.object({
  min_wind_speed: z.coerce.number().min(0, 'Must be positive'),
  max_wind_speed: z.coerce.number().min(0, 'Must be positive'),
  allow_precipitation: z.boolean(),
  preferred_wind_directions: z.string(), // Comma-separated string in form
}).refine((data) => data.min_wind_speed <= data.max_wind_speed, {
  message: "Minimum wind speed cannot be greater than maximum wind speed",
  path: ["min_wind_speed"],
});

interface WeatherParamsFormProps {
  initialData?: WeatherThresholds;
}

export function WeatherParamsForm({ initialData }: WeatherParamsFormProps) {
  const updateSettings = useUpdateSchoolSettings();

  const form = useForm<z.infer<typeof weatherSchema>>({
    resolver: zodResolver(weatherSchema) as any,
    defaultValues: {
      min_wind_speed: initialData?.min_wind_speed ?? 10,
      max_wind_speed: initialData?.max_wind_speed ?? 30,
      allow_precipitation: initialData?.allow_precipitation ?? false,
      preferred_wind_directions: initialData?.preferred_wind_directions?.join(', ') ?? '',
    },
  });

  // Reset form when initialData loads
  useEffect(() => {
    if (initialData) {
      form.reset({
        min_wind_speed: initialData.min_wind_speed,
        max_wind_speed: initialData.max_wind_speed,
        allow_precipitation: initialData.allow_precipitation,
        preferred_wind_directions: initialData.preferred_wind_directions.join(', '),
      });
    }
  }, [initialData, form]);

  function onSubmit(values: z.infer<typeof weatherSchema>) {
    const directions = values.preferred_wind_directions.split(',').map(s => s.trim()).filter(Boolean);
    
    updateSettings.mutate({
      weather_api_thresholds: {
        min_wind_speed: values.min_wind_speed,
        max_wind_speed: values.max_wind_speed,
        allow_precipitation: values.allow_precipitation,
        preferred_wind_directions: directions, 
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Weather Parameters</CardTitle>
        <CardDescription>Configure the weather rules for the Intelligent Scheduling Engine.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="min_wind_speed"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Min Wind Speed (knots)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="max_wind_speed"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Max Wind Speed (knots)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="preferred_wind_directions"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Preferred Wind Directions (comma separated, e.g. N, NE, SW)</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="allow_precipitation"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      Allow Precipitation
                    </FormLabel>
                    <FormDescription>
                      Check if lessons can proceed during rain (light precipitation).
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />

            <Button type="submit" disabled={updateSettings.isPending}>
              {updateSettings.isPending ? 'Saving...' : 'Save Weather Settings'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
