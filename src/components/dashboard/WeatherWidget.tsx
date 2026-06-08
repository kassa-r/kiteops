'use client';

import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Wind, CloudSun, AlertCircle } from 'lucide-react';

export function WeatherWidget() {
  const supabase = createClient();

  const { data: weather, isLoading, error } = useQuery({
    queryKey: ['weather'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('weather-poller');
      if (error) throw error;
      return data;
    },
    // Poll infrequently as weather doesn't change second-by-second, and we have caching
    staleTime: 1000 * 60 * 15, // 15 minutes
    refetchInterval: 1000 * 60 * 30, // 30 minutes
  });

  if (isLoading) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Local Conditions</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center py-6">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </CardContent>
        </Card>
    );
  }

  if (error) {
     return (
        <Card>
             <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Local Conditions</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex items-center gap-2 text-sm text-destructive">
                    <AlertCircle className="h-4 w-4" />
                    <span>Unavailable</span>
                </div>
            </CardContent>
        </Card>
     )
  }

  const current = weather?.current;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Local Conditions</CardTitle>
        <CloudSun className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="flex items-end gap-2">
            <div className="text-2xl font-bold">{Math.round(current?.temp || 0)}°C</div>
            <div className="text-sm text-muted-foreground mb-1 capitalize">{current?.weather?.[0]?.description}</div>
        </div>
        
        <div className="mt-4 space-y-1">
            <div className="flex items-center gap-2 text-sm">
                <Wind className="h-4 w-4 text-muted-foreground" />
                <span>{current?.wind_speed} m/s {current?.wind_direction}</span>
            </div>
             {current?.wind_gust && (
                 <div className="text-xs text-muted-foreground ml-6">
                    Gusts up to {current.wind_gust} m/s
                 </div>
             )}
        </div>
      </CardContent>
    </Card>
  );
}
