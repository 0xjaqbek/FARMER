// src/examples/QuickStart.jsx
// Quick start example showing how to use Base Account features in your app

import React, { useState, useEffect } from 'react';
import { baseAccountWalletManager } from '../utils/baseAccountWalletManager';
import { useBaseAccountCapabilities } from '../hooks/useBaseAccountCapabilities';
import SponsoredTransactionButton from '../components/wallet/SponsoredTransactionButton';
import BatchTransactionFlow from '../components/wallet/BatchTransactionFlow';

/**
 * EXAMPLE 1: Basic Wallet Connection with Capability Detection
 */
export function WalletConnectionExample() {
  const [address, setAddress] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const capabilities = useBaseAccountCapabilities(address);

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      const result = await baseAccountWalletManager.connectWallet('metamask');
      setAddress(result.address);
      console.log('Connected:', result);
    } catch (error) {
      console.error('Connection failed:', error);
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <div className="wallet-connection-example">
      <h2>Wallet Connection</h2>

      {!address ? (
        <button onClick={handleConnect} disabled={isConnecting}>
          {isConnecting ? 'Connecting...' : 'Connect Wallet'}
        </button>
      ) : (
        <div>
          <p>✅ Connected: {address.slice(0, 6)}...{address.slice(-4)}</p>

          {capabilities.isLoading ? (
            <p>Detecting capabilities...</p>
          ) : capabilities.isBaseAccount ? (
            <div className="base-account-info">
              <h3>🎉 Base Account Detected!</h3>
              <ul>
                <li>Atomic Batch: {capabilities.atomicBatch ? '✅' : '❌'}</li>
                <li>Sponsored Gas: {capabilities.paymasterService ? '✅' : '❌'}</li>
                <li>Auxiliary Funds: {capabilities.auxiliaryFunds ? '✅' : '❌'}</li>
              </ul>
            </div>
          ) : (
            <p>ℹ️ Traditional wallet connected</p>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * EXAMPLE 2: Simple Payment with Auto-Sponsored Gas
 */
export function SimplePaymentExample() {
  const [address, setAddress] = useState('0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb');
  const [recipient, setRecipient] = useState('0x...');
  const [amount, setAmount] = useState('0.001');

  const transaction = {
    from: address,
    to: recipient,
    value: '0x' + (parseFloat(amount) * 1e18).toString(16)
  };

  return (
    <div className="simple-payment-example">
      <h2>Simple Payment</h2>

      <input
        type="text"
        placeholder="Recipient address"
        value={recipient}
        onChange={(e) => setRecipient(e.target.value)}
      />

      <input
        type="number"
        placeholder="Amount in ETH"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        step="0.001"
      />

      <SponsoredTransactionButton
        transaction={transaction}
        onSuccess={(txHash) => {
          alert(`Payment sent! Tx: ${txHash}`);
        }}
        onError={(error) => {
          alert(`Payment failed: ${error.message}`);
        }}
      >
        Send {amount} ETH
      </SponsoredTransactionButton>

      <p className="info">
        💡 This transaction will automatically use sponsored gas if your wallet supports it!
      </p>
    </div>
  );
}

/**
 * EXAMPLE 3: NFT Minting with Sponsored Gas
 */
export function NFTMintingExample() {
  const [address, setAddress] = useState('0x...');
  const capabilities = useBaseAccountCapabilities(address);

  // Example: Encode mint function call
  // In real app, use ethers.js or viem to encode
  const mintTransaction = {
    from: address,
    to: '0x...', // NFT contract address
    data: '0x...', // Encoded mint() function
    value: '0x0'
  };

  return (
    <div className="nft-minting-example">
      <h2>Mint NFT</h2>

      <div className="nft-preview">
        <img src="/nft-preview.png" alt="NFT" />
        <h3>Cool NFT #123</h3>
      </div>

      <SponsoredTransactionButton
        transaction={mintTransaction}
        onSuccess={(txHash) => {
          console.log('NFT minted!', txHash);
        }}
      >
        Mint NFT
      </SponsoredTransactionButton>

      {capabilities.paymasterService && (
        <p className="gas-free-notice">
          ⚡ This mint is completely free! No gas required.
        </p>
      )}
    </div>
  );
}

/**
 * EXAMPLE 4: Batch Purchase Flow (Approve + Buy)
 */
export function BatchPurchaseExample() {
  const [address, setAddress] = useState('0x...');
  const [itemId, setItemId] = useState('1');

  const USDC_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'; // Base USDC
  const MARKETPLACE_ADDRESS = '0x...';
  const PRICE = '100000000'; // 100 USDC (6 decimals)

  const purchaseTransactions = [
    {
      from: address,
      to: USDC_ADDRESS,
      // approve(spender, amount)
      data: '0x095ea7b3' +
            MARKETPLACE_ADDRESS.slice(2).padStart(64, '0') +
            PRICE.padStart(64, '0'),
      value: '0x0'
    },
    {
      from: address,
      to: MARKETPLACE_ADDRESS,
      // purchase(itemId)
      data: '0xefef39a1' + itemId.padStart(64, '0'),
      value: '0x0'
    }
  ];

  return (
    <div className="batch-purchase-example">
      <h2>Purchase Item</h2>

      <div className="item-card">
        <h3>Premium Farm Product #{itemId}</h3>
        <p>Price: 100 USDC</p>
      </div>

      <BatchTransactionFlow
        transactions={purchaseTransactions}
        onComplete={(result) => {
          alert('Purchase completed! 🎉');
          console.log('Result:', result);
        }}
        onError={(error) => {
          alert('Purchase failed: ' + error.message);
        }}
      />

      <p className="info">
        💡 Base Account users will see ONE confirmation for both approve and purchase!
        Traditional wallets will see TWO confirmations.
      </p>
    </div>
  );
}

/**
 * EXAMPLE 5: Adaptive UI Based on Capabilities
 */
export function AdaptiveUIExample() {
  const [address, setAddress] = useState('0x...');
  const capabilities = useBaseAccountCapabilities(address);

  if (capabilities.isLoading) {
    return <div>Loading wallet capabilities...</div>;
  }

  return (
    <div className="adaptive-ui-example">
      <h2>Adaptive User Experience</h2>

      {capabilities.isBaseAccount ? (
        <div className="premium-experience">
          <h3>🌟 Premium Experience</h3>
          <p>You're using a Base Account!</p>

          {capabilities.atomicBatch && (
            <div className="feature">
              ✅ One-click multi-step transactions
            </div>
          )}

          {capabilities.paymasterService && (
            <div className="feature">
              ✅ Gas-free transactions
            </div>
          )}

          <button className="premium-button">
            Buy Now (One Click, No Gas)
          </button>
        </div>
      ) : (
        <div className="standard-experience">
          <h3>Standard Experience</h3>
          <p>You're using a traditional wallet</p>

          <div className="feature">
            ⚠️ Multiple confirmations required
          </div>

          <div className="feature">
            ⚠️ Gas fees apply
          </div>

          <button className="standard-button">
            Buy Now (2 steps, gas required)
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * EXAMPLE 6: Complete Mini App Flow
 */
export function CompleteMiniAppExample() {
  const [step, setStep] = useState('connect'); // connect, select, purchase, success
  const [address, setAddress] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const capabilities = useBaseAccountCapabilities(address);

  const products = [
    { id: 1, name: 'Organic Tomatoes', price: 10 },
    { id: 2, name: 'Fresh Lettuce', price: 8 },
    { id: 3, name: 'Farm Eggs', price: 15 }
  ];

  const handleConnect = async () => {
    const result = await baseAccountWalletManager.connectWallet('metamask');
    setAddress(result.address);
    setStep('select');
  };

  const handlePurchase = async () => {
    setStep('purchase');

    const transaction = {
      from: address,
      to: '0x...', // Marketplace contract
      data: '0x...', // Encoded purchase function
      value: '0x0'
    };

    try {
      const txHash = await baseAccountWalletManager.sendTransaction(transaction);
      console.log('Purchase successful:', txHash);
      setStep('success');
    } catch (error) {
      console.error('Purchase failed:', error);
      setStep('select');
    }
  };

  return (
    <div className="complete-miniapp-example">
      <h1>🌾 Farmer Mini App</h1>

      {/* Step 1: Connect Wallet */}
      {step === 'connect' && (
        <div className="connect-step">
          <h2>Welcome!</h2>
          <p>Connect your wallet to start shopping</p>
          <button onClick={handleConnect}>Connect Wallet</button>
        </div>
      )}

      {/* Step 2: Select Product */}
      {step === 'select' && (
        <div className="select-step">
          <h2>Select a Product</h2>

          {capabilities.paymasterService && (
            <div className="promo-banner">
              ⚡ All purchases are gas-free for Base Account users!
            </div>
          )}

          <div className="products-grid">
            {products.map(product => (
              <div key={product.id} className="product-card">
                <h3>{product.name}</h3>
                <p>${product.price}</p>
                <button onClick={() => {
                  setSelectedProduct(product);
                  handlePurchase();
                }}>
                  Buy Now
                  {capabilities.paymasterService && ' (Gas Free!)'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Step 3: Processing */}
      {step === 'purchase' && (
        <div className="purchase-step">
          <h2>Processing your purchase...</h2>
          <p>Please confirm the transaction in your wallet</p>
        </div>
      )}

      {/* Step 4: Success */}
      {step === 'success' && (
        <div className="success-step">
          <h2>🎉 Purchase Successful!</h2>
          <p>Your {selectedProduct?.name} will arrive soon</p>
          <button onClick={() => setStep('select')}>
            Buy More Products
          </button>
        </div>
      )}
    </div>
  );
}

// Export all examples
export default {
  WalletConnectionExample,
  SimplePaymentExample,
  NFTMintingExample,
  BatchPurchaseExample,
  AdaptiveUIExample,
  CompleteMiniAppExample
};