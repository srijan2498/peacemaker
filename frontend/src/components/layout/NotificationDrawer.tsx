import React from 'react';
import { Modal } from '../ui/Modal';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../services/api';
import { Bell, CheckCheck, Clock } from 'lucide-react';
import { Button } from '../ui/Button';
import { formatDistanceToNow } from 'date-fns';
import type { NotificationSummary } from 'cozynest-shared';

import NotificationsNoneOutlinedIcon from '@mui/icons-material/NotificationsNoneOutlined';
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import MedicationOutlinedIcon from '@mui/icons-material/MedicationOutlined';
import WaterDropOutlinedIcon from '@mui/icons-material/WaterDropOutlined';
import NotificationsActiveOutlinedIcon from '@mui/icons-material/NotificationsActiveOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutlineOutlined';
import AccessTimeOutlinedIcon from '@mui/icons-material/AccessTimeOutlined';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({ isOpen, onClose }) => {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<{ notifications: NotificationSummary[]; unreadCount: number }>({
    queryKey: ['notifications'],
    queryFn: async () => {
      const res = await api.get('/notifications');
      return res.data.data;
    },
    enabled: isOpen
  });

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      await api.post('/notifications/read-all');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
  });

  const markSingleReadMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.patch(`/notifications/${id}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
  });

  const notifications = data?.notifications || [];

  const getNotificationIcon = (notif: NotificationSummary) => {
    if (notif.type === 'stock_alert') {
      if (notif.targetType === 'medication') {
        return <MedicationOutlinedIcon sx={{ fontSize: 16 }} className="text-rose-600 dark:text-rose-400" />;
      }
      return <Inventory2OutlinedIcon sx={{ fontSize: 16 }} className="text-amber-600 dark:text-amber-400" />;
    }
    if (notif.type === 'health_alert') {
      return <WaterDropOutlinedIcon sx={{ fontSize: 16 }} className="text-cyan-600 dark:text-cyan-400" />;
    }
    if (notif.type === 'budget_alert') {
      return <WarningAmberOutlinedIcon sx={{ fontSize: 16 }} className="text-orange-600 dark:text-orange-400" />;
    }
    return <NotificationsActiveOutlinedIcon sx={{ fontSize: 16 }} className="text-indigo-600 dark:text-indigo-400" />;
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Notification Center"
      description="Stay updated with health alerts, stock refills, payment reminders & family updates"
      maxWidth="md"
    >
      <div className="space-y-3">
        {notifications.length > 0 && (
          <div className="flex justify-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => markAllReadMutation.mutate()}
              isLoading={markAllReadMutation.isPending}
              className="text-xs text-cozy-lavender hover:bg-cozy-lavender-soft/60"
            >
              <CheckCircleOutlineIcon sx={{ fontSize: 16, mr: 0.5 }} />
              Mark all as read
            </Button>
          </div>
        )}

        {isLoading ? (
          <div className="space-y-2 py-4">
            <div className="h-14 bg-purple-50 dark:bg-purple-900/20 rounded-2xl animate-pulse" />
            <div className="h-14 bg-purple-50 dark:bg-purple-900/20 rounded-2xl animate-pulse" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-10">
            <div className="w-12 h-12 rounded-full bg-cozy-lavender-soft dark:bg-purple-900/30 text-cozy-lavender flex items-center justify-center mx-auto mb-2">
              <NotificationsNoneOutlinedIcon sx={{ fontSize: 28 }} />
            </div>
            <p className="text-sm font-semibold text-cozy-text dark:text-cozy-darkText">All caught up</p>
            <p className="text-xs text-cozy-muted dark:text-cozy-darkMuted mt-0.5">
              No pending alerts or notifications at this time.
            </p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
            {notifications.map(notif => (
              <div
                key={notif._id}
                onClick={() => {
                  if (!notif.isRead) markSingleReadMutation.mutate(notif._id);
                }}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                  notif.isRead
                    ? 'bg-slate-50/70 dark:bg-slate-900/20 border-slate-100 dark:border-slate-800/40 opacity-75'
                    : 'bg-cozy-lavender-soft/40 dark:bg-purple-900/30 border-purple-200/80 dark:border-purple-800/50 shadow-xs'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-white dark:bg-slate-800 border border-purple-100 dark:border-purple-900/50 flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                      {getNotificationIcon(notif)}
                    </div>
                    <div>
                      <h5 className="text-xs font-bold text-cozy-text dark:text-cozy-darkText">
                        {notif.title}
                      </h5>
                      <p className="text-xs text-cozy-muted dark:text-cozy-darkMuted mt-0.5">
                        {notif.body}
                      </p>
                    </div>
                  </div>
                  {!notif.isRead && (
                    <span className="w-2 h-2 rounded-full bg-cozy-lavender shrink-0 mt-1" />
                  )}
                </div>
                <div className="flex items-center gap-1 text-[10px] text-cozy-muted dark:text-cozy-darkMuted mt-2 pl-9">
                  <AccessTimeOutlinedIcon sx={{ fontSize: 13 }} />
                  {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
};
