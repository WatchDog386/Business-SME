import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Copy, KeyRound, Smartphone } from 'lucide-react';
import { clientAccessApi } from '@/api/endpoints';
import { apiErrorMessage } from '@/api/client';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useRole } from '@/hooks/use-role';
import { formatDate } from '@/lib/utils';

/** A readable temporary password: 10 letters and digits. */
function makePassword(): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  const bytes = crypto.getRandomValues(new Uint8Array(10));
  return Array.from(bytes, (b) => chars[b % chars.length]).join('');
}

/**
 * Admins (owner, manager, accountant) give a client their own app login: the
 * client then signs in on the normal sign-in page and sees only their WiFi
 * package, payments and receipts.
 */
export function ClientAppAccess({
  customerId,
  name,
  email,
  accountNumber,
}: {
  customerId: string;
  name: string;
  email: string | null;
  /** Clients sign in with this; email is optional. */
  accountNumber: string | null;
}) {
  const { isAdmin } = useRole();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ email: email ?? '', password: makePassword() });
  const [created, setCreated] = useState<{ email: string; password: string } | null>(null);
  const login = accountNumber ?? '';
  const [copied, setCopied] = useState(false);

  const access = useQuery({
    queryKey: ['client-access', customerId],
    queryFn: () => clientAccessApi.get(customerId),
    enabled: isAdmin,
  });

  const grant = useMutation({
    mutationFn: () => clientAccessApi.grant(customerId, { password: form.password, ...(form.email.trim() ? { email: form.email.trim() } : {}) }),
    onSuccess: async () => {
      setCreated({ ...form });
      await queryClient.invalidateQueries({ queryKey: ['client-access', customerId] });
    },
  });
  const revoke = useMutation({
    mutationFn: () => clientAccessApi.revoke(customerId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['client-access', customerId] }),
  });

  if (!isAdmin) return null;
  const a = access.data;
  const first = name.split(' ')[0];
  const message = created
    ? `Hello ${first}, you can now use the Optimas app to see your WiFi package and pay with M-Pesa.\nSign in at ${window.location.origin}/login\n${login ? `Account number: ${login}` : `Email: ${created.email}`}\nPassword: ${created.password}\nPlease keep it private.`
    : '';

  const openSheet = () => {
    setForm({ email: a?.email ?? email ?? '', password: makePassword() });
    setCreated(null);
    setCopied(false);
    grant.reset();
    setOpen(true);
  };

  return (
    <section className="flex items-center gap-3 rounded-2xl bg-[#F2F2F4] p-4 [.dark_&]:bg-[#1E1E1E]">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#3A8F91] text-white">
        <Smartphone className="h-5 w-5" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[14px] font-semibold text-foreground">Client app</span>
        <span className="block truncate text-[12px] text-foreground-4">
          {a?.enabled
            ? `${a.accountNumber ? `Account ${a.accountNumber}` : a.email} · since ${a.createdAt ? formatDate(a.createdAt) : '—'}`
            : `Let ${first} see their package and pay with M-Pesa`}
        </span>
      </span>
      <Button size="sm" className="shrink-0 rounded-full bg-[#3A8F91] text-white hover:bg-[#2F7F81]" onClick={openSheet}>
        <KeyRound className="h-3.5 w-3.5" />
        {a?.enabled ? 'Reset' : 'Give access'}
      </Button>

      <Dialog
        open={open}
        onOpenChange={setOpen}
        title={a?.enabled ? 'Reset app login' : 'Give app access'}
        description={
          login
            ? `${name} signs in with account number ${login} and this password, and sees only their own WiFi.`
            : `${name} signs in with this email and password and sees only their own WiFi.`
        }
      >
        {created ? (
          <div className="space-y-4">
            <Alert variant="success">Login ready. Send these details to {first}.</Alert>
            <pre className="whitespace-pre-wrap rounded-2xl bg-[#F2F2F4] p-4 text-[13px] leading-relaxed text-foreground [.dark_&]:bg-[#1E1E1E]">{message}</pre>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                className="rounded-2xl"
                onClick={async () => {
                  await navigator.clipboard.writeText(message).catch(() => undefined);
                  setCopied(true);
                }}
              >
                <Copy className="h-4 w-4" /> {copied ? 'Copied' : 'Copy'}
              </Button>
              <a
                href={`https://wa.me/?text=${encodeURIComponent(message)}`}
                target="_blank"
                rel="noreferrer"
                className="flex h-11 items-center justify-center rounded-2xl bg-[#25D366] text-[14px] font-semibold text-white"
              >
                WhatsApp
              </a>
            </div>
            <Button className="w-full rounded-2xl" onClick={() => setOpen(false)}>
              Done
            </Button>
          </div>
        ) : (
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              grant.mutate();
            }}
          >
            {grant.error && <Alert variant="error">{apiErrorMessage(grant.error)}</Alert>}
            <div>
              <Label htmlFor="client-email">{login ? "Client's email (optional)" : "Client's email"}</Label>
              <Input
                id="client-email"
                type="email"
                autoComplete="off"
                placeholder="client@example.com"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="client-password">Temporary password</Label>
              <div className="flex gap-2">
                <Input
                  id="client-password"
                  autoComplete="off"
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                />
                <Button type="button" variant="outline" className="shrink-0 rounded-full" onClick={() => setForm((f) => ({ ...f, password: makePassword() }))}>
                  New
                </Button>
              </div>
              <p className="mt-1 text-[11px] text-foreground-4">At least 8 characters. You'll be able to share it after saving.</p>
            </div>
            <div className="flex justify-between gap-3 pt-1">
              {a?.enabled ? (
                <Button type="button" variant="outline" className="text-danger" loading={revoke.isPending} onClick={() => revoke.mutate(undefined, { onSuccess: () => setOpen(false) })}>
                  Turn off
                </Button>
              ) : (
                <span />
              )}
              <Button type="submit" loading={grant.isPending} disabled={(!login && !form.email.trim()) || form.password.length < 8}>
                {a?.enabled ? 'Save new password' : 'Create login'}
              </Button>
            </div>
          </form>
        )}
      </Dialog>
    </section>
  );
}
