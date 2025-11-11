import { useState } from 'react';
import { getSettings, saveSettings, type AppSettings } from '../utils/settings';
import { useRegisterSW } from 'virtual:pwa-register/react';

export function SettingsPage() {
  const [settings, setSettings] = useState<AppSettings>(getSettings());
  const [saved, setSaved] = useState(false);

  // PWA update detection
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r: unknown) {
      console.log('SW Registered:', r);
    },
    onRegisterError(error: unknown) {
      console.log('SW registration error', error);
    },
  });

  const handleSave = () => {
    saveSettings(settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleUpdate = () => {
    updateServiceWorker(true);
  };

  const handleCheckUpdates = () => {
    // Force service worker to check for updates
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration().then((registration) => {
        if (registration) {
          registration.update();
        }
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="bg-white border-b p-4 sticky top-0 z-10">
          <h1 className="text-2xl font-bold">Settings</h1>
        </div>

        <div className="p-4 space-y-6">
          {/* API Keys Section */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">API Keys</h2>

            <div className="space-y-4">
              {/* FDC API Key */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  USDA FoodData Central API Key
                </label>
                <input
                  type="text"
                  value={settings.fdcApiKey || ''}
                  onChange={(e) =>
                    setSettings({ ...settings, fdcApiKey: e.target.value })
                  }
                  placeholder="DEMO_KEY"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="mt-2 text-sm text-gray-600">
                  Get a free API key at{' '}
                  <a
                    href="https://fdc.nal.usda.gov/api-key-signup.html"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    fdc.nal.usda.gov/api-key-signup.html
                  </a>
                  <br />
                  DEMO_KEY has strict rate limits. A free key allows 1000 requests/hour.
                </p>
              </div>

              {/* Info about Open Food Facts */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>ℹ️ Open Food Facts</strong> doesn't require an API key.
                  All searches are free and unlimited!
                </p>
              </div>
            </div>

            <button
              onClick={handleSave}
              className="mt-4 w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700"
            >
              {saved ? '✓ Saved!' : 'Save Settings'}
            </button>
          </div>

          {/* Updates Section */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">App Updates</h2>

            {needRefresh ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                <p className="text-green-800 font-medium mb-3">
                  🎉 A new version is available!
                </p>
                <p className="text-sm text-green-700 mb-4">
                  Your data will be preserved. Click below to update to the latest version.
                </p>
                <button
                  onClick={handleUpdate}
                  className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700"
                >
                  Update Now
                </button>
                <button
                  onClick={() => setNeedRefresh(false)}
                  className="w-full mt-2 bg-gray-200 text-gray-800 py-2 rounded-lg font-medium hover:bg-gray-300"
                >
                  Remind Me Later
                </button>
              </div>
            ) : (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
                <p className="text-gray-700 mb-2">
                  ✅ You're running the latest version
                </p>
                <p className="text-sm text-gray-600">
                  Your database and all saved foods are preserved between updates.
                </p>
              </div>
            )}

            <button
              onClick={handleCheckUpdates}
              className="w-full bg-gray-600 text-white py-3 rounded-lg font-semibold hover:bg-gray-700"
            >
              Check for Updates
            </button>
          </div>

          {/* Info Section */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">About</h2>
            <div className="space-y-2 text-sm text-gray-600">
              <p><strong>App:</strong> HealthCounter</p>
              <p><strong>Version:</strong> 1.0.0</p>
              <p className="pt-2 border-t">
                <strong>Privacy:</strong> All API keys and food data are stored locally on your device.
                Nothing is sent to our servers.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
