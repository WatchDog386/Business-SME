import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Scissors, Clock } from 'lucide-react';
import { servicesApi } from '@/api/endpoints';
import { apiErrorMessage } from '@/api/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog } from '@/components/ui/dialog';
import { Alert } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/layout/page-header';
import { Card } from '@/components/ui/card';
import { formatKES } from '@/lib/utils';
import { ServiceForm } from './service-form';
import type { Service } from '@/api/types';

export function ServicesPage() {
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);

  useEffect(() => {
    if (searchParams.get('new') === '1') setFormOpen(true);
  }, [searchParams]);
  const [editService, setEditService] = useState<Service | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Service | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ['services', { search: debouncedSearch }],
    queryFn: () => servicesApi.list({ search: debouncedSearch || undefined, active: true }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => servicesApi.remove(id),
    onSuccess: async () => {
      setConfirmDelete(null);
      setDeleteError(null);
      await queryClient.invalidateQueries({ queryKey: ['services'] });
    },
    onError: (err) => setDeleteError(apiErrorMessage(err)),
  });

  return (
    <div className="space-y-5">
      <PageHeader
        title="Services"
        description="Work you charge for — like haircuts, braiding and treatments."
        actions={
          <Button onClick={() => setFormOpen(true)}>
            <Plus className="h-4 w-4" />
            Add service
          </Button>
        }
      />

      <div className="relative sm:max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-5" aria-hidden />
        <Input
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            window.setTimeout(() => setDebouncedSearch(event.target.value), 300);
          }}
          placeholder="Search services..."
          className="pl-9"
        />
      </div>

      {error && (
        <Alert variant="error" title="Could not load services">
          {apiErrorMessage(error)}
        </Alert>
      )}

      {isLoading && (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-2xl" />
          ))}
        </div>
      )}

      {data && data.length === 0 && (
        <EmptyState
          icon={Scissors}
          title={debouncedSearch ? 'No services found' : 'No services yet'}
          description={
            debouncedSearch
              ? 'Try a different search term.'
              : 'Add the services you offer so you can sell them in seconds.'
          }
          actionLabel={debouncedSearch ? undefined : 'Add a service'}
          onAction={() => setFormOpen(true)}
        />
      )}

      {data && data.length > 0 && (
        <Card>
          <ul className="divide-y divide-edge">
            {data.map((service) => (
              <li key={service.id} className="px-4 py-3 sm:px-5">
                <div className="flex items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-foreground">
                      {service.name}
                    </p>
                    <p className="truncate text-xs text-foreground-5">
                      {service.description ?? 'No description'}
                    </p>
                  </div>
                  {service.duration_minutes && (
                    <Badge variant="secondary" className="hidden sm:inline-flex">
                      <Clock className="h-3 w-3" />
                      {service.duration_minutes} min
                    </Badge>
                  )}
                  <p className="text-sm font-bold text-foreground">
                    {formatKES(service.price)}
                  </p>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditService(service)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-danger hover:bg-danger-soft"
                      onClick={() => setConfirmDelete(service)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Dialog
        open={formOpen}
        onOpenChange={setFormOpen}
        title="Add a service"
        description="A service is something you do for a customer, like a haircut."
      >
        <ServiceForm onClose={() => setFormOpen(false)} />
      </Dialog>

      <Dialog
        open={Boolean(editService)}
        onOpenChange={(open) => !open && setEditService(null)}
        title="Edit service"
      >
        {editService && (
          <ServiceForm
            onClose={() => setEditService(null)}
            defaultValues={editService}
          />
        )}
      </Dialog>

      <Dialog
        open={Boolean(confirmDelete)}
        onOpenChange={(open) => !open && setConfirmDelete(null)}
        title="Delete service?"
        description={`"${confirmDelete?.name}" will be permanently removed. Services that have been sold cannot be deleted.`}
      >
        <div className="space-y-4">
          {deleteError && <Alert variant="error">{deleteError}</Alert>}
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setConfirmDelete(null)}
              disabled={deleteMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              loading={deleteMutation.isPending}
              onClick={() =>
                confirmDelete && deleteMutation.mutate(confirmDelete.id)
              }
            >
              Delete service
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
