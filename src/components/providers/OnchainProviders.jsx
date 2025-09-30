// src/components/providers/OnchainProviders.jsx
// Wrapper for OnchainKit providers required for Base Mini App

import React from 'react';
import { OnchainKitProvider } from '@coinbase/onchainkit/wallet';
import { MiniKitProvider } from '@coinbase/onchainkit/minikit';
import { base } from 'viem/chains';

/**
 * OnchainKit Providers for Base Mini App
 * Wraps the app with necessary providers for authentication and wallet features
 */
export function OnchainProviders({ children }) {
  // Get API key from environment
  const apiKey = import.meta.env.VITE_COINBASE_API_KEY || import.meta.env.VITE_ONCHAINKIT_API_KEY;

  return (
    <OnchainKitProvider
      apiKey={apiKey}
      chain={base}
      config={{
        appearance: {
          name: 'Farmer',
          logo: '/icons/android/android-launchericon-192-192.png',
          mode: 'auto', // 'light' | 'dark' | 'auto'
        },
      }}
    >
      <MiniKitProvider>
        {children}
      </MiniKitProvider>
    </OnchainKitProvider>
  );
}

export default OnchainProviders;