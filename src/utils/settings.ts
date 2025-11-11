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
    console.log('[Settings] Retrieved from localStorage:', stored ? 'Found settings' : 'No settings found, using defaults');
    if (stored) {
      const parsed = JSON.parse(stored);
      const merged = { ...DEFAULT_SETTINGS, ...parsed };
      console.log('[Settings] Loaded settings:', {
        fdcApiKey: merged.fdcApiKey === 'DEMO_KEY' ? 'DEMO_KEY' : `Custom (length: ${merged.fdcApiKey?.length || 0})`
      });
      return merged;
    }
  } catch (error) {
    console.error('[Settings] Error loading settings:', error);
    if (error instanceof Error) {
      console.error('[Settings] Error details:', error.message, error.stack);
    }
  }
  console.log('[Settings] Returning default settings');
  return DEFAULT_SETTINGS;
}

// Save settings
export function saveSettings(settings: AppSettings): void {
  try {
    const json = JSON.stringify(settings);
    console.log('[Settings] Saving settings to localStorage:', {
      fdcApiKey: settings.fdcApiKey === 'DEMO_KEY' ? 'DEMO_KEY' : `Custom (length: ${settings.fdcApiKey?.length || 0})`
    });
    localStorage.setItem(SETTINGS_KEY, json);
    console.log('[Settings] Successfully saved to localStorage');

    // Verify the save worked
    const verification = localStorage.getItem(SETTINGS_KEY);
    if (verification === json) {
      console.log('[Settings] Verification: Settings saved correctly');
    } else {
      console.error('[Settings] Verification failed: Retrieved value does not match saved value');
    }
  } catch (error) {
    console.error('[Settings] Error saving settings:', error);
    if (error instanceof Error) {
      console.error('[Settings] Error details:', error.message, error.stack);
    }
    // Check if localStorage is available
    if (typeof localStorage === 'undefined') {
      console.error('[Settings] localStorage is not available in this environment');
    } else {
      console.error('[Settings] localStorage is available but save failed - may be in private browsing mode or storage quota exceeded');
    }
  }
}

// Get specific API key
export function getFDCApiKey(): string {
  const apiKey = getSettings().fdcApiKey || 'DEMO_KEY';
  console.log('[Settings] getFDCApiKey returning:', apiKey === 'DEMO_KEY' ? 'DEMO_KEY' : `Custom key (length: ${apiKey.length})`);
  return apiKey;
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
