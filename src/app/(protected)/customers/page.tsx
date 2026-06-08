'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ProfileService, CustomerProfile } from '@/lib/profile-service';
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
import { Plus, Search, Eye, Edit } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { AddCustomerModal } from '@/components/customers/AddCustomerModal';
import { EditCustomerModal } from '@/components/customers/EditCustomerModal';
import { CustomerDetailsModal } from '@/components/customers/CustomerDetailsModal';

export default function CustomersPage() {
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

  const { data: customers, isLoading, error } = useQuery({
    queryKey: ['customers', debouncedSearch],
    queryFn: () => ProfileService.getUsers('customer', debouncedSearch),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Customers</h1>
        <AddCustomerModal open={addModalOpen} onOpenChange={setAddModalOpen}>
            <Button onClick={() => setAddModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Add Customer
            </Button>
        </AddCustomerModal>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>View Customers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center py-4">
            <div className="relative w-full max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                placeholder="Search by name or email..."
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
                  <TableHead>Skill Level</TableHead>
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
                      <TableCell><Skeleton className="h-4 w-[80px]" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-8 w-[80px] ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : error ? (
                    <TableRow>
                        <TableCell colSpan={5} className="text-center text-red-500">
                            Error loading customers.
                        </TableCell>
                    </TableRow>
                ) : customers?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      No results.
                    </TableCell>
                  </TableRow>
                ) : (
                  customers?.map((customer) => (
                    <TableRow key={customer.id}>
                      <TableCell className="font-medium">{customer.name}</TableCell>
                      <TableCell>{customer.email}</TableCell>
                      <TableCell>{customer.phone || '-'}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                            {(customer as CustomerProfile).skill_level || 'Unknown'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                            <CustomerDetailsModal customer={customer as CustomerProfile}>
                                <Button variant="ghost" size="icon" title="View Details">
                                    <Eye className="h-4 w-4" />
                                </Button>
                            </CustomerDetailsModal>
                            <EditCustomerModal customer={customer as CustomerProfile}>
                                <Button variant="ghost" size="icon" title="Edit Customer">
                                    <Edit className="h-4 w-4" />
                                </Button>
                            </EditCustomerModal>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
