import { useState, useEffect, useCallback } from 'react';
import type { Settings } from '../data/types';
import { getSettings, saveSettings } from '../data/repository';

const DEFAULT_SETTINGS: Settings = {
  tone: 'gentle',
  showLetterGrades: false,
  showStreaks: true,
  scoringMode: 'momentumScore',
  scoringEmphasis: 'allTasksEqual',
  enableReminders: false,
  showFreshStartBanner: true,
};

export function useSettings() {
  const [settings, setSettingsState] = useState<Settings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const loaded = await getSettings();
      setSettingsState(loaded);
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateSettings = useCallback(async (updates: Partial<Settings>) => {
    const newSettings = { ...settings, ...updates };
    setSettingsState(newSettings);
    await saveSettings(newSettings);
  }, [settings]);

  const setTone = useCallback((tone: Settings['tone']) => {
    updateSettings({ tone });
  }, [updateSettings]);

  const toggleLetterGrades = useCallback(() => {
    updateSettings({ showLetterGrades: !settings.showLetterGrades });
  }, [settings.showLetterGrades, updateSettings]);

  const toggleStreaks = useCallback(() => {
    updateSettings({ showStreaks: !settings.showStreaks });
  }, [settings.showStreaks, updateSettings]);

  const toggleFreshStartBanner = useCallback(() => {
    updateSettings({ showFreshStartBanner: !settings.showFreshStartBanner });
  }, [settings.showFreshStartBanner, updateSettings]);

  return {
    settings,
    isLoading,
    updateSettings,
    setTone,
    toggleLetterGrades,
    toggleStreaks,
    toggleFreshStartBanner,
  };
}
