'use client';

import { useEffect, useState } from 'react';
import { UAParser } from 'ua-parser-js';

const useDeviceTracking = () => {
  const [deviceInfo, setDeviceInfo] = useState<string>('');

  useEffect(() => {
    const parser = new UAParser();
    const result = parser.getResult();

    // Set device info only when component mounts
    setDeviceInfo(
      `${result.device.type || 'Desktop'} - ${result.os.name} ${
        result.os.version
      } - ${result.browser.name} ${result.browser.version}`
    );
  }, []);

  return deviceInfo;
};

export default useDeviceTracking;
