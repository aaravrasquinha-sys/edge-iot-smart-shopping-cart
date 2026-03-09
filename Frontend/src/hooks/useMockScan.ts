import { useState, useCallback } from 'react';

interface MockScanHook {
  scanning: boolean;
  scanItem: (tagId?: number) => Promise<void>;
  lastScannedTag: number | null;
}

const useMockScan = (onScanSuccess?: (tagId: number) => void): MockScanHook => {
  const [scanning, setScanning] = useState(false);
  const [lastScannedTag, setLastScannedTag] = useState<number | null>(null);

  const scanItem = useCallback(async (tagId?: number) => {
    setScanning(true);
    
    try {
      // Simulate scanning delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Use predefined tag IDs that match our sample products
      const sampleTagIds = [101, 102, 103, 104, 105];
      const scannedTag = tagId || sampleTagIds[Math.floor(Math.random() * sampleTagIds.length)];
      setLastScannedTag(scannedTag);
      
      if (onScanSuccess) {
        onScanSuccess(scannedTag);
      }
    } catch (error) {
      console.error('Scan failed:', error);
    } finally {
      setScanning(false);
    }
  }, [onScanSuccess]);

  return {
    scanning,
    scanItem,
    lastScannedTag,
  };
};

export default useMockScan;
