import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  BadgeCheck,
  Camera,
  Mail,
  Phone,
  Save,
  Trash2,
  User as UserIcon,
} from 'lucide-react';
import { authApi } from '@/api/endpoints';
import { AppBar } from '@/components/layout/app-bar';
import { apiErrorMessage } from '@/api/client';
import { useAuthStore } from '@/stores/auth';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert } from '@/components/ui/alert';

interface FormValues {
  fullName: string;
  phone: string;
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[15px] font-medium tracking-tight text-foreground">
      {children}
    </p>
  );
}

export function ProfilePage() {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const navigate = useNavigate();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(user?.avatarUrl ?? null);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      fullName: user?.fullName ?? '',
      phone: user?.phone ?? '',
    },
  });

  const mutation = useMutation({
    mutationFn: (values: FormValues) =>
      authApi.updateProfile({
        fullName: values.fullName,
        phone: values.phone || undefined,
        avatarUrl: avatarUrl,
      }),
    onSuccess: (updatedUser) => {
      setUser(updatedUser);
      setSuccess(true);
      setError(null);
      setTimeout(() => setSuccess(false), 3000);
    },
    onError: (err) => {
      setError(apiErrorMessage(err));
      setSuccess(false);
    },
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setError('Image size must be less than 2MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setAvatarUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <AppBar title="My Profile" onBack={() => navigate('/dashboard')} />

      {success && (
        <Alert variant="success" title="Profile updated successfully">
          Your changes have been saved.
        </Alert>
      )}

      {error && (
        <Alert variant="error" title="Could not update profile">
          {error}
        </Alert>
      )}

      <section className="flex flex-col items-center p-1 text-center">
        <div className="relative">
          <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-edge bg-accent-soft text-3xl font-medium text-accent shadow-sm">
            {avatarUrl ? (
              <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
            ) : user?.fullName ? (
              user.fullName.charAt(0).toUpperCase()
            ) : (
              <UserIcon className="h-10 w-10" />
            )}
          </div>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-accent text-white shadow-md ring-2 ring-white transition-transform hover:scale-105 active:scale-95"
            aria-label="Upload photo"
          >
            <Camera className="h-3.5 w-3.5" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageChange}
          />
        </div>

        <div className="mt-4 flex items-center gap-1.5">
          <h2 className="text-base font-medium tracking-tight text-foreground">
            {user?.fullName ?? 'Your name'}
          </h2>
          {user?.emailVerified && (
            <BadgeCheck className="h-4 w-4 text-accent" aria-label="Verified" />
          )}
        </div>

        <div className="mt-1.5 space-y-0.5">
          <p className="flex items-center justify-center gap-1.5 text-xs font-medium text-foreground-3">
            <Mail className="h-3.5 w-3.5 shrink-0" aria-hidden />
            {user?.email}
          </p>
          {(avatarUrl ?? user?.phone) && (
            <p className="flex items-center justify-center gap-1.5 text-xs font-medium text-foreground-3">
              <Phone className="h-3.5 w-3.5 shrink-0" aria-hidden />
              {user?.phone || 'Add your phone number below'}
            </p>
          )}
        </div>

        {avatarUrl && (
          <button
            type="button"
            onClick={() => setAvatarUrl(null)}
            className="mt-3 flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium text-danger transition-colors hover:bg-danger-soft"
          >
            <Trash2 className="h-3.5 w-3.5" aria-hidden />
            Remove photo
          </button>
        )}
        <p className="mt-2 text-[10px] text-foreground-5">PNG, JPG or WEBP · up to 2MB</p>
      </section>

      <section className="px-1">
        <SectionLabel>Personal details</SectionLabel>
        <form
          onSubmit={handleSubmit((values) => mutation.mutate(values))}
          className="mt-4 space-y-4"
        >
          <div>
            <Label htmlFor="fullName" className="text-xs">
              Full Name
            </Label>
            <Input
              id="fullName"
              placeholder="Enter your full name"
              className="mt-1.5"
              {...register('fullName', { required: 'Full name is required.' })}
            />
            {errors.fullName && (
              <p className="mt-1 text-xs font-medium text-danger">
                {errors.fullName.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="phone" className="text-xs">
              Phone Number
            </Label>
            <Input
              id="phone"
              placeholder="e.g. +254712345678"
              className="mt-1.5"
              {...register('phone')}
            />
          </div>

          <div>
            <Label htmlFor="email" className="text-xs">
              Email Address
            </Label>
            <div className="relative mt-1.5">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-5" aria-hidden />
              <Input
                id="email"
                type="email"
                disabled
                value={user?.email ?? ''}
                className="cursor-not-allowed bg-surface-2 pl-9 pr-20"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-surface-3 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-foreground-4">
                Locked
              </span>
            </div>
            <p className="mt-1 text-[10px] text-foreground-5">
              Email address cannot be changed.
            </p>
          </div>

          <button
            type="submit"
            disabled={mutation.isPending}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-full bg-accent text-sm font-medium text-white shadow-sm transition-colors hover:bg-accent-strong active:scale-[0.99] disabled:opacity-60"
          >
            {mutation.isPending ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-hidden />
                Saving…
              </>
            ) : (
              <>
                <Save className="h-4 w-4" aria-hidden />
                Save changes
              </>
            )}
          </button>
        </form>
      </section>
    </div>
  );
}
