'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ProfileService, InstructorProfile } from '@/lib/profile-service';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus, Search, Eye, Edit, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { AddInstructorModal } from '@/components/instructors/AddInstructorModal';
import { EditInstructorModal } from '@/components/instructors/EditInstructorModal';
import { DeleteInstructorModal } from '@/components/instructors/DeleteInstructorModal';

export default function InstructorsPage() {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [addModalOpen, setAddModalOpen] = useState(false);

  // Debounce search input
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    const timeoutId = setTimeout(() => {
        setDebouncedSearch(e.target.value);
    }, 500);
    return () => clearTimeout(timeoutId);
  };

  const { data: instructors, isLoading, error } = useQuery({
    queryKey: ['instructors', debouncedSearch],
    queryFn: () => ProfileService.getUsers('instructor', debouncedSearch),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Instructors</h1>
        <AddInstructorModal open={addModalOpen} onOpenChange={setAddModalOpen}>
            <Button onClick={() => setAddModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Add Instructor
            </Button>
        </AddInstructorModal>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Manage Instructors</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center py-4">
            <div className="relative w-full max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                placeholder="Search by name..."
                value={search}
                onChange={handleSearchChange}
                className="pl-8"
                />
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Certifications</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-[150px]" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-[200px]" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-[150px]" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-[80px]" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-8 w-[100px] ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : error ? (
                    <TableRow>
                        <TableCell colSpan={6} className="text-center text-red-500">
                            Error loading instructors.
                        </TableCell>
                    </TableRow>
                ) : instructors?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      No results.
                    </TableCell>
                  </TableRow>
                ) : (
                  instructors?.map((instructor) => {
                      const profile = instructor as InstructorProfile;
                      return (
                        <TableRow key={instructor.id}>
                        <TableCell className="font-medium">{instructor.name}</TableCell>
                        <TableCell>{instructor.email}</TableCell>
                        <TableCell>{instructor.phone || '-'}</TableCell>
                        <TableCell>
                            <div className="flex flex-wrap gap-1">
                                {profile.certifications?.map((cert, i) => (
                                    <Badge key={i} variant="outline" className="text-xs">
                                        {cert}
                                    </Badge>
                                )) || '-'}
                            </div>
                        </TableCell>
                        <TableCell>
                            <Badge variant={profile.status === 'active' ? 'default' : 'secondary'}>
                                {profile.status || 'Active'}
                            </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                                <EditInstructorModal instructor={profile}>
                                    <Button variant="ghost" size="icon" title="Edit">
                                        <Edit className="h-4 w-4" />
                                    </Button>
                                </EditInstructorModal>
                                <DeleteInstructorModal instructorId={profile.id!} instructorName={profile.name}>
                                    <Button variant="ghost" size="icon" title="Delete" className="text-red-500 hover:text-red-600">
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </DeleteInstructorModal>
                            </div>
                        </TableCell>
                        </TableRow>
                      );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
