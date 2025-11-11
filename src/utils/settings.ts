// Settings storage using localStorage
// API keys are stored locally and never committed to git

const SETTINGS_KEY = 'healthcounter_settings';

export interface AppSettings {
  fdcApiKey?: string;
  // Add more API keys here if needed in the future
  // offApiKey?: string; // Open Food Facts doesn't require API key
}

// Default settings
const DEFAULT_SETTINGS: AppSettings = {
  fdcApiKey: 'DEMO_KEY', // Default to DEMO_KEY
};

// Get all settings
export function getSettings(): AppSettings {
  try {
    const stored = localStorage.getItem(SETTINGS_KEY);
    if (stored) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
    }
  } catch (error) {
    console.error('Error loading settings:', error);
  }
  return DEFAULT_SETTINGS;
}

// Save settings
export function saveSettings(settings: AppSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error('Error saving settings:', error);
  }
}

// Get specific API key
export function getFDCApiKey(): string {
  return getSettings().fdcApiKey || 'DEMO_KEY';
}

// Update specific setting
export function updateSetting<K extends keyof AppSettings>(
  key: K,
  value: AppSettings[K]
): void {
  const settings = getSettings();
  settings[key] = value;
  saveSettings(settings);
}
