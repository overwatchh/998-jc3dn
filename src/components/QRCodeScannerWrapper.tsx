import { Html5Qrcode } from "html5-qrcode";
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";

interface QRCodeScannerWrapperProps {
  onScanSuccess: (decodedText: string) => void;
  onScanFailure?: (error: string) => void;
  width?: string;
  height?: string;
}

const QRCodeScannerWrapper = ({
  onScanSuccess,
  onScanFailure,
  width = "100%",
  height = "300px",
}: QRCodeScannerWrapperProps) => {
  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerDivId = "qr-reader";

  useEffect(() => {
    // Initialize scanner
    scannerRef.current = new Html5Qrcode(scannerDivId);

    // Cleanup on unmount
    return () => {
      if (scannerRef.current && isScanning) {
        scannerRef.current
          .stop()
          .catch((err) => console.error("Error stopping scanner:", err));
      }
    };
  }, [isScanning]);

  const startScanner = () => {
    if (!scannerRef.current) return;
    setScanError(null);

    const config = {
      fps: 10,
      qrbox: { width: 250, height: 250 },
    };

    scannerRef.current
      .start(
        { facingMode: "environment" },
        config,
        (decodedText) => {
          setScanError(null);
          onScanSuccess(decodedText);
          // Optionally stop scanning after successful scan
          // stopScanner();
        },
        (errorMessage) => {
          let userFriendlyError = errorMessage;
          if (errorMessage.includes("NotFoundException")) {
            userFriendlyError =
              "QR code not detected. Ensure it's clear, well-lit, and centered in the scan area.";
          }
          setScanError(userFriendlyError);
          if (onScanFailure) {
            onScanFailure(errorMessage);
          }
        }
      )
      .then(() => {
        setIsScanning(true);
      })
      .catch((err) => {
        console.error("Error starting scanner:", err);
      });
  };

  const stopScanner = () => {
    if (scannerRef.current && isScanning) {
      scannerRef.current
        .stop()
        .then(() => {
          setIsScanning(false);
          setScanError(null);
        })
        .catch((err) => {
          console.error("Error stopping scanner:", err);
          setScanError("Failed to stop scanner.");
        });
    }
  };

  return (
    <div className="flex flex-col items-center">
      <div id={scannerDivId} style={{ width, height }}></div>
      {scanError && <p className="mt-2 text-red-500 text-sm">{scanError}</p>}
      <div className="flex gap-4 mt-4">
        {!isScanning ? (
          <Button onClick={startScanner}>Start Scanner</Button>
        ) : (
          <Button onClick={stopScanner} variant="destructive">
            Stop Scanner
          </Button>
        )}
      </div>
      <p className="mt-4 text-sm text-gray-500">
        Position the QR code within the scanner area
      </p>
    </div>
  );
};

export default QRCodeScannerWrapper;
