import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarcodeScanner } from '../components/BarcodeScanner';
import { lookupBarcode } from '../api/openFoodFacts';
import { getFoodBySourceKey, createFood } from '../db/foodRepository';

export function ScanPage() {
  const navigate = useNavigate();
  const [scanning, setScanning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleScan = async (barcode: string) => {
    console.log('Scanned barcode:', barcode);
    setLoading(true);
    setError(null);

    try {
      // First, check if we have this barcode in local cache
      let food = await getFoodBySourceKey('OFF', barcode);

      if (food) {
        console.log('Found in local cache');
        // Navigate to food detail page
        navigate(`/food/${food.id}`);
        return;
      }

      // Not in cache, fetch from Open Food Facts
      console.log('Fetching from Open Food Facts...');
      const offFood = await lookupBarcode(barcode);

      if (!offFood) {
        setError(`Product not found for barcode: ${barcode}`);
        setLoading(false);
        return;
      }

      // Save to local database
      const savedFood = await createFood(
        {
          name: offFood.name,
          brand: offFood.brand,
          source: 'OFF',
          source_key: barcode,
          state: offFood.state,
          grams_per_serving: offFood.grams_per_serving,
          confidence: offFood.confidence,
        },
        offFood.nutrients
      );

      // Navigate to food detail page
      navigate(`/food/${savedFood.id}`);
    } catch (err) {
      console.error('Scan error:', err);
      setError('An error occurred while looking up the barcode');
      setLoading(false);
    }
  };

  const handleError = (errorMsg: string) => {
    setError(errorMsg);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg">Looking up product...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow p-6 text-center">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold mb-2">Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => {
              setError(null);
              setScanning(true);
            }}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700"
          >
            Try Again
          </button>
          <button
            onClick={() => navigate('/')}
            className="w-full mt-2 bg-gray-200 text-gray-800 py-3 rounded-lg font-semibold hover:bg-gray-300"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  if (!scanning) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow p-6 text-center">
          <div className="text-6xl mb-4">📷</div>
          <h1 className="text-2xl font-bold mb-2">Scan Barcode</h1>
          <p className="text-gray-600 mb-6">
            Scan product barcodes to quickly look up nutrition information from Open Food Facts.
          </p>
          <button
            onClick={() => setScanning(true)}
            className="w-full bg-blue-600 text-white py-4 rounded-lg font-semibold text-lg hover:bg-blue-700"
          >
            Open Scanner
          </button>
          <button
            onClick={() => navigate('/')}
            className="w-full mt-3 text-gray-600 py-2"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen relative">
      <BarcodeScanner onScan={handleScan} onError={handleError} />
      {/* Close button overlay */}
      <button
        onClick={() => {
          setScanning(false);
          navigate('/');
        }}
        className="absolute top-4 left-4 bg-white/90 text-gray-800 px-4 py-2 rounded-lg font-semibold shadow-lg hover:bg-white z-50"
      >
        ✕ Close
      </button>
    </div>
  );
}
