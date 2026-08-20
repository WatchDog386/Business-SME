import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import { Camera, User as UserIcon, Check } from 'lucide-react';
import { authApi } from '@/api/endpoints';
import { apiErrorMessage } from '@/api/client';
import { useAuthStore } from '@/stores/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert } from '@/components/ui/alert';
import { Card } from '@/components/ui/card';
import { PageHeader } from '@/components/layout/page-header';

interface FormValues {
  fullName: string;
  phone: string;
}

export function ProfilePage() {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
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
        avatarUrl: avatarUrl || undefined,
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
    <div className="space-y-6 max-w-2xl mx-auto">
      <PageHeader
        title="My Profile"
        description="Update your personal details and profile picture."
      />

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

      <Card className="p-6">
        <form onSubmit={handleSubmit((values) => mutation.mutate(values))} className="space-y-6">
          <div className="flex flex-col sm:flex-row items-center gap-5">
            <div className="relative">
              <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full bg-accent-soft text-accent text-3xl font-bold border-2 border-edge shadow-sm">
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
                className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-accent text-white shadow-md transition-transform hover:scale-105"
                aria-label="Upload photo"
              >
                <Camera className="h-4 w-4" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageChange}
              />
            </div>
            <div className="text-center sm:text-left">
              <h3 className="text-base font-bold text-foreground">Profile Picture</h3>
              <p className="text-xs text-foreground-4 mt-0.5">
                Upload a clear photo of yourself. PNG, JPG or WEBP up to 2MB.
              </p>
              {avatarUrl && (
                <button
                  type="button"
                  onClick={() => setAvatarUrl(null)}
                  className="mt-2 text-xs font-semibold text-danger hover:underline"
                >
                  Remove photo
                </button>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                placeholder="Enter your full name"
                className="mt-1"
                {...register('fullName', { required: 'Full name is required.' })}
              />
              {errors.fullName && (
                <p className="mt-1 text-xs text-danger">{errors.fullName.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                disabled
                value={user?.email ?? ''}
                className="mt-1 bg-surface-2 cursor-not-allowed"
              />
              <p className="mt-1 text-[11px] text-foreground-5">Email address cannot be changed.</p>
            </div>

            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                placeholder="e.g. +254712345678"
                className="mt-1"
                {...register('phone')}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="submit"
              loading={mutation.isPending}
              className="rounded-full px-6"
            >
              <Check className="h-4 w-4 mr-1.5" />
              Save changes
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
