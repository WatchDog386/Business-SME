import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Navigate } from 'react-router-dom';
import {
  Mail,
  UserPlus,
  UserX,
  Shield,
  Briefcase,
  Users,
  Calculator,
  MoreVertical,
  Check,
  X,
  AlertTriangle,
  Activity,
  Clock,
  Star,
  MessageSquare,
  UserCheck,
  Trash2,
  Edit,
  Eye,
} from 'lucide-react';
import { useAuthStore } from '@/stores/auth';
import { useActiveBusiness } from '@/stores/business';
import { businessesApi } from '@/api/endpoints';
import type { UserRole, BusinessMember } from '@/api/types';
import { api, apiErrorMessage } from '@/api/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert } from '@/components/ui/alert';
import { PopupMessage } from '@/components/ui/popup-message';
import { cn } from '@/lib/utils';
import { formatDate, timeAgo } from '@/lib/utils';
import {
  PageTitle,
} from '@/features/admin/admin-shared';

const ROLE_OPTIONS: Array<{ value: UserRole; label: string; icon: React.ReactNode; description: string; color: string; bgColor: string; borderColor: string; gradient: string; permissions: string[] }> = [
  {
    value: 'OWNER',
    label: 'Owner',
    icon: <Shield className="h-4 w-4" />,
    description: 'Full access including billing, team management & business deletion',
    color: 'text-brand-600',
    bgColor: 'bg-brand-50',
    borderColor: 'border-brand-200',
    gradient: 'from-brand-700 via-brand-900 to-brand-950',
    permissions: ['All permissions', 'Manage billing & subscription', 'Delete business', 'Transfer ownership', 'Manage all staff roles'],
  },
  {
    value: 'MANAGER',
    label: 'Manager',
    icon: <Briefcase className="h-4 w-4" />,
    description: 'Manage products, sales, expenses, customers & staff',
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-200',
    gradient: 'from-emerald-800 via-green-900 to-emerald-950',
    permissions: ['Manage products & services', 'Record & view all sales', 'Manage expenses', 'Manage customers', 'Invite & manage staff (except Owner)', 'View all reports'],
  },
  {
    value: 'EMPLOYEE',
    label: 'Employee',
    icon: <Users className="h-4 w-4" />,
    description: 'Record sales, view assigned customers & products',
    color: 'text-sky-600',
    bgColor: 'bg-sky-50',
    borderColor: 'border-sky-200',
    gradient: 'from-sky-700 via-blue-900 to-sky-950',
    permissions: ['Record sales', 'View assigned products', 'View assigned customers', 'Basic sales reports'],
  },
  {
    value: 'ACCOUNTANT',
    label: 'Accountant',
    icon: <Calculator className="h-4 w-4" />,
    description: 'View financial reports, expenses & manage transactions',
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    gradient: 'from-amber-700 via-orange-800 to-orange-950',
    permissions: ['View all financial reports', 'Manage expenses', 'View sales & payments', 'Export financial data', 'Manage tax settings'],
  },
];

const STATUS_CONFIG = {
  ACTIVE: { label: 'Active', gradient: 'from-emerald-600 to-emerald-800', icon: <Activity className="h-3 w-3" /> },
  PENDING: { label: 'Pending', gradient: 'from-amber-600 to-amber-800', icon: <Clock className="h-3 w-3" /> },
  INACTIVE: { label: 'Inactive', gradient: 'from-slate-500 to-slate-700', icon: <UserX className="h-3 w-3" /> },
  INVITED: { label: 'Invited', gradient: 'from-sky-600 to-sky-800', icon: <UserPlus className="h-3 w-3" /> },
} as const;

const AVATAR_IMAGES = [
  'https://i.pinimg.com/1200x/77/71/4d/77714db652c343cfabf1c51a20e403ff.jpg',
  'https://i.pinimg.com/736x/0a/50/bc/0a50bc5d50f5ebff9a626f1307780287.jpg',
  'https://i.pinimg.com/736x/56/b9/90/56b9904ab763d88bbc1fe87cb9e827b4.jpg',
  'https://i.pinimg.com/736x/0f/31/8d/0f318da21f16078d14d65da44f8628bb.jpg',
  'https://i.pinimg.com/736x/3a/2f/1c/3a2f1c8e8f9b0c4d5e6f7a8b9c0d1e2f.jpg',
  'https://i.pinimg.com/736x/1a/2b/3c/1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d.jpg',
];

function StatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.INACTIVE;
  return (
    <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium text-white">
      <span className={`flex h-3 w-3 items-center justify-center bg-gradient-to-r ${config.gradient} rounded-full`}>
        {config.icon}
      </span>
      {config.label}
    </span>
  );
}

function StaffAvatar({ name, size = 'md', src, index = 0 }: { name: string; size?: 'sm' | 'md' | 'lg' | 'xl'; src?: string; index?: number }) {
  const sizes = { sm: 'h-8 w-8 text-xs', md: 'h-10 w-10 text-sm', lg: 'h-12 w-12 text-base', xl: 'h-16 w-16 text-lg' };
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const bgImage = AVATAR_IMAGES[index % AVATAR_IMAGES.length];

  return (
    <div
      className={cn('flex items-center justify-center rounded-full overflow-hidden relative', sizes[size])}
      style={{
        backgroundImage: `url(${bgImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-black/30 via-black/10 to-transparent" aria-hidden />
      {src ? (
        <img src={src} alt={name} className="h-full w-full object-cover relative z-10" />
      ) : (
        <span className="relative z-10 text-white font-bold drop-shadow-md">{initials}</span>
      )}
    </div>
  );
}

function GradientStat({
  icon,
  label,
  value,
  gradient,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  gradient: string;
}) {
  return (
    <div
      className={`relative flex h-[104px] flex-col justify-between overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br p-3.5 shadow-lg ${gradient}`}
    >
      <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent" aria-hidden />
      <div className="relative flex items-start justify-between gap-2">
        <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-white/80">{label}</p>
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/15 text-white backdrop-blur">
          {icon}
        </span>
      </div>
      <p className="relative text-2xl font-black leading-none tracking-tight tabular-nums text-white drop-shadow-[0_1px_5px_rgba(0,0,0,0.55)]">
        {value}
      </p>
    </div>
  );
}

function StaffRow({
  member,
  currentUserId,
  onRemove,
  onRoleChange,
  onViewDetails,
  index,
}: {
  member: BusinessMember & { user: BusinessMember['user'] & { avatarUrl?: string } };
  currentUserId: string;
  onRemove: (id: string) => void;
  onRoleChange: (id: string, role: UserRole) => void;
  onViewDetails: (member: BusinessMember) => void;
  index: number;
}) {
  const isSelf = member.user.id === currentUserId;
  const isOwner = member.role === 'OWNER';
  const [showDropdown, setShowDropdown] = useState(false);
  const roleConfig = ROLE_OPTIONS.find((r) => r.value === member.role);

  const bgImage = AVATAR_IMAGES[index % AVATAR_IMAGES.length];

  return (
    <div className="relative">
      <div
        className={cn(
          'relative flex items-center justify-between gap-3 overflow-hidden rounded-2xl border border-white/10 p-4 transition-all duration-200 shadow-xl',
          'hover:border-white/20 hover:shadow-2xl',
          isSelf && 'ring-1 ring-accent/30',
          isOwner && 'ring-1 ring-brand-500/30'
        )}
        onClick={() => !isSelf && onViewDetails(member)}
        style={{
          cursor: isSelf ? 'default' : 'pointer',
          backgroundImage: `url(${bgImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-black/60 via-black/40 to-black/50" aria-hidden />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" aria-hidden />
        <div className="absolute inset-0 ring-1 ring-white/10 rounded-2xl" aria-hidden />
        
        <div className="relative flex items-center gap-3 min-w-0 flex-1">
          <StaffAvatar name={member.user.fullName} size="md" src={member.user.avatarUrl} index={index} />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="truncate font-medium text-white drop-shadow-sm">{member.user.fullName}</p>
              {isSelf && (
                <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium bg-white/15 text-white border border-white/10 backdrop-blur-sm">
                  <UserCheck className="h-3 w-3" />
                  You
                </span>
              )}
              {isOwner && !isSelf && (
                <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium bg-brand-500/20 text-brand-300 border border-brand-500/30 backdrop-blur-sm">
                  <Star className="h-3 w-3" />
                  Owner
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 mt-1 flex-wrap">
              <p className="truncate text-sm text-white/70">{member.user.email}</p>
              {member.user.phone && (
                <span className="flex items-center gap-1 text-sm text-white/70">
                  <MessageSquare className="h-3.5 w-3.5" />
                  {member.user.phone}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="relative flex items-center gap-2 shrink-0">
          <span className={cn(
            'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium border transition-colors',
            'bg-white/10 border-white/10 text-white/90 backdrop-blur-sm'
          )}>
            {roleConfig?.icon}
            {roleConfig?.label}
          </span>
          <StatusBadge status={member.status} />

          {!isOwner && !isSelf && (
            <div className="relative">
              <button
                onClick={(e) => { e.stopPropagation(); setShowDropdown(!showDropdown); }}
                className="flex h-9 w-9 items-center justify-center rounded-xl text-white/60 hover:bg-white/10 hover:text-white transition-colors backdrop-blur-sm"
                aria-label="More options"
              >
                <MoreVertical className="h-4 w-4" />
              </button>
              {showDropdown && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowDropdown(false)} />
                  <div className="absolute right-0 top-full mt-1.5 z-50 flex w-48 flex-col rounded-2xl bg-slate-900/95 border border-white/10 shadow-2xl overflow-hidden animate-fade-in backdrop-blur-xl">
                    <button
                      onClick={(e) => { e.stopPropagation(); onViewDetails(member); setShowDropdown(false); }}
                      className="flex items-center gap-2 px-3 py-2.5 text-sm text-white/90 hover:bg-white/10 transition-colors"
                    >
                      <Eye className="h-4 w-4" />
                      View Details
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setShowDropdown(false); }}
                      className="flex items-center gap-2 px-3 py-2.5 text-sm text-white/90 hover:bg-white/10 transition-colors"
                    >
                      <Edit className="h-4 w-4" />
                      Edit Profile
                    </button>
                    {ROLE_OPTIONS.filter((r) => r.value !== 'OWNER' && r.value !== member.role).map((role) => (
                      <button
                        key={role.value}
                        onClick={(e) => { e.stopPropagation(); onRoleChange(member.id, role.value); setShowDropdown(false); }}
                        className="flex items-center gap-2 px-3 py-2.5 text-sm text-white/90 hover:bg-white/10 transition-colors"
                      >
                        {role.icon}
                        {role.label}
                      </button>
                    ))}
                    <hr className="my-1 border-white/10" />
                    <button
                      onClick={(e) => { e.stopPropagation(); onRemove(member.id); setShowDropdown(false); }}
                      className="flex items-center gap-2 px-3 py-2.5 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                      Remove from Team
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StaffDetailModal({ member, onClose, onRoleChange, onRemove, currentUserId }: {
  member: BusinessMember & { user: BusinessMember['user'] & { avatarUrl?: string } };
  onClose: () => void;
  onRoleChange: (id: string, role: UserRole) => void;
  onRemove: (id: string) => void;
  currentUserId: string;
}) {
  const isSelf = member.user.id === currentUserId;
  const isOwner = member.role === 'OWNER';
  const roleConfig = ROLE_OPTIONS.find((r) => r.value === member.role);
  const statusConfig = STATUS_CONFIG[member.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.INACTIVE;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className="relative w-full max-w-lg rounded-3xl border border-white/10 bg-slate-900/95 shadow-2xl animate-scale-in backdrop-blur-xl" onClick={(e) => e.stopPropagation()}>
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent" aria-hidden />
        
        <div className="relative flex items-start justify-between p-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <StaffAvatar name={member.user.fullName} size="xl" src={member.user.avatarUrl} />
            <div>
              <h2 className="text-lg font-medium text-white">{member.user.fullName}</h2>
              <p className="text-sm text-white/60">{member.user.email}</p>
            </div>
          </div>
          <button onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-xl text-white/50 hover:bg-white/10 hover:text-white transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="relative p-5 space-y-5">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-white/5 p-3 border border-white/10">
              <p className="text-xs text-white/40 uppercase tracking-wide">Role</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium bg-white/10 border border-white/10 text-white/90 backdrop-blur-sm">
                  {roleConfig?.icon}
                  {roleConfig?.label}
                </span>
              </div>
            </div>
            <div className="rounded-xl bg-white/5 p-3 border border-white/10">
              <p className="text-xs text-white/40 uppercase tracking-wide">Status</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium text-white">
                  <span className={`flex h-3 w-3 items-center justify-center bg-gradient-to-r ${statusConfig.gradient} rounded-full`}>
                    {statusConfig.icon}
                  </span>
                  {statusConfig.label}
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-xl bg-white/5 p-3 border border-white/10">
            <p className="text-xs text-white/40 uppercase tracking-wide">Member Since</p>
            <p className="text-sm font-medium text-white mt-1">
              {formatDate(member.createdAt)} ({timeAgo(member.createdAt)})
            </p>
          </div>

          {member.user.phone && (
            <div className="rounded-xl bg-white/5 p-3 border border-white/10">
              <p className="text-xs text-white/40 uppercase tracking-wide">Phone</p>
              <p className="text-sm font-medium text-white mt-1">{member.user.phone}</p>
            </div>
          )}

          {!isSelf && !isOwner && (
            <div className="space-y-3 pt-2 border-t border-white/10">
              <p className="text-xs text-white/40 uppercase tracking-wide">Change Role</p>
              <div className="grid grid-cols-2 gap-2">
                {ROLE_OPTIONS.filter((r) => r.value !== 'OWNER' && r.value !== member.role).map((role) => (
                  <button
                    key={role.value}
                    onClick={() => { onRoleChange(member.id, role.value); onClose(); }}
                    className={cn(
                      'relative flex flex-col items-center gap-2 rounded-2xl border-2 p-3 text-center transition-all',
                      'bg-white/5 border-white/10 hover:border-white/20 hover:bg-white/10'
                    )}
                  >
                    <div className={`flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br ${role.gradient}`}>
                      {role.icon}
                    </div>
                    <span className="text-sm font-medium text-white">{role.label}</span>
                    <span className="text-[10px] text-white/50 text-center">{role.description}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {!isSelf && !isOwner && (
            <div className="pt-2 border-t border-white/10">
              <button
                onClick={() => { onRemove(member.id); onClose(); }}
                className="w-full flex items-center justify-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm font-medium text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-colors"
              >
                <Trash2 className="h-4 w-4" />
                Remove from Team
              </button>
            </div>
          )}

          {isSelf && (
            <div className="pt-2 border-t border-white/10 text-center text-sm text-white/50">
              You cannot remove yourself or change your own role.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function InviteModal({ isOpen, onClose, onInvite, isPending, error }: {
  isOpen: boolean;
  onClose: () => void;
  onInvite: (email: string, role: UserRole) => void;
  isPending: boolean;
  error: string | null;
}) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('EMPLOYEE');
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLocalError(null);
    onInvite(email.trim(), role);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in sm:items-center" onClick={onClose}>
      <div className="relative w-full max-w-md rounded-t-3xl border-t border-white/10 bg-slate-900/95 p-6 pb-8 shadow-2xl animate-slide-up sm:max-w-lg sm:rounded-3xl sm:border sm:shadow-2xl sm:animate-scale-in backdrop-blur-xl" onClick={(e) => e.stopPropagation()}>
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent" aria-hidden />
        
        <div className="relative flex items-center justify-between mb-5">
          <h2 className="text-base font-medium tracking-tight text-white">Invite Team Member</h2>
          <button onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-xl text-white/50 hover:bg-white/10 hover:text-white transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="relative space-y-5">
          <div className="space-y-1.5">
            <Label htmlFor="inviteEmail" className="text-sm font-medium text-white">
              Email Address
            </Label>
            <Input
              id="inviteEmail"
              type="email"
              placeholder="staff@business.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-12 px-5 text-sm rounded-2xl border-white/10 bg-white/5 text-white placeholder-white/30 focus:border-accent focus:ring-accent/20 focus:bg-white/10 disabled:opacity-50"
              autoFocus
              required
              disabled={isPending}
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-white">Role</Label>
            <div className="grid grid-cols-2 gap-3">
              {ROLE_OPTIONS.filter((r) => r.value !== 'OWNER').map((r) => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setRole(r.value)}
                  className={cn(
                    'relative flex flex-col items-center gap-2 rounded-2xl border-2 p-4 text-center transition-all',
                    role === r.value
                      ? 'border-accent bg-accent/10'
                      : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'
                  )}
                >
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${r.gradient}`}>
                    {r.icon}
                  </div>
                  <span className="text-sm font-medium text-white">{r.label}</span>
                  <span className="text-[11px] text-white/50 text-center">{r.description}</span>
                  {role === r.value && (
                    <Check className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-white" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {(error || localError) && (
            <div className="flex items-center gap-2 rounded-xl bg-red-500/10 border border-red-500/30 p-3 text-sm text-red-400 animate-fade-in">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              {error || localError}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="rounded-2xl h-12 border-white/10 text-white hover:bg-white/10" disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" loading={isPending} className="flex h-12 shrink-0 items-center justify-center gap-2 rounded-full bg-brand-600 px-6 text-sm font-medium text-white shadow-sm transition-all hover:bg-brand-700 active:scale-[0.98] disabled:opacity-60">
              <Mail className="h-4 w-4" />
              Send Invitation
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EmptyState({ onInvite }: { onInvite: () => void }) {
  return (
    <div className="relative flex flex-col items-center gap-4 rounded-2xl p-8 text-center border border-white/10 bg-slate-900/50 backdrop-blur-sm">
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent rounded-2xl" aria-hidden />
      <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 border border-white/10">
        <Users className="h-8 w-8 text-white/80" />
      </div>
      <div className="relative">
        <h3 className="text-lg font-medium text-white">No team members yet</h3>
        <p className="text-sm text-white/50 mt-1">Invite your first staff member to start collaborating</p>
      </div>
      <Button onClick={onInvite} className="gap-2 mt-2 flex h-10 shrink-0 items-center gap-2 rounded-full bg-brand-600 px-4 text-sm font-medium text-white shadow-sm transition-all hover:bg-brand-700 active:scale-[0.98]">
        <UserPlus className="h-4 w-4" />
        Invite Staff
      </Button>
    </div>
  );
}

function StatsCards({ members }: { members: BusinessMember[] }) {
  const stats = [
    { label: 'Total Staff', value: members.length, icon: Users, gradient: 'from-brand-700 via-brand-900 to-brand-950' },
    { label: 'Active', value: members.filter(m => m.status === 'ACTIVE').length, icon: Activity, gradient: 'from-emerald-800 via-green-900 to-emerald-950' },
    { label: 'Pending', value: members.filter(m => m.status === 'PENDING' || m.status === 'INVITED').length, icon: Clock, gradient: 'from-amber-700 via-orange-800 to-orange-950' },
    { label: 'Roles', value: new Set(members.map(m => m.role)).size, icon: Shield, gradient: 'from-purple-700 via-purple-900 to-fuchsia-950' },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {stats.map((stat) => (
        <GradientStat
          key={stat.label}
          icon={<stat.icon className="h-3.5 w-3.5" aria-hidden />}
          label={stat.label}
          value={String(stat.value)}
          gradient={stat.gradient}
        />
      ))}
    </div>
  );
}

export function StaffPage() {
  const user = useAuthStore((s) => s.user);
  const active = useActiveBusiness();
  const queryClient = useQueryClient();

  if (!active) return <Navigate to="/onboarding" replace />;

  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [selectedMember, setSelectedMember] = useState<BusinessMember | null>(null);

  const { data: members, isLoading, error } = useQuery({
    queryKey: ['business', active.id, 'members'],
    queryFn: () => businessesApi.members(),
  });

  const displayMembers = members ?? [];
  const currentUserId = user?.id;

  const inviteMutation = useMutation({
    mutationFn: ({ email, role }: { email: string; role: UserRole }) => businessesApi.addMember(email, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business', active.id, 'members'] });
      setInviteOpen(false);
      setInviteError(null);
    },
    onError: (err) => {
      setInviteError(apiErrorMessage(err));
      console.error('Invite failed:', err);
    },
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => api<{ success: boolean }>({ method: 'DELETE', url: `/businesses/current/members/${id}` }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['business', active.id, 'members'] }),
  });

  const roleChangeMutation = useMutation({
    mutationFn: ({ id, role }: { id: string; role: UserRole }) =>
      api<{ success: boolean }>({ method: 'PATCH', url: `/businesses/current/members/${id}`, data: { role } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['business', active.id, 'members'] }),
  });

  const handleInvite = (email: string, role: UserRole) => {
    inviteMutation.mutate({ email, role });
  };

  const handleViewDetails = (member: BusinessMember) => {
    setSelectedMember(member);
  };

  const handleCloseDetails = () => {
    setSelectedMember(null);
  };

  return (
    <div className="space-y-5 pb-8 animate-fade-in">
      <PageTitle
        title="Team Members"
        subtitle={`Manage who has access to ${active.name}`}
      />

      <div className="flex items-center justify-between gap-3">
        <h2 className="text-[13px] font-medium tracking-tight text-foreground">Team Overview</h2>
        <Button
          onClick={() => { setInviteError(null); setInviteOpen(true); }}
          className="flex h-10 shrink-0 items-center gap-2 rounded-full bg-brand-600 px-4 text-sm font-medium text-white shadow-sm transition-all hover:bg-brand-700 active:scale-[0.98] disabled:opacity-60"
        >
          <UserPlus className="h-4 w-4" />
          Invite Staff
        </Button>
      </div>

      {error && (
        <Alert variant="error" title="Failed to load team" className="rounded-xl border-destructive/20 bg-destructive/5">
          {apiErrorMessage(error)}
        </Alert>
      )}

      <StatsCards members={displayMembers} />

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((_, idx) => (
            <div key={idx} className="animate-pulse relative overflow-hidden rounded-2xl border border-white/10 p-4">
              <div className="absolute inset-0 bg-slate-900/50" aria-hidden />
              <div className="relative flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-white/10" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-3/4 bg-white/10 rounded" />
                  <div className="h-3 w-1/2 bg-white/10 rounded" />
                </div>
                <div className="h-6 w-20 rounded-full bg-white/10" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {displayMembers.map((member, index) => (
            <StaffRow
              key={member.id}
              member={member}
              currentUserId={currentUserId!}
              onRemove={(id) => removeMutation.mutate(id)}
              onRoleChange={(id, role) => roleChangeMutation.mutate({ id, role })}
              onViewDetails={handleViewDetails}
              index={index}
            />
          ))}
          {displayMembers.length === 0 && <EmptyState onInvite={() => { setInviteError(null); setInviteOpen(true); }} />}
        </div>
      )}

      <PopupMessage
        isOpen={inviteMutation.isPending}
        type="loading"
        title="Sending invitation..."
      />
      <PopupMessage
        isOpen={!!inviteError}
        type="error"
        title="Invitation Failed"
        message={inviteError ?? undefined}
        onClose={() => setInviteError(null)}
      />
      <PopupMessage
        isOpen={removeMutation.isPending || roleChangeMutation.isPending}
        type="loading"
        title={removeMutation.isPending ? 'Removing member...' : 'Updating role...'}
      />

      <InviteModal
        isOpen={inviteOpen}
        onClose={() => setInviteOpen(false)}
        onInvite={handleInvite}
        isPending={inviteMutation.isPending}
        error={inviteError}
      />

      {selectedMember && (
        <StaffDetailModal
          member={selectedMember}
          onClose={handleCloseDetails}
          onRoleChange={(id, role) => roleChangeMutation.mutate({ id, role })}
          onRemove={(id) => removeMutation.mutate(id)}
          currentUserId={currentUserId!}
        />
      )}
    </div>
  );
}