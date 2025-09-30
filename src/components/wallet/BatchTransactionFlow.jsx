// src/components/wallet/BatchTransactionFlow.jsx
// Component demonstrating atomic batch transactions for Base Accounts

import React, { useState, useEffect } from 'react';
import { useBaseAccountCapabilities, useAtomicBatch } from '../../hooks/useBaseAccountCapabilities';
import { baseAccountWalletManager } from '../../utils/baseAccountWalletManager';

/**
 * Component that adapts UI based on wallet capabilities:
 * - Base Account: One-click batch transaction
 * - Traditional Wallet: Multi-step transaction flow
 */
export default function BatchTransactionFlow({ transactions, onComplete, onError }) {
  const [address, setAddress] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  const capabilities = useBaseAccountCapabilities(address);
  const { canBatch } = useAtomicBatch(address);

  useEffect(() => {
    const walletInfo = baseAccountWalletManager.getWalletInfo('metamask');
    if (walletInfo?.address) {
      setAddress(walletInfo.address);
    }
  }, []);

  /**
   * Handle batch transaction (Base Account)
   */
  const handleBatchTransaction = async () => {
    setIsProcessing(true);

    try {
      console.log('📦 Sending atomic batch transaction...');

      const result = await baseAccountWalletManager.sendBatchTransactions(
        transactions,
        true // Use sponsored gas if available
      );

      console.log('✅ Batch transaction successful:', result);

      if (onComplete) {
        onComplete(result);
      }
    } catch (error) {
      console.error('❌ Batch transaction failed:', error);

      if (onError) {
        onError(error);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Handle sequential transactions (Traditional Wallet)
   */
  const handleSequentialTransactions = async () => {
    setIsProcessing(true);

    try {
      const results = [];

      for (let i = 0; i < transactions.length; i++) {
        setCurrentStep(i);
        console.log(`📤 Sending transaction ${i + 1} of ${transactions.length}...`);

        const result = await window.ethereum.request({
          method: 'eth_sendTransaction',
          params: [transactions[i]]
        });

        results.push(result);
        console.log(`✅ Transaction ${i + 1} successful:`, result);
      }

      console.log('✅ All transactions completed:', results);

      if (onComplete) {
        onComplete(results);
      }
    } catch (error) {
      console.error(`❌ Transaction ${currentStep + 1} failed:`, error);

      if (onError) {
        onError(error);
      }
    } finally {
      setIsProcessing(false);
      setCurrentStep(0);
    }
  };

  if (capabilities.isLoading) {
    return (
      <div className="batch-tx-loading">
        <p>Detecting wallet capabilities...</p>
      </div>
    );
  }

  // Base Account: One-click workflow
  if (canBatch) {
    return (
      <div className="batch-tx-flow base-account">
        <div className="workflow-header">
          <h3>One-Click Transaction</h3>
          <span className="base-account-badge">⚡ Base Account</span>
        </div>

        <div className="transaction-summary">
          <p>{transactions.length} transactions will be batched together</p>
          {capabilities.paymasterService && (
            <p className="gas-free">💰 Gas will be sponsored (free)</p>
          )}
        </div>

        <button
          onClick={handleBatchTransaction}
          disabled={isProcessing}
          className="batch-transaction-button"
        >
          {isProcessing ? 'Processing...' : 'Execute Batch Transaction'}
        </button>
      </div>
    );
  }

  // Traditional Wallet: Multi-step workflow
  return (
    <div className="batch-tx-flow traditional-wallet">
      <div className="workflow-header">
        <h3>Multi-Step Transaction</h3>
        <span className="traditional-wallet-badge">📝 Traditional Wallet</span>
      </div>

      <div className="transaction-steps">
        {transactions.map((tx, index) => (
          <div
            key={index}
            className={`transaction-step ${
              index === currentStep ? 'active' : ''
            } ${index < currentStep ? 'completed' : ''}`}
          >
            <span className="step-number">{index + 1}</span>
            <span className="step-description">Transaction {index + 1}</span>
            {index < currentStep && <span className="checkmark">✓</span>}
          </div>
        ))}
      </div>

      {isProcessing && (
        <div className="progress-indicator">
          Processing transaction {currentStep + 1} of {transactions.length}
        </div>
      )}

      <button
        onClick={handleSequentialTransactions}
        disabled={isProcessing}
        className="sequential-transaction-button"
      >
        {isProcessing
          ? `Processing ${currentStep + 1}/${transactions.length}...`
          : `Start Transactions (${transactions.length} steps)`}
      </button>
    </div>
  );
}

/**
 * Example usage for a purchase flow
 */
export function PurchaseFlowExample() {
  const [result, setResult] = useState(null);

  // Example: Approve + Transfer flow
  const purchaseTransactions = [
    {
      from: '0x...', // User's address
      to: '0x...', // Token contract
      data: '0x...', // approve() function call
      value: '0x0'
    },
    {
      from: '0x...', // User's address
      to: '0x...', // NFT contract
      data: '0x...', // mint() function call
      value: '0x0'
    }
  ];

  return (
    <div className="purchase-flow-example">
      <h2>NFT Purchase Flow</h2>

      <BatchTransactionFlow
        transactions={purchaseTransactions}
        onComplete={(result) => {
          setResult(result);
          console.log('Purchase completed!', result);
        }}
        onError={(error) => {
          console.error('Purchase failed:', error);
        }}
      />

      {result && (
        <div className="purchase-result">
          <h3>Purchase Successful! 🎉</h3>
          <pre>{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}