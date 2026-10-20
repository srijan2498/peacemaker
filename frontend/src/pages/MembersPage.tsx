import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { useAuthStore } from '../stores/authStore';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Badge } from '../components/ui/Badge';
import { Skeleton } from '../components/ui/Skeleton';
import { toast } from 'sonner';
import {
  Users,
  UserPlus,
  Crown,
  Shield,
  Copy,
  Check,
  Trash2,
  Calendar,
  Sparkles
} from 'lucide-react';

export const MembersPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { user, activeFamily } = useAuthStore();
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Fetch Members
  const { data, isLoading } = useQuery({
    queryKey: ['members', activeFamily?._id],
    queryFn: async () => {
      const res = await api.get(`/families/${activeFamily?._id}/members`);
      return res.data.data;
    },
    enabled: !!activeFamily?._id
  });

  const generateInviteMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post(`/families/${activeFamily?._id}/invitations`, {
        maximumUses: 10,
        expiresInDays: 7
      });
      return res.data.data;
    },
    onSuccess: (data: any) => {
      setGeneratedCode(data.code);
      toast.success('Invitation code created!');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to generate invitation.');
    }
  });

  const removeMemberMutation = useMutation({
    mutationFn: async (memberUserId: string) => {
      await api.delete(`/families/${activeFamily?._id}/members/${memberUserId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] });
      toast.success('Member removed.');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to remove member.');
    }
  });

  const members = data?.members || [];
  const isAdmin = activeFamily?.role === 'admin';

  const copyCodeToClipboard = () => {
    if (!generatedCode) return;
    navigator.clipboard.writeText(generatedCode);
    setCopied(true);
    toast.success('Code copied to clipboard! 📋');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-cozy-text dark:text-cozy-darkText tracking-tight">
            Family Members
          </h2>
          <p className="text-xs sm:text-sm text-cozy-muted dark:text-cozy-darkMuted mt-0.5">
            Collaborators sharing household expenses in {activeFamily?.name}
          </p>
        </div>

        {isAdmin && (
          <Button
            variant="primary"
            onClick={() => {
              setGeneratedCode(null);
              setIsInviteModalOpen(true);
              generateInviteMutation.mutate();
            }}
            className="shadow-soft-sm"
          >
            <UserPlus className="w-4 h-4 mr-1.5" /> Invite Member
          </Button>
        )}
      </div>

      {/* Members Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Skeleton className="h-32 rounded-3xl" />
          <Skeleton className="h-32 rounded-3xl" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {members.map((m: any) => {
            const isMe = m.userId === user?._id;
            const isMemberAdmin = m.role === 'admin';

            return (
              <Card
                key={m._id}
                className="p-5 space-y-3 bg-white dark:bg-cozy-darkCard border-purple-100 dark:border-purple-900/40"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <img
                      src={m.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(m.fullName || 'Cozy')}`}
                      alt={m.fullName}
                      className="w-12 h-12 rounded-2xl bg-slate-50 border-2 border-purple-100 dark:border-purple-800 object-cover shrink-0 shadow-xs"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(m.fullName || 'Cozy')}`;
                      }}
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-sm font-bold text-cozy-text dark:text-cozy-darkText truncate">
                          {m.nickname || m.fullName}
                        </h4>
                        {isMe && <Badge variant="lavender" size="sm">You</Badge>}
                      </div>
                      <p className="text-[11px] text-cozy-muted truncate">{m.email}</p>
                    </div>
                  </div>

                  <Badge variant={isMemberAdmin ? 'yellow' : 'mint'} size="sm">
                    {isMemberAdmin ? (
                      <span className="flex items-center gap-1 font-bold">
                        <Crown className="w-3 h-3 text-amber-500" /> Admin
                      </span>
                    ) : (
                      'Member'
                    )}
                  </Badge>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-purple-50 dark:border-purple-900/20 text-xs text-cozy-muted">
                  <span className="flex items-center gap-1 text-[11px]">
                    <Calendar className="w-3.5 h-3.5" />
                    Joined {new Date(m.joinedAt).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
                  </span>

                  {/* Admin can remove other members */}
                  {isAdmin && !isMe && !isMemberAdmin && (
                    <button
                      onClick={() => removeMemberMutation.mutate(m.userId)}
                      className="text-rose-500 hover:underline text-[11px] font-bold"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Invitation Modal */}
      <Modal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        title="Invite Family Member"
        description="Share this code with your spouse, parents, or siblings to let them join"
        maxWidth="sm"
      >
        <div className="space-y-4 py-2 text-center">
          {generateInviteMutation.isPending ? (
            <div className="py-6">
              <Skeleton className="h-14 rounded-2xl" />
            </div>
          ) : (
            <div className="p-5 rounded-3xl bg-purple-50 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-800/40 space-y-2">
              <p className="text-[10px] font-bold text-purple-600 dark:text-purple-300 uppercase tracking-wider">
                Invitation Code
              </p>
              <p className="text-2xl font-black text-purple-800 dark:text-purple-100 tracking-wider font-mono">
                {generatedCode}
              </p>
              <p className="text-[11px] text-cozy-muted">
                Valid for 7 days • Up to 10 uses
              </p>
            </div>
          )}

          <Button
            variant="primary"
            size="lg"
            className="w-full"
            onClick={copyCodeToClipboard}
            disabled={!generatedCode}
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 mr-1.5" /> Copied!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 mr-1.5" /> Copy Code
              </>
            )}
          </Button>

          <p className="text-[11px] text-cozy-muted leading-relaxed">
            Your family member can enter this code in the onboarding screen or under Family Switcher &gt; Join with Invite Code.
          </p>
        </div>
      </Modal>
    </div>
  );
};
