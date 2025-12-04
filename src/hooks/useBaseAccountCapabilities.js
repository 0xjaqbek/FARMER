// src/hooks/useBaseAccountCapabilities.js
// Hook to detect Base Account capabilities for enhanced Mini App features

import { useState, useEffect, useCallback } from 'react';

/**
 * Hook to detect and manage Base Account capabilities
 * @param {string} address - The connected wallet address
 * @returns {object} - Capabilities object with atomicBatch, paymasterService, and auxiliaryFunds
 */
export function useBaseAccountCapabilities(address) {
  const [capabilities, setCapabilities] = useState({
    atomicBatch: false,
    paymasterService: false,
    auxiliaryFunds: false,
    isBaseAccount: false,
    isLoading: true,
    error: null
  });

  const detectCapabilities = useCallback(async () => {
    if (!address || !window.ethereum) {
      setCapabilities({
        atomicBatch: false,
        paymasterService: false,
        auxiliaryFunds: false,
        isBaseAccount: false,
        isLoading: false,
        error: null
      });
      return;
    }

    try {
      // Base chain ID is 8453 (0x2105 in hex)
      const BASE_CHAIN_ID = '0x2105';

      // Request capabilities from the wallet
      const caps = await window.ethereum.request({
        method: 'wallet_getCapabilities',
        params: [address]
      });

      console.log('🔍 Base Account capabilities detected:', caps);

      // Check if Base chain capabilities exist
      const baseCapabilities = caps[BASE_CHAIN_ID] || {};

      const detectedCapabilities = {
        atomicBatch: baseCapabilities.atomicBatch?.supported === true,
        paymasterService: baseCapabilities.paymasterService?.supported === true,
        auxiliaryFunds: baseCapabilities.auxiliaryFunds?.supported === true,
        isBaseAccount: Object.keys(baseCapabilities).length > 0,
        isLoading: false,
        error: null
      };

      setCapabilities(detectedCapabilities);

      // Log detected capabilities for debugging
      if (detectedCapabilities.isBaseAccount) {
        console.log('✅ Base Account detected with capabilities:', {
          atomicBatch: detectedCapabilities.atomicBatch,
          paymasterService: detectedCapabilities.paymasterService,
          auxiliaryFunds: detectedCapabilities.auxiliaryFunds
        });
      } else {
        console.log('ℹ️ Traditional wallet detected (no Base Account capabilities)');
      }

    } catch (error) {
      console.error('❌ Error detecting Base Account capabilities:', error);
      setCapabilities({
        atomicBatch: false,
        paymasterService: false,
        auxiliaryFunds: false,
        isBaseAccount: false,
        isLoading: false,
        error: error.message
      });
    }
  }, [address]);

  useEffect(() => {
    detectCapabilities();
  }, [detectCapabilities]);

  // Refresh capabilities manually
  const refresh = useCallback(() => {
    setCapabilities(prev => ({ ...prev, isLoading: true }));
    detectCapabilities();
  }, [detectCapabilities]);

  return {
    ...capabilities,
    refresh
  };
}

/**
 * Hook to check if the connected wallet supports sponsored gas
 * @param {string} address - The connected wallet address
 * @returns {object} - Object with canSponsorGas boolean and paymaster configuration
 */
export function usePaymasterService(address) {
  const capabilities = useBaseAccountCapabilities(address);

  const paymasterConfig = capabilities.paymasterService ? {
    url: process.env.VITE_PAYMASTER_URL ||
         `https://api.developer.coinbase.com/rpc/v1/base/${process.env.VITE_COINBASE_API_KEY || 'YOUR_API_KEY'}`,
  } : null;

  return {
    canSponsorGas: capabilities.paymasterService,
    paymasterConfig,
    isLoading: capabilities.isLoading,
    error: capabilities.error
  };
}

/**
 * Hook to check if the connected wallet supports atomic batch transactions
 * @param {string} address - The connected wallet address
 * @returns {object} - Object with canBatch boolean
 */
export function useAtomicBatch(address) {
  const capabilities = useBaseAccountCapabilities(address);

  return {
    canBatch: capabilities.atomicBatch,
    isLoading: capabilities.isLoading,
    error: capabilities.error
  };
}