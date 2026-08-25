import { useQuery } from '@tanstack/react-query';
import { ShieldCheck } from 'lucide-react';
import { adminApi } from '@/api/endpoints';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyRow, PageTitle, SectionCard } from './admin-shared';

export function AdminUsersPage() {
  const usersQuery = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: adminApi.users,
  });

  return (
    <div className="space-y-4">
      <PageTitle
        title="Platform users"
        subtitle="Every account registered on your app."
      />

      {usersQuery.isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-14 rounded-2xl" />
          ))}
        </div>
      ) : (
        <SectionCard>
          <ul className="divide-y divide-edge">
            {(usersQuery.data ?? []).map((u) => (
              <li
                key={u.id}
                className="flex items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-surface-2/60"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-soft text-sm font-medium text-accent">
                    {(u.fullName || '?').charAt(0).toUpperCase()}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-medium text-foreground">
                      {u.fullName}
                      {u.isAdmin && (
                        <ShieldCheck
                          className="ml-1.5 inline h-3.5 w-3.5 text-accent"
                          aria-label="Platform admin"
                        />
                      )}
                    </p>
                    <p className="truncate text-[11px] text-foreground-5">
                      {u.email} · joined{' '}
                      {new Date(u.createdAt).toLocaleDateString('en-KE', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                </div>
                <span className="shrink-0 rounded-full bg-surface-2 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-foreground-4">
                  {u.businessCount} business{u.businessCount === 1 ? '' : 'es'}
                </span>
              </li>
            ))}
            {(usersQuery.data?.length ?? 0) === 0 && (
              <EmptyRow>No users registered yet.</EmptyRow>
            )}
          </ul>
        </SectionCard>
      )}
    </div>
  );
}
