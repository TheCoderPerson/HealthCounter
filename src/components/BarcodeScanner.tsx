import { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader } from '@zxing/browser';

interface BarcodeScannerProps {
  onScan: (barcode: string) => void;
  onError?: (error: string) => void;
}

export function BarcodeScanner({ onScan, onError }: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
  const processingRef = useRef(false); // Prevent multiple scans

  useEffect(() => {
    // Initialize reader without hints (will scan all common formats)
    readerRef.current = new BrowserMultiFormatReader();

    return () => {
      stopScanning();
    };
  }, []);

  const startScanning = async () => {
    if (!videoRef.current || !readerRef.current) return;

    try {
      processingRef.current = false; // Reset processing flag
      setIsScanning(true);
      setHasPermission(true);

      // Request camera with optimized settings
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      // Start continuous decoding
      await readerRef.current.decodeFromVideoDevice(
        undefined, // Use default camera
        videoRef.current,
        (result, error) => {
          if (result && !processingRef.current) {
            processingRef.current = true; // Prevent multiple scans
            const barcode = result.getText();
            console.log('Barcode detected:', barcode);
            // Stop scanning BEFORE calling onScan to prevent multiple detections
            stopScanning();
            onScan(barcode);
          }
          // Ignore decode errors (they happen frequently while scanning)
          if (error && !(error.name === 'NotFoundException')) {
            console.error('Scan error:', error);
          }
        }
      );
    } catch (err) {
      console.error('Camera error:', err);
      setHasPermission(false);
      setIsScanning(false);
      onError?.('Camera permission denied or not available');
    }
  };

  const stopScanning = () => {
    // Stop the ZXing reader continuous decode loop
    if (readerRef.current) {
      try {
        // TypeScript doesn't know about stopContinuousDecode, but it exists on the reader
        (readerRef.current as any).stopContinuousDecode();
      } catch (err) {
        console.error('Error stopping scanner:', err);
      }
    }

    // Stop the video stream
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }

    setIsScanning(false);
  };

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center bg-black">
      {hasPermission === false && (
        <div className="absolute inset-0 flex items-center justify-center p-4 bg-black text-white text-center">
          <div>
            <p className="mb-4">Camera permission is required to scan barcodes.</p>
            <button
              onClick={startScanning}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold"
            >
              Grant Permission
            </button>
          </div>
        </div>
      )}

      <video
        ref={videoRef}
        className="w-full h-full object-cover"
        autoPlay
        playsInline
        muted
      />

      {/* Scanning overlay with guide box */}
      {isScanning && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="relative">
            {/* Guide box */}
            <div className="w-64 h-40 border-4 border-blue-500 rounded-lg shadow-lg">
              {/* Corner markers */}
              <div className="absolute -top-1 -left-1 w-8 h-8 border-l-4 border-t-4 border-white rounded-tl-lg" />
              <div className="absolute -top-1 -right-1 w-8 h-8 border-r-4 border-t-4 border-white rounded-tr-lg" />
              <div className="absolute -bottom-1 -left-1 w-8 h-8 border-l-4 border-b-4 border-white rounded-bl-lg" />
              <div className="absolute -bottom-1 -right-1 w-8 h-8 border-r-4 border-b-4 border-white rounded-br-lg" />
            </div>
            <p className="mt-4 text-white text-center font-semibold shadow-lg">
              Align barcode within frame
            </p>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-4">
        {!isScanning ? (
          <button
            onClick={startScanning}
            className="bg-blue-600 text-white px-8 py-4 rounded-full font-semibold text-lg shadow-lg"
          >
            Start Scanning
          </button>
        ) : (
          <button
            onClick={stopScanning}
            className="bg-red-600 text-white px-8 py-4 rounded-full font-semibold text-lg shadow-lg"
          >
            Stop Scanning
          </button>
        )}
      </div>
    </div>
  );
}
