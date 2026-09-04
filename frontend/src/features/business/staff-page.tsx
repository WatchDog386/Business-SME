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
  Building2,
  UserCheck,
  Trash2,
  Edit,
  Eye,
  Info,
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

const ROLE_OPTIONS: Array<{ value: UserRole; label: string; icon: React.ReactNode; description: string; color: string; bgColor: string; borderColor: string; permissions: string[] }> = [
  {
    value: 'OWNER',
    label: 'Owner',
    icon: <Shield className="h-4 w-4" />,
    description: 'Full access including billing, team management & business deletion',
    color: 'text-brand-600',
    bgColor: 'bg-brand-50',
    borderColor: 'border-brand-200',
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
    permissions: ['View all financial reports', 'Manage expenses', 'View sales & payments', 'Export financial data', 'Manage tax settings'],
  },
];

const STATUS_CONFIG = {
  ACTIVE: { label: 'Active', color: 'text-emerald-600 bg-emerald-50 border-emerald-200', icon: <Activity className="h-3 w-3" /> },
  PENDING: { label: 'Pending', color: 'text-amber-600 bg-amber-50 border-amber-200', icon: <Clock className="h-3 w-3" /> },
  INACTIVE: { label: 'Inactive', color: 'text-slate-600 bg-slate-50 border-slate-200', icon: <UserX className="h-3 w-3" /> },
  INVITED: { label: 'Invited', color: 'text-sky-600 bg-sky-50 border-sky-200', icon: <UserPlus className="h-3 w-3" /> },
} as const;

const MOCK_STAFF: BusinessMember[] = [
  {
    id: '1',
    role: 'OWNER',
    status: 'ACTIVE',
    createdAt: '2024-01-15T10:30:00Z',
    user: {
      id: 'user-1',
      fullName: 'James Mwangi',
      email: 'james.mwangi@biashara.co.ke',
      phone: '+254712345678',
    },
  },
  {
    id: '2',
    role: 'MANAGER',
    status: 'ACTIVE',
    createdAt: '2024-02-20T14:15:00Z',
    user: {
      id: 'user-2',
      fullName: 'Grace Wanjiku',
      email: 'grace.wanjiku@biashara.co.ke',
      phone: '+254723456789',
    },
  },
  {
    id: '3',
    role: 'EMPLOYEE',
    status: 'ACTIVE',
    createdAt: '2024-03-10T09:00:00Z',
    user: {
      id: 'user-3',
      fullName: 'Peter Ochieng',
      email: 'peter.ochieng@biashara.co.ke',
      phone: '+254734567890',
    },
  },
  {
    id: '4',
    role: 'EMPLOYEE',
    status: 'ACTIVE',
    createdAt: '2024-04-05T11:30:00Z',
    user: {
      id: 'user-4',
      fullName: 'Mary Njeri',
      email: 'mary.njeri@biashara.co.ke',
      phone: '+254745678901',
    },
  },
  {
    id: '5',
    role: 'ACCOUNTANT',
    status: 'PENDING',
    createdAt: '2024-05-12T16:45:00Z',
    user: {
      id: 'user-5',
      fullName: 'David Kiprop',
      email: 'david.kiprop@biashara.co.ke',
      phone: '+254756789012',
    },
  },
];

function RoleBadge({ role, compact = false, showIcon = true }: { role: UserRole; compact?: boolean; showIcon?: boolean }) {
  const config = ROLE_OPTIONS.find((r) => r.value === role);
  if (!config) return null;
  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium border transition-colors',
      compact ? 'px-2 py-0' : '',
      `${config.color} ${config.bgColor} ${config.borderColor}`
    )}>
      {showIcon && config.icon}
      {config.label}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.INACTIVE;
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium border', config.color)}>
      {config.icon}
      {config.label}
    </span>
  );
}

function StaffAvatar({ name, size = 'md', src }: { name: string; size?: 'sm' | 'md' | 'lg' | 'xl'; src?: string }) {
  const sizes = { sm: 'h-8 w-8 text-xs', md: 'h-10 w-10 text-sm', lg: 'h-12 w-12 text-base', xl: 'h-16 w-16 text-lg' };
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className={cn('flex items-center justify-center rounded-full bg-accent-soft text-accent font-medium overflow-hidden', sizes[size])}>
      {src ? (
        <img src={src} alt={name} className="h-full w-full object-cover" />
      ) : (
        initials
      )}
    </div>
  );
}

function StaffRow({
  member,
  currentUserId,
  onRemove,
  onRoleChange,
  onViewDetails,
}: {
  member: BusinessMember & { user: BusinessMember['user'] & { avatarUrl?: string } };
  currentUserId: string;
  onRemove: (id: string) => void;
  onRoleChange: (id: string, role: UserRole) => void;
  onViewDetails: (member: BusinessMember) => void;
}) {
  const isSelf = member.user.id === currentUserId;
  const isOwner = member.role === 'OWNER';
  const [showDropdown, setShowDropdown] = useState(false);

  return (
    <div className="relative">
      <div
        className={cn(
          'flex items-center justify-between gap-3 rounded-2xl bg-surface p-4 transition-all duration-200 border border-edge',
          'hover:bg-surface-2 hover:border-edge-2 hover:shadow-soft',
          isSelf && 'ring-1 ring-accent/20'
        )}
        onClick={() => !isSelf && onViewDetails(member)}
        style={{ cursor: isSelf ? 'default' : 'pointer' }}
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <StaffAvatar name={member.user.fullName} size="md" src={member.user.avatarUrl} />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="truncate font-medium text-foreground">{member.user.fullName}</p>
              {isSelf && (
                <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium bg-accent-soft text-accent border border-accent-soft">
                  <UserCheck className="h-3 w-3" />
                  You
                </span>
              )}
              {isOwner && !isSelf && (
                <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium bg-brand-50 text-brand-600 border border-brand-200">
                  <Star className="h-3 w-3" />
                  Owner
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 mt-1 flex-wrap">
              <p className="truncate text-sm text-foreground-4">{member.user.email}</p>
              {member.user.phone && (
                <span className="flex items-center gap-1 text-sm text-foreground-4">
                  <MessageSquare className="h-3.5 w-3.5" />
                  {member.user.phone}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <RoleBadge role={member.role} compact />
          <StatusBadge status={member.status} />

          {!isOwner && !isSelf && (
            <div className="relative">
              <button
                onClick={(e) => { e.stopPropagation(); setShowDropdown(!showDropdown); }}
                className="flex h-9 w-9 items-center justify-center rounded-xl text-foreground-4 hover:bg-surface-2 hover:text-foreground transition-colors"
                aria-label="More options"
              >
                <MoreVertical className="h-4 w-4" />
              </button>
              {showDropdown && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowDropdown(false)} />
                  <div className="absolute right-0 top-full mt-1.5 z-50 flex w-48 flex-col rounded-2xl bg-surface border border-edge shadow-xl overflow-hidden animate-fade-in">
                    <button
                      onClick={(e) => { e.stopPropagation(); onViewDetails(member); setShowDropdown(false); }}
                      className="flex items-center gap-2 px-3 py-2.5 text-sm text-foreground hover:bg-surface-2 transition-colors"
                    >
                      <Eye className="h-4 w-4" />
                      View Details
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setShowDropdown(false); }}
                      className="flex items-center gap-2 px-3 py-2.5 text-sm text-foreground hover:bg-surface-2 transition-colors"
                    >
                      <Edit className="h-4 w-4" />
                      Edit Profile
                    </button>
                    {ROLE_OPTIONS.filter((r) => r.value !== 'OWNER' && r.value !== member.role).map((role) => (
                      <button
                        key={role.value}
                        onClick={(e) => { e.stopPropagation(); onRoleChange(member.id, role.value); setShowDropdown(false); }}
                        className="flex items-center gap-2 px-3 py-2.5 text-sm text-foreground hover:bg-surface-2 transition-colors"
                      >
                        {role.icon}
                        {role.label}
                      </button>
                    ))}
                    <hr className="my-1 border-edge" />
                    <button
                      onClick={(e) => { e.stopPropagation(); onRemove(member.id); setShowDropdown(false); }}
                      className="flex items-center gap-2 px-3 py-2.5 text-sm text-red-500 hover:bg-red-50 hover:text-red-600 transition-colors"
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className="relative w-full max-w-lg rounded-3xl bg-surface border border-edge shadow-2xl animate-scale-in" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between p-5 border-b border-edge">
          <div className="flex items-center gap-3">
            <StaffAvatar name={member.user.fullName} size="xl" src={member.user.avatarUrl} />
            <div>
              <h2 className="text-lg font-medium text-foreground">{member.user.fullName}</h2>
              <p className="text-sm text-foreground-4">{member.user.email}</p>
            </div>
          </div>
          <button onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-xl text-foreground-4 hover:bg-surface-2 hover:text-foreground transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-surface-3 p-3">
              <p className="text-xs text-foreground-5 uppercase tracking-wide">Role</p>
              <div className="flex items-center gap-2 mt-1">
                <RoleBadge role={member.role} showIcon />
              </div>
            </div>
            <div className="rounded-xl bg-surface-3 p-3">
              <p className="text-xs text-foreground-5 uppercase tracking-wide">Status</p>
              <div className="flex items-center gap-2 mt-1">
                <StatusBadge status={member.status} />
              </div>
            </div>
          </div>

          <div className="rounded-xl bg-surface-3 p-3">
            <p className="text-xs text-foreground-5 uppercase tracking-wide">Member Since</p>
            <p className="text-sm font-medium text-foreground mt-1">
              {formatDate(member.createdAt)} ({timeAgo(member.createdAt)})
            </p>
          </div>

          {member.user.phone && (
            <div className="rounded-xl bg-surface-3 p-3">
              <p className="text-xs text-foreground-5 uppercase tracking-wide">Phone</p>
              <p className="text-sm font-medium text-foreground mt-1">{member.user.phone}</p>
            </div>
          )}

          {!isSelf && !isOwner && (
            <div className="space-y-3 pt-2 border-t border-edge">
              <p className="text-xs text-foreground-5 uppercase tracking-wide">Change Role</p>
              <div className="grid grid-cols-2 gap-2">
                {ROLE_OPTIONS.filter((r) => r.value !== 'OWNER' && r.value !== member.role).map((role) => (
                  <button
                    key={role.value}
                    onClick={() => { onRoleChange(member.id, role.value); onClose(); }}
                    className={cn(
                      'relative flex flex-col items-center gap-2 rounded-2xl border-2 p-3 text-center transition-all',
                      member.role === role.value
                        ? 'border-accent bg-accent-soft'
                        : 'border-edge hover:border-edge-2 hover:bg-surface-2'
                    )}
                  >
                    <div className={cn('flex h-8 w-8 items-center justify-center rounded-xl', role.bgColor)}>
                      {role.icon}
                    </div>
                    <span className="text-sm font-medium text-foreground">{role.label}</span>
                    <span className="text-[10px] text-foreground-4 text-center">{role.description}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {!isSelf && !isOwner && (
            <div className="pt-2 border-t border-edge">
              <button
                onClick={() => { onRemove(member.id); onClose(); }}
                className="w-full flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-100 transition-colors"
              >
                <Trash2 className="h-4 w-4" />
                Remove from Team
              </button>
            </div>
          )}

          {isSelf && (
            <div className="pt-2 border-t border-edge text-center text-sm text-foreground-4">
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
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in sm:items-center" onClick={onClose}>
      <div className="relative w-full max-w-md rounded-t-3xl border-t border-edge bg-surface p-6 pb-8 shadow-2xl animate-slide-up sm:max-w-lg sm:rounded-3xl sm:border sm:shadow-2xl sm:animate-scale-in" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-medium tracking-tight text-foreground">Invite Team Member</h2>
          <button onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-xl text-foreground-4 hover:bg-surface-2 hover:text-foreground transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <Label htmlFor="inviteEmail" className="text-sm font-medium text-foreground">
              Email Address
            </Label>
            <Input
              id="inviteEmail"
              type="email"
              placeholder="staff@business.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-12 px-5 text-sm rounded-2xl border-edge bg-field focus:border-accent focus:ring-accent/20"
              autoFocus
              required
              disabled={isPending}
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-foreground">Role</Label>
            <div className="grid grid-cols-2 gap-3">
              {ROLE_OPTIONS.filter((r) => r.value !== 'OWNER').map((r) => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setRole(r.value)}
                  className={cn(
                    'relative flex flex-col items-center gap-2 rounded-2xl border-2 p-4 text-center transition-all',
                    role === r.value
                      ? 'border-accent bg-accent-soft'
                      : 'border-edge hover:border-edge-2 hover:bg-surface-3'
                  )}
                >
                  <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl', r.bgColor)}>
                    {r.icon}
                  </div>
                  <span className="text-sm font-medium text-foreground">{r.label}</span>
                  <span className="text-[11px] text-foreground-4 text-center">{r.description}</span>
                  {role === r.value && (
                    <Check className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-white" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {(error || localError) && (
            <div className="flex items-center gap-2 rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-red-600 animate-fade-in">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              {error || localError}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="rounded-2xl h-12" disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" loading={isPending} className="rounded-2xl h-12 bg-brand-700 hover:bg-brand-800">
              <Mail className="h-4 w-4 me-2" />
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
    <div className="flex flex-col items-center gap-4 rounded-2xl bg-surface border border-edge p-8 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-accent-soft text-accent">
        <Users className="h-8 w-8" />
      </div>
      <div>
        <h3 className="text-lg font-medium text-foreground">No team members yet</h3>
        <p className="text-sm text-foreground-4 mt-1">Invite your first staff member to start collaborating</p>
      </div>
      <Button onClick={onInvite} className="gap-2 mt-2">
        <UserPlus className="h-4 w-4" />
        Invite Staff
      </Button>
    </div>
  );
}

function StatsCards({ members }: { members: BusinessMember[] }) {
  const stats = [
    { label: 'Total Staff', value: members.length, icon: Users, color: 'accent' },
    { label: 'Active', value: members.filter(m => m.status === 'ACTIVE').length, icon: Activity, color: 'success' },
    { label: 'Pending', value: members.filter(m => m.status === 'PENDING' || m.status === 'INVITED').length, icon: Clock, color: 'warning' },
    { label: 'Roles', value: new Set(members.map(m => m.role)).size, icon: Shield, color: 'info' },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {stats.map((stat, i) => (
        <div key={stat.label} className={cn('rounded-2xl p-4 border border-edge bg-surface transition-all hover:shadow-soft animate-fade-up', `style={{ animationDelay: '${i * 80}ms' }}`)}>
          <div className="flex items-center justify-between">
            <div className={cn('flex h-9 w-9 items-center justify-center rounded-xl', `bg-${stat.color}-50 text-${stat.color}-600`)}>
              <stat.icon className="h-4.5 w-4.5" />
            </div>
            <span className="text-2xl font-bold text-foreground">{stat.value}</span>
          </div>
          <p className="text-xs text-foreground-4 mt-2">{stat.label}</p>
        </div>
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
  const [useMockData, setUseMockData] = useState(false);

  const { data: members, isLoading, error } = useQuery({
    queryKey: ['business', active.id, 'members'],
    queryFn: () => businessesApi.members(),
  });

  const displayMembers = useMockData ? MOCK_STAFF : (members ?? []);
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
    <div className="space-y-6 pb-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-medium tracking-tight text-foreground">Team Members</h1>
          <p className="text-sm text-foreground-4 mt-0.5">Manage who has access to {active.name}</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => setUseMockData(!useMockData)}
            className="gap-2 rounded-xl h-10 px-4"
          >
            <Building2 className="h-4 w-4" />
            {useMockData ? 'Live Data' : 'Demo Data'}
          </Button>
          <Button onClick={() => { setInviteError(null); setInviteOpen(true); }} className="gap-2 rounded-xl h-10 px-4 bg-brand-700 hover:bg-brand-800">
            <UserPlus className="h-4 w-4" />
            Invite Staff
          </Button>
        </div>
      </div>

      {useMockData && (
        <div className="rounded-xl bg-sky-50 border border-sky-200 p-3 flex items-center gap-2 animate-fade-in">
          <Info className="h-4 w-4 text-sky-600 shrink-0" />
          <p className="text-sm text-sky-700">Viewing demo data. Click "Live Data" to switch back.</p>
        </div>
      )}

      {error && !useMockData && (
        <Alert variant="error" title="Failed to load team" className="rounded-xl border-destructive/20 bg-destructive/5">
          {apiErrorMessage(error)}
        </Alert>
      )}

      <StatsCards members={displayMembers} />

      {isLoading && !useMockData ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="animate-pulse flex items-center gap-3 rounded-2xl bg-surface p-4 border border-edge">
              <div className="h-10 w-10 rounded-full bg-surface-2" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-3/4 bg-surface-2 rounded" />
                <div className="h-3 w-1/2 bg-surface-2 rounded" />
              </div>
              <div className="h-6 w-20 rounded-full bg-surface-2" />
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {displayMembers.map((member) => (
            <StaffRow
              key={member.id}
              member={member}
              currentUserId={currentUserId!}
              onRemove={(id) => removeMutation.mutate(id)}
              onRoleChange={(id, role) => roleChangeMutation.mutate({ id, role })}
              onViewDetails={handleViewDetails}
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