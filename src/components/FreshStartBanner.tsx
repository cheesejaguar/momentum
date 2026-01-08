import { useState, useEffect } from 'react';
import type { ToneType } from '../data/types';
import { getCopy, freshStartMessages } from '../copy/microcopy';
import { getLastOpenDate, saveLastOpenDate } from '../data/repository';
import { getLocalDateString, getWeekStart } from '../utils/date';

interface FreshStartBannerProps {
  tone: ToneType;
  showBanner: boolean;
}

type BannerType = 'newDay' | 'newWeek' | 'welcomeBack' | null;

export function FreshStartBanner({ tone, showBanner }: FreshStartBannerProps) {
  const [bannerType, setBannerType] = useState<BannerType>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!showBanner) {
      return;
    }

    checkFreshStart();
  }, [showBanner]);

  const checkFreshStart = async () => {
    const today = getLocalDateString();
    const lastOpen = await getLastOpenDate();

    if (!lastOpen) {
      // First time user - no banner needed, just save today's date
      await saveLastOpenDate(today);
      return;
    }

    if (lastOpen === today) {
      // Already opened today - no banner needed
      return;
    }

    // Calculate days since last open
    const lastDate = new Date(lastOpen + 'T00:00:00');
    const todayDate = new Date(today + 'T00:00:00');
    const daysDiff = Math.floor((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

    // Check if it's a new week
    const lastWeekStart = getWeekStart(lastOpen);
    const thisWeekStart = getWeekStart(today);
    const isNewWeek = lastWeekStart !== thisWeekStart;

    // Determine banner type
    if (daysDiff > 3) {
      setBannerType('welcomeBack');
    } else if (isNewWeek) {
      setBannerType('newWeek');
    } else if (daysDiff >= 1) {
      setBannerType('newDay');
    }

    // Save today's date
    await saveLastOpenDate(today);

    // Show banner with animation
    setIsVisible(true);
  };

  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(() => setBannerType(null), 300);
  };

  if (!bannerType || !isVisible) {
    return null;
  }

  const getMessage = () => {
    switch (bannerType) {
      case 'newDay':
        return getCopy(freshStartMessages.newDay, tone);
      case 'newWeek':
        return getCopy(freshStartMessages.newWeek, tone);
      case 'welcomeBack':
        return getCopy(freshStartMessages.encourageReturn, tone);
      default:
        return '';
    }
  };

  const getIcon = () => {
    switch (bannerType) {
      case 'newWeek':
        return '🌟';
      case 'welcomeBack':
        return '👋';
      default:
        return '☀️';
    }
  };

  const getBgColor = () => {
    switch (bannerType) {
      case 'newWeek':
        return 'bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 border-purple-100 dark:border-purple-800';
      case 'welcomeBack':
        return 'bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-amber-100 dark:border-amber-800';
      default:
        return 'bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border-blue-100 dark:border-blue-800';
    }
  };

  const getTextColor = () => {
    switch (bannerType) {
      case 'newWeek':
        return 'text-purple-700 dark:text-purple-300';
      case 'welcomeBack':
        return 'text-amber-700 dark:text-amber-300';
      default:
        return 'text-blue-700 dark:text-blue-300';
    }
  };

  return (
    <div
      className={`mb-4 p-4 rounded-xl border transition-all duration-300 ${getBgColor()} ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
      }`}
    >
      <div className="flex items-start gap-3">
        <span className="text-2xl flex-shrink-0">{getIcon()}</span>
        <div className="flex-1">
          <p className={`font-medium ${getTextColor()}`}>
            {getMessage()}
          </p>
        </div>
        <button
          onClick={handleDismiss}
          className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg hover:bg-white/50 dark:hover:bg-slate-800/50 transition-colors"
          aria-label="Dismiss"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
