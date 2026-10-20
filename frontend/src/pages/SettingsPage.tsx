import React, { useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useThemeStore } from '../stores/themeStore';
import { api } from '../services/api';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { toast } from 'sonner';
import {
  Settings,
  Sun,
  Moon,
  Laptop,
  Baby,
  User,
  Home,
  Save,
  ShieldCheck,
  Check,
  Lock,
  Key,
  HelpCircle,
  Camera,
  Upload,
  Trash2,
  Sparkles,
  Link as LinkIcon,
  RotateCcw,
  X
} from 'lucide-react';
import DownloadOutlinedIcon from '@mui/icons-material/DownloadOutlined';
import DevicesOutlinedIcon from '@mui/icons-material/DevicesOutlined';
import CheckCircleOutlineOutlinedIcon from '@mui/icons-material/CheckCircleOutlineOutlined';
import WifiOffOutlinedIcon from '@mui/icons-material/WifiOffOutlined';
import HelpOutlineOutlinedIcon from '@mui/icons-material/HelpOutlineOutlined';
import { usePWA } from '../hooks/usePWA';

const AVATAR_PRESETS = [
  { name: 'Cozy Bot', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=Cozy' },
  { name: 'Sunny', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=Sunny' },
  { name: 'Felix', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=Felix' },
  { name: 'Whiskers', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=Whiskers' },
  { name: 'Luna', url: 'https://api.dicebear.com/7.x/lorelei/svg?seed=Luna' },
  { name: 'Milo', url: 'https://api.dicebear.com/7.x/lorelei/svg?seed=Milo' },
  { name: 'Oliver', url: 'https://api.dicebear.com/7.x/lorelei/svg?seed=Oliver' },
  { name: 'Bella', url: 'https://api.dicebear.com/7.x/fun-emoji/svg?seed=Bella' },
  { name: 'Cookie', url: 'https://api.dicebear.com/7.x/fun-emoji/svg?seed=Cookie' },
  { name: 'Sprout', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=Sprout' },
  { name: 'Pebble', url: 'https://api.dicebear.com/7.x/fun-emoji/svg?seed=Pebble' },
  { name: 'Daisy', url: 'https://api.dicebear.com/7.x/lorelei/svg?seed=Daisy' }
];

const compressAndCropImage = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('Selected file is not an image'));
      return;
    }
    const reader = new FileReader();
    reader.onload = (readerEvent) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const targetSize = 256;
        canvas.width = targetSize;
        canvas.height = targetSize;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        // Center crop to square
        const minDim = Math.min(img.width, img.height);
        const startX = (img.width - minDim) / 2;
        const startY = (img.height - minDim) / 2;

        ctx.drawImage(img, startX, startY, minDim, minDim, 0, 0, targetSize, targetSize);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.onerror = () => reject(new Error('Failed to load image file'));
      img.src = readerEvent.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
};

export const SettingsPage: React.FC = () => {
  const { user, activeFamily, childMode, setChildMode, fetchMe } = useAuthStore();
  const { theme, setTheme } = useThemeStore();
  const { isInstallable, isInstalled, platform, promptInstall, isGuideOpen, setIsGuideOpen } = usePWA();

  // Profile Form
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [nickname, setNickname] = useState(user?.nickname || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '');
  const [currency, setCurrency] = useState(user?.preferredCurrency || 'INR');
  const [timezone, setTimezone] = useState(user?.timezone || 'Asia/Kolkata');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingPhoto, setIsSavingPhoto] = useState(false);
  const [isAvatarPickerOpen, setIsAvatarPickerOpen] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [customUrlInput, setCustomUrlInput] = useState('');
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (user) {
      setFullName(user.fullName || '');
      setNickname(user.nickname || '');
      setAvatarUrl(user.avatarUrl || '');
      setCurrency(user.preferredCurrency || 'INR');
      setTimezone(user.timezone || 'Asia/Kolkata');
    }
  }, [user]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      toast.error('Image is too large. Please select a photo under 8MB.');
      return;
    }

    try {
      const compressed = await compressAndCropImage(file);
      setAvatarUrl(compressed);
      toast.success('Photo ready! Click "Save Photo" or "Save Profile" to apply.');
    } catch (err: any) {
      toast.error(err.message || 'Failed to process selected image.');
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSavePhotoOnly = async (photoToSave?: string) => {
    const target = photoToSave !== undefined ? photoToSave : avatarUrl;
    setIsSavingPhoto(true);
    try {
      await api.patch('/auth/profile', {
        avatarUrl: target
      });
      await fetchMe();
      toast.success('Profile photo updated successfully! 🌸');
    } catch (err: any) {
      toast.error('Failed to update profile photo.');
    } finally {
      setIsSavingPhoto(false);
    }
  };

  const handleRemovePhoto = async () => {
    setAvatarUrl('');
    setIsSavingPhoto(true);
    try {
      await api.patch('/auth/profile', {
        avatarUrl: ''
      });
      await fetchMe();
      toast.success('Profile photo reset to default avatar.');
    } catch (err: any) {
      toast.error('Failed to reset profile photo.');
    } finally {
      setIsSavingPhoto(false);
    }
  };

  const handleApplyCustomUrl = () => {
    if (!customUrlInput.trim()) {
      toast.error('Please enter a valid image URL.');
      return;
    }
    setAvatarUrl(customUrlInput.trim());
    setShowUrlInput(false);
    setCustomUrlInput('');
    toast.success('Custom URL photo applied! Click "Save Photo" to persist.');
  };

  // Password Change Form (No current password required)
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Family Settings Form (if admin)
  const isAdmin = activeFamily?.role === 'admin';
  const [familyName, setFamilyName] = useState(activeFamily?.name || '');
  const [familyBudget, setFamilyBudget] = useState(
    activeFamily?.monthlyBudget ? (activeFamily.monthlyBudget / 100).toString() : '0'
  );
  const [isSavingFamily, setIsSavingFamily] = useState(false);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      toast.error('New password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match.');
      return;
    }

    setIsChangingPassword(true);
    try {
      const res = await api.post('/auth/change-password', { newPassword });
      toast.success(res.data.message || 'Password changed successfully.');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      toast.error(err.message || 'Failed to update password.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    try {
      await api.patch('/auth/profile', {
        fullName: fullName.trim(),
        nickname: nickname.trim(),
        avatarUrl: avatarUrl.trim(),
        preferredCurrency: currency,
        timezone
      });
      await fetchMe();
      toast.success('Profile settings updated.');
    } catch (err: any) {
      toast.error('Failed to update profile.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleSaveFamily = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeFamily) return;
    setIsSavingFamily(true);
    try {
      await api.patch(`/families/${activeFamily._id}`, {
        name: familyName.trim(),
        monthlyBudget: parseFloat(familyBudget) || 0
      });
      await fetchMe();
      toast.success('Family workspace settings updated! 🏡');
    } catch (err: any) {
      toast.error('Failed to update family settings.');
    } finally {
      setIsSavingFamily(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto text-left">
      <div>
        <h2 className="text-xl sm:text-2xl font-black text-cozy-text dark:text-cozy-darkText tracking-tight">
          Personal & Family Settings
        </h2>
        <p className="text-xs sm:text-sm text-cozy-muted dark:text-cozy-darkMuted mt-0.5">
          Customize your appearance, child-friendly mode, profile & household budgets
        </p>
      </div>

      {/* Progressive Web App (PWA) & Device Installation */}
      <Card className="p-6 space-y-4 border-indigo-100 dark:border-indigo-950/50 bg-gradient-to-br from-indigo-50/30 via-white to-purple-50/20 dark:from-indigo-950/20 dark:to-cozy-darkCard">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <img
              src="/icons/icon-192.png"
              alt="CozyNest PWA"
              className="w-12 h-12 rounded-2xl shadow-soft-sm object-cover border border-purple-200 dark:border-purple-800"
            />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-cozy-text dark:text-cozy-darkText">
                  Device Installation & Progressive Web App (PWA)
                </h3>
                {isInstalled ? (
                  <Badge variant="mint" size="sm">
                    <CheckCircleOutlineOutlinedIcon className="w-3.5 h-3.5 mr-0.5" />
                    Installed
                  </Badge>
                ) : (
                  <Badge variant="lavender" size="sm">
                    Available to Install
                  </Badge>
                )}
              </div>
              <p className="text-xs text-cozy-muted mt-0.5">
                Install CozyNest on your phone, tablet, Mac, or PC for 100% offline access, full-screen mode, and zero browser clutter.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              id="pwa-settings-guide-btn"
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsGuideOpen(true)}
              className="text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 rounded-xl"
            >
              <HelpOutlineOutlinedIcon className="w-3.5 h-3.5 mr-1" />
              <span>Guide</span>
            </Button>
            {!isInstalled && (
              <Button
                id="pwa-settings-install-btn"
                type="button"
                variant="primary"
                size="sm"
                onClick={promptInstall}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-soft-xs"
              >
                <DownloadOutlinedIcon className="w-3.5 h-3.5 mr-1" />
                <span>Install App</span>
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          <div className="p-3 rounded-2xl bg-white/80 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-cozy-text dark:text-cozy-darkText">
              <WifiOffOutlinedIcon className="w-4 h-4 text-indigo-500" />
              <span>Offline Ready</span>
            </div>
            <p className="text-[11px] text-cozy-muted">
              Service Worker pre-caches all pages, icons, and health modules for offline resilience.
            </p>
          </div>

          <div className="p-3 rounded-2xl bg-white/80 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-cozy-text dark:text-cozy-darkText">
              <DevicesOutlinedIcon className="w-4 h-4 text-purple-500" />
              <span>All Device Support</span>
            </div>
            <p className="text-[11px] text-cozy-muted">
              Optimized for iPhone, iPad, Android, macOS Sonoma/Sequoia, Windows, and Linux.
            </p>
          </div>

          <div className="p-3 rounded-2xl bg-white/80 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-cozy-text dark:text-cozy-darkText">
              <CheckCircleOutlineOutlinedIcon className="w-4 h-4 text-emerald-500" />
              <span>Automated Updates</span>
            </div>
            <p className="text-[11px] text-cozy-muted">
              Always runs the latest release seamlessly without visiting an app store.
            </p>
          </div>
        </div>
      </Card>

      {/* Appearance & Themes */}
      <Card className="p-6 space-y-4">
        <div>
          <h3 className="text-sm font-bold text-cozy-text dark:text-cozy-darkText">
            Theme & Appearance
          </h3>
          <p className="text-xs text-cozy-muted">Choose your preferred visual aesthetic</p>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {[
            { id: 'light', label: 'Warm Light', icon: Sun },
            { id: 'dark', label: 'Cozy Dark', icon: Moon },
            { id: 'system', label: 'System Mode', icon: Laptop }
          ].map(t => {
            const Icon = t.icon;
            const isSelected = theme === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTheme(t.id as any)}
                className={`p-3.5 rounded-2xl border text-center transition-all flex flex-col items-center gap-1.5 ${
                  isSelected
                    ? 'border-cozy-lavender bg-cozy-lavender-soft/60 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 font-bold shadow-soft-sm'
                    : 'border-purple-50 dark:border-purple-900/30 bg-slate-50/50 dark:bg-slate-900/30 text-cozy-muted hover:border-purple-200'
                }`}
              >
                <Icon className="w-5 h-5 text-cozy-lavender" />
                <span className="text-xs">{t.label}</span>
              </button>
            );
          })}
        </div>
      </Card>

      {/* Child-Friendly Mode Toggle */}
      <Card className="p-6 space-y-4 bg-gradient-to-r from-pink-50/40 via-purple-50/30 to-amber-50/40 dark:from-pink-950/20 dark:via-purple-950/20 dark:to-slate-900/30">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-2xl bg-pink-100 text-pink-700 flex items-center justify-center shrink-0">
              <Baby className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-cozy-text dark:text-cozy-darkText">
                  Child-Friendly Experience
                </h3>
                {childMode && <Badge variant="pink" size="sm">Active</Badge>}
              </div>
              <p className="text-xs text-cozy-muted mt-1 leading-relaxed">
                Simplifies navigation to focus on daily schedules, reading, joyful notes, and calming
                lullaby audio while protecting sensitive financial calculations.
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              const next = !childMode;
              setChildMode(next);
              toast.success(
                next
                  ? 'Kid-Friendly mode enabled! 🧸'
                  : 'Full lifestyle and financial mode restored! 🏡'
              );
            }}
            className={`w-14 h-8 rounded-full transition-colors relative shrink-0 p-1 ${
              childMode ? 'bg-pink-400' : 'bg-slate-200 dark:bg-slate-700'
            }`}
          >
            <div
              className={`w-6 h-6 rounded-full bg-white shadow-xs transition-transform ${
                childMode ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </Card>

      {/* Profile Form */}
      <Card className="p-6 space-y-4">
        <div>
          <h3 className="text-sm font-bold text-cozy-text dark:text-cozy-darkText">
            Personal Profile
          </h3>
          <p className="text-xs text-cozy-muted">Manage your personal display preferences</p>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-4">
          {/* Profile Photo Section */}
          <div className="p-4 sm:p-5 rounded-3xl bg-slate-50/80 dark:bg-slate-900/40 border border-purple-100/70 dark:border-purple-900/30 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                {/* Avatar Preview with Camera Badge */}
                <div className="relative group shrink-0">
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl p-1 bg-gradient-to-tr from-purple-500 via-indigo-500 to-pink-500 shadow-soft-md cursor-pointer transition-transform group-hover:scale-105"
                    title="Click to upload a new profile photo"
                  >
                    <img
                      src={avatarUrl || user?.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(fullName || user?.fullName || 'Cozy')}`}
                      alt={fullName || 'User Profile Photo'}
                      className="w-full h-full rounded-[22px] object-cover bg-white dark:bg-slate-800"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(fullName || user?.fullName || 'Cozy')}`;
                      }}
                    />
                    {/* Hover Camera Overlay */}
                    <div className="absolute inset-1 rounded-[22px] bg-black/45 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white transition-opacity">
                      <Camera className="w-5 h-5 sm:w-6 sm:h-6 mb-0.5" />
                      <span className="text-[10px] font-bold">Change</span>
                    </div>
                  </div>

                  {/* Status indicator dot */}
                  <div className="absolute -bottom-1 -right-1 bg-white dark:bg-slate-800 rounded-full p-1 shadow-xs border border-purple-100 dark:border-purple-900/40">
                    <span className={`block w-3 h-3 rounded-full ${avatarUrl ? 'bg-emerald-500' : 'bg-purple-400'}`} />
                  </div>
                </div>

                {/* Text Info & Quick Badges */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-sm font-bold text-cozy-text dark:text-cozy-darkText">
                      Profile Photo
                    </h4>
                    {avatarUrl ? (
                      <Badge variant="mint" size="sm">
                        <Check className="w-3 h-3 mr-0.5" /> Custom Photo Active
                      </Badge>
                    ) : (
                      <Badge variant="lavender" size="sm">
                        Default Avatar
                      </Badge>
                    )}
                    {avatarUrl !== (user?.avatarUrl || '') && (
                      <Badge variant="pink" size="sm">
                        Unsaved Preview
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-cozy-muted dark:text-cozy-darkMuted leading-relaxed">
                    Upload your picture or pick a cozy illustrated family avatar.
                  </p>
                  <p className="text-[11px] text-cozy-muted/80">
                    Supports JPG, PNG, WebP (auto-centered square crop & optimized).
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap sm:flex-col items-stretch gap-2 shrink-0">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="profile-photo-file-input"
                />

                <Button
                  id="upload-photo-btn"
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-soft-xs"
                >
                  <Upload className="w-3.5 h-3.5 mr-1.5" /> Upload Photo
                </Button>

                <Button
                  id="choose-avatar-btn"
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setIsAvatarPickerOpen(!isAvatarPickerOpen);
                    setShowUrlInput(false);
                  }}
                  className="text-xs font-bold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/40 hover:bg-purple-100 dark:hover:bg-purple-900/50 rounded-xl"
                >
                  <Sparkles className="w-3.5 h-3.5 mr-1.5 text-purple-500" />
                  {isAvatarPickerOpen ? 'Hide Avatars' : 'Choose Avatar'}
                </Button>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setShowUrlInput(!showUrlInput);
                      setIsAvatarPickerOpen(false);
                    }}
                    className="flex-1 px-2.5 py-1.5 text-xs text-cozy-muted hover:text-cozy-text dark:hover:text-cozy-darkText rounded-xl hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors flex items-center justify-center gap-1"
                    title="Enter Image URL"
                  >
                    <LinkIcon className="w-3.5 h-3.5" />
                    <span>URL</span>
                  </button>

                  {avatarUrl && (
                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      className="flex-1 px-2.5 py-1.5 text-xs text-rose-500 hover:text-rose-600 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors flex items-center justify-center gap-1"
                      title="Remove custom photo and reset to default"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Reset</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Unsaved Photo Notice with Instant Save Button */}
            {avatarUrl !== (user?.avatarUrl || '') && (
              <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fade-in">
                <div className="flex items-center gap-2 text-xs text-amber-800 dark:text-amber-300">
                  <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
                  <span>You selected a new profile photo! Click <strong>Save Photo</strong> to apply it now.</span>
                </div>
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  isLoading={isSavingPhoto}
                  onClick={() => handleSavePhotoOnly()}
                  className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shrink-0"
                >
                  <Save className="w-3.5 h-3.5 mr-1" /> Save Photo
                </Button>
              </div>
            )}

            {/* Web Image URL Input Drawer */}
            {showUrlInput && (
              <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-800 border border-purple-100 dark:border-purple-900/40 space-y-2 animate-fade-in">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-cozy-text dark:text-cozy-darkText">
                    Paste Direct Image Link (HTTPS)
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowUrlInput(false)}
                    className="text-cozy-muted hover:text-cozy-text"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="flex gap-2">
                  <input
                    type="url"
                    placeholder="https://example.com/my-profile-pic.jpg"
                    value={customUrlInput}
                    onChange={(e) => setCustomUrlInput(e.target.value)}
                    className="flex-1 bg-slate-50 dark:bg-slate-900 border border-purple-100 dark:border-purple-900/50 rounded-xl px-3 py-2 text-xs text-cozy-text dark:text-cozy-darkText outline-none focus:border-cozy-lavender"
                  />
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={handleApplyCustomUrl}
                    className="text-xs font-bold rounded-xl"
                  >
                    Apply
                  </Button>
                </div>
              </div>
            )}

            {/* Cozy Avatar Presets Grid */}
            {isAvatarPickerOpen && (
              <div className="space-y-2.5 pt-2 animate-fade-in border-t border-purple-100/60 dark:border-purple-900/30">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-cozy-text dark:text-cozy-darkText flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-purple-500" />
                    Pick a Cozy Family Avatar
                  </span>
                  <span className="text-[11px] text-cozy-muted">Click any avatar to select</span>
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
                  {AVATAR_PRESETS.map((preset) => {
                    const isSelected = avatarUrl === preset.url;
                    return (
                      <button
                        key={preset.name}
                        type="button"
                        onClick={() => {
                          setAvatarUrl(preset.url);
                          toast.success(`Selected "${preset.name}"! Click Save Photo to apply.`);
                        }}
                        className={`group relative p-2 rounded-2xl border transition-all flex flex-col items-center gap-1.5 ${
                          isSelected
                            ? 'border-indigo-500 bg-indigo-50/80 dark:bg-indigo-950/60 ring-2 ring-indigo-400/50 shadow-soft-xs scale-105'
                            : 'border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-800 hover:border-purple-300 hover:bg-purple-50/40'
                        }`}
                      >
                        <img
                          src={preset.url}
                          alt={preset.name}
                          className="w-12 h-12 rounded-xl object-cover group-hover:scale-110 transition-transform"
                        />
                        <span className="text-[10px] font-semibold text-cozy-text dark:text-cozy-darkText truncate max-w-full">
                          {preset.name}
                        </span>
                        {isSelected && (
                          <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                            <Check className="w-2.5 h-2.5" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Full Name"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              required
            />
            <Input
              label="Preferred Nickname"
              placeholder="e.g. Shrey, Mom, Dad"
              value={nickname}
              onChange={e => setNickname(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-cozy-text dark:text-cozy-darkText">
                Preferred Currency
              </label>
              <select
                value={currency}
                onChange={e => setCurrency(e.target.value)}
                className="w-full bg-white dark:bg-cozy-darkCard border border-purple-100 dark:border-purple-900/40 rounded-2xl px-3 py-2.5 text-sm text-cozy-text dark:text-cozy-darkText outline-none focus:border-cozy-lavender"
              >
                <option value="INR">INR (₹) - Indian Rupee</option>
                <option value="USD">USD ($) - US Dollar</option>
                <option value="EUR">EUR (€) - Euro</option>
                <option value="GBP">GBP (£) - British Pound</option>
                <option value="CAD">CAD (CA$) - Canadian Dollar</option>
                <option value="AUD">AUD (A$) - Australian Dollar</option>
                <option value="SGD">SGD (S$) - Singapore Dollar</option>
                <option value="JPY">JPY (¥) - Japanese Yen</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-cozy-text dark:text-cozy-darkText">
                Timezone
              </label>
              <select
                value={timezone}
                onChange={e => setTimezone(e.target.value)}
                className="w-full bg-white dark:bg-cozy-darkCard border border-purple-100 dark:border-purple-900/40 rounded-2xl px-3 py-2.5 text-sm text-cozy-text dark:text-cozy-darkText outline-none focus:border-cozy-lavender"
              >
                <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                <option value="America/New_York">America/New_York (EST)</option>
                <option value="Europe/London">Europe/London (GMT)</option>
                <option value="America/Los_Angeles">America/Los_Angeles (PST)</option>
                <option value="Europe/Paris">Europe/Paris (CET)</option>
                <option value="Asia/Tokyo">Asia/Tokyo (JST)</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button type="submit" variant="primary" size="sm" isLoading={isSavingProfile}>
              <Save className="w-3.5 h-3.5 mr-1" /> Save Profile
            </Button>
          </div>
        </form>
      </Card>

      {/* Security & Password (Change password without current password) */}
      <Card className="p-6 space-y-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-cozy-text dark:text-cozy-darkText">
              Security & Password
            </h3>
            <Badge variant="lavender" size="sm">No Current Password Needed 🔓</Badge>
          </div>
          <p className="text-xs text-cozy-muted mt-0.5">
            You are securely logged in. You can change your password directly without providing your current password.
          </p>
        </div>

        {/* Display configured security question if present */}
        {user?.securityQuestion && (
          <div className="p-3.5 rounded-2xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/30 flex items-start gap-3">
            <HelpCircle className="w-5 h-5 text-cozy-lavender shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-cozy-text dark:text-cozy-darkText">
                Configured Security Question
              </p>
              <p className="text-xs text-cozy-muted dark:text-cozy-darkMuted mt-0.5">
                "{user.securityQuestion}"
              </p>
              <p className="text-[11px] text-purple-600 dark:text-purple-400 mt-1">
                ✓ Used to safely recover your account if you ever forget your password.
              </p>
            </div>
          </div>
        )}

        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="New Password"
              type="password"
              placeholder="••••••••"
              leftIcon={<Lock className="w-4 h-4" />}
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              required
              hint="Minimum 6 characters"
            />
            <Input
              label="Confirm New Password"
              type="password"
              placeholder="••••••••"
              leftIcon={<Key className="w-4 h-4" />}
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          <div className="flex justify-end pt-2">
            <Button type="submit" variant="primary" size="sm" isLoading={isChangingPassword}>
              <Check className="w-3.5 h-3.5 mr-1" /> Update Password
            </Button>
          </div>
        </form>
      </Card>

      {/* Family Settings (If Admin) */}
      {isAdmin && (
        <Card className="p-6 space-y-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-cozy-text dark:text-cozy-darkText">
                Family Workspace Settings
              </h3>
              <Badge variant="yellow" size="sm">Admin Only</Badge>
            </div>
            <p className="text-xs text-cozy-muted">Manage household monthly budget and details</p>
          </div>

          <form onSubmit={handleSaveFamily} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Family Workspace Name"
                value={familyName}
                onChange={e => setFamilyName(e.target.value)}
                required
              />
              <Input
                label={`Monthly Spending Target Budget (${currency})`}
                type="number"
                step="0.01"
                value={familyBudget}
                onChange={e => setFamilyBudget(e.target.value)}
                hint="Used for budget tracking in Dashboard & Analytics"
              />
            </div>

            <div className="flex justify-end pt-2">
              <Button type="submit" variant="primary" size="sm" isLoading={isSavingFamily}>
                <Save className="w-3.5 h-3.5 mr-1" /> Save Family Settings
              </Button>
            </div>
          </form>
        </Card>
      )}
    </div>
  );
};
