'use client';

import React from 'react';
import { useResolutionCenterData } from '@/lib/hooks/useManagerDashboard';
import ResolutionConflictItem from './ResolutionConflictItem';
import { Skeleton } from '@/components/ui/skeleton';

const ResolutionCenter = () => {
  const { conflictedBookings, isLoading, error } = useResolutionCenterData();

  if (isLoading) {
    return (
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Resolution Center</h1>
        <div className="space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Resolution Center</h1>
        <div className="text-red-500">Error fetching data: {error.message}</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Resolution Center</h1>
      {conflictedBookings && conflictedBookings.length > 0 ? (
        <div className="space-y-4">
          {conflictedBookings.map((booking) => (
            <ResolutionConflictItem key={booking.id} booking={booking} />
          ))}
        </div>
      ) : (
        <p>No weather-related conflicts to resolve at this time.</p>
      )}
    </div>
  );
};

export default ResolutionCenter;
