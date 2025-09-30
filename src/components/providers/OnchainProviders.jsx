// src/components/providers/OnchainProviders.jsx
// Wrapper for OnchainKit providers required for Base Mini App

import React from 'react';
import { MiniKitProvider } from '@coinbase/onchainkit/minikit';

/**
 * OnchainKit Providers for Base Mini App
 * Wraps the app with necessary providers for authentication and wallet features
 */
export function OnchainProviders({ children }) {
  return (
    <MiniKitProvider>
      {children}
    </MiniKitProvider>
  );
}

export default OnchainProviders;