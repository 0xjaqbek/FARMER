// src/components/wallet/SponsoredTransactionButton.jsx
// Example component demonstrating sponsored gas transactions with Base Accounts

import React, { useState, useEffect } from 'react';
import { useBaseAccountCapabilities } from '../../hooks/useBaseAccountCapabilities';
import { baseAccountWalletManager } from '../../utils/baseAccountWalletManager';

/**
 * Button component that handles transactions with automatic sponsored gas
 * when connected to a Base Account
 */
export default function SponsoredTransactionButton({
  transaction,
  onSuccess,
  onError,
  children = 'Send Transaction',
  className = ''
}) {
  const [address, setAddress] = useState(null);
  const [isSending, setIsSending] = useState(false);
  const capabilities = useBaseAccountCapabilities(address);

  useEffect(() => {
    // Get connected wallet address
    const walletInfo = baseAccountWalletManager.getWalletInfo('metamask');
    if (walletInfo?.address) {
      setAddress(walletInfo.address);
    }
  }, []);

  const handleTransaction = async () => {
    if (!transaction) {
      console.error('No transaction provided');
      return;
    }

    setIsSending(true);

    try {
      // Automatically use sponsored gas if available
      const useSponsoredGas = capabilities.paymasterService;

      if (useSponsoredGas) {
        console.log('💰 Transaction will use sponsored gas (no ETH required)');
      } else {
        console.log('⛽ Transaction will use standard gas payment');
      }

      const result = await baseAccountWalletManager.sendTransaction(
        transaction,
        useSponsoredGas
      );

      console.log('✅ Transaction successful:', result);

      if (onSuccess) {
        onSuccess(result);
      }
    } catch (error) {
      console.error('❌ Transaction failed:', error);

      if (onError) {
        onError(error);
      }
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="sponsored-transaction-wrapper">
      <button
        onClick={handleTransaction}
        disabled={isSending || capabilities.isLoading}
        className={`sponsored-transaction-button ${className}`}
      >
        {isSending ? 'Sending...' : children}
      </button>

      {capabilities.paymasterService && (
        <div className="gas-free-badge">
          ⚡ Gas Free
        </div>
      )}

      {capabilities.error && (
        <div className="capability-error">
          Unable to detect wallet capabilities
        </div>
      )}
    </div>
  );
}

/**
 * Example usage component
 */
export function SponsoredTransactionExample() {
  const [txResult, setTxResult] = useState(null);

  const exampleTransaction = {
    from: '0x...', // User's address
    to: '0x...', // Contract address
    data: '0x...', // Encoded function call
    value: '0x0' // Amount in wei
  };

  return (
    <div className="sponsored-tx-example">
      <h3>Sponsored Transaction Example</h3>

      <SponsoredTransactionButton
        transaction={exampleTransaction}
        onSuccess={(result) => {
          setTxResult(result);
          console.log('Transaction successful!', result);
        }}
        onError={(error) => {
          console.error('Transaction failed:', error);
        }}
      >
        Send Sponsored Transaction
      </SponsoredTransactionButton>

      {txResult && (
        <div className="tx-result">
          <p>Transaction Hash: {txResult}</p>
        </div>
      )}
    </div>
  );
}