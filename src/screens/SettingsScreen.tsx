import { useSettings } from '../hooks/useSettings';
import { FullPageLoader } from '../components';
import { settingsDescriptions } from '../copy/microcopy';
import type { ToneType, ScoringEmphasis } from '../data/types';

interface ToggleProps {
  enabled: boolean;
  onChange: () => void;
  label: string;
  description?: string;
}

function Toggle({ enabled, onChange, label, description }: ToggleProps) {
  return (
    <div className="flex items-center justify-between py-3">
      <div className="flex-1">
        <div className="font-medium text-slate-800 dark:text-white">{label}</div>
        {description && (
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{description}</p>
        )}
      </div>
      <button
        onClick={onChange}
        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
          enabled ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-700'
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
            enabled ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
}

interface RadioGroupProps<T extends string> {
  label: string;
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: string; description?: string }[];
}

function RadioGroup<T extends string>({ label, value, onChange, options }: RadioGroupProps<T>) {
  return (
    <div className="py-3">
      <div className="font-medium text-slate-800 dark:text-white mb-3">{label}</div>
      <div className="space-y-2">
        {options.map(option => (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            className={`w-full p-3 rounded-lg border text-left transition-colors ${
              value === option.value
                ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                  value === option.value
                    ? 'border-emerald-500'
                    : 'border-slate-300 dark:border-slate-600'
                }`}
              >
                {value === option.value && (
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                )}
              </div>
              <div className="flex-1">
                <div
                  className={`font-medium ${
                    value === option.value
                      ? 'text-emerald-700 dark:text-emerald-300'
                      : 'text-slate-700 dark:text-slate-200'
                  }`}
                >
                  {option.label}
                </div>
                {option.description && (
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                    {option.description}
                  </p>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

export function SettingsScreen() {
  const { settings, isLoading, updateSettings } = useSettings();

  if (isLoading) {
    return <FullPageLoader />;
  }

  const toneOptions: { value: ToneType; label: string; description: string }[] = [
    {
      value: 'gentle',
      label: 'Gentle',
      description: settingsDescriptions.tone.gentle,
    },
    {
      value: 'coach',
      label: 'Coach',
      description: settingsDescriptions.tone.coach,
    },
    {
      value: 'minimal',
      label: 'Minimal',
      description: settingsDescriptions.tone.minimal,
    },
  ];

  const emphasisOptions: { value: ScoringEmphasis; label: string; description: string }[] = [
    {
      value: 'allTasksEqual',
      label: 'All Tasks Equal',
      description: settingsDescriptions.scoringEmphasis.allTasksEqual,
    },
    {
      value: 'consistencyFirst',
      label: 'Consistency First',
      description: settingsDescriptions.scoringEmphasis.consistencyFirst,
    },
  ];

  return (
    <div className="max-w-lg mx-auto">
      {/* Header */}
      <header className="px-5 pt-6 pb-4 safe-top">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Settings</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
          Customize your experience
        </p>
      </header>

      {/* Content */}
      <div className="px-5 pb-8 space-y-6">
        {/* Tone Section */}
        <section className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
          <RadioGroup
            label="Message Tone"
            value={settings.tone}
            onChange={(tone) => updateSettings({ tone })}
            options={toneOptions}
          />
        </section>

        {/* Display Options */}
        <section className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
          <h2 className="font-semibold text-slate-700 dark:text-slate-200 mb-2">Display</h2>
          <div className="divide-y divide-slate-100 dark:divide-slate-700">
            <Toggle
              enabled={settings.showLetterGrades}
              onChange={() => updateSettings({ showLetterGrades: !settings.showLetterGrades })}
              label="Show Letter Grades"
              description={settingsDescriptions.letterGrades}
            />
            <Toggle
              enabled={settings.showStreaks}
              onChange={() => updateSettings({ showStreaks: !settings.showStreaks })}
              label="Show Streaks"
              description={settingsDescriptions.streaks}
            />
            <Toggle
              enabled={settings.showFreshStartBanner}
              onChange={() => updateSettings({ showFreshStartBanner: !settings.showFreshStartBanner })}
              label="Fresh Start Banners"
              description={settingsDescriptions.freshStart}
            />
          </div>
        </section>

        {/* Scoring Options */}
        <section className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
          <RadioGroup
            label="Scoring Emphasis"
            value={settings.scoringEmphasis}
            onChange={(scoringEmphasis) => updateSettings({ scoringEmphasis })}
            options={emphasisOptions}
          />
        </section>

        {/* About */}
        <section className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4">
          <h2 className="font-semibold text-slate-700 dark:text-slate-200 mb-2">About Momentum</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Momentum is a habit tracker designed with evidence-based motivation principles.
            It focuses on building consistency through supportive feedback and helping you
            show up for yourself every day.
          </p>
          <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
            <p className="text-xs text-slate-400 dark:text-slate-500">
              Version 1.0.0 • Local-first • Your data stays on your device
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
