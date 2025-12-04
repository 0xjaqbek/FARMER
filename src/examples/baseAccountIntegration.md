# Base Account Integration Guide

This guide explains how to use Base Account features in your Farmer Mini App.

## Overview

Base Accounts provide enhanced features for Mini Apps:

- **Atomic Batch Transactions**: Multiple transactions in one user confirmation
- **Sponsored Gas**: App pays gas fees instead of users
- **Passkey Authentication**: Biometric authentication instead of seed phrases

## Files Added

1. **`src/hooks/useBaseAccountCapabilities.js`** - React hooks for detecting Base Account capabilities
2. **`src/utils/baseAccountWalletManager.js`** - Enhanced wallet manager with Base Account support
3. **`src/components/wallet/SponsoredTransactionButton.jsx`** - Component for sponsored gas transactions
4. **`src/components/wallet/BatchTransactionFlow.jsx`** - Component for atomic batch transactions

## Usage Examples

### 1. Detect Base Account Capabilities

```jsx
import { useBaseAccountCapabilities } from '../hooks/useBaseAccountCapabilities';

function MyComponent() {
  const { address } = useWallet(); // Your existing wallet hook
  const capabilities = useBaseAccountCapabilities(address);

  if (capabilities.isLoading) {
    return <div>Detecting wallet capabilities...</div>;
  }

  if (capabilities.isBaseAccount) {
    return (
      <div>
        ✅ Base Account detected!
        <ul>
          <li>Atomic Batch: {capabilities.atomicBatch ? '✓' : '✗'}</li>
          <li>Sponsored Gas: {capabilities.paymasterService ? '✓' : '✗'}</li>
          <li>Auxiliary Funds: {capabilities.auxiliaryFunds ? '✓' : '✗'}</li>
        </ul>
      </div>
    );
  }

  return <div>Traditional wallet connected</div>;
}
```

### 2. Connect Wallet with Base Account Support

```jsx
import { baseAccountWalletManager } from '../utils/baseAccountWalletManager';

async function connectWallet() {
  try {
    const result = await baseAccountWalletManager.connectWallet('metamask');

    console.log('Wallet connected:', result.address);
    console.log('Is Base Account:', result.isBaseAccount);
    console.log('Capabilities:', result.capabilities);
  } catch (error) {
    console.error('Connection failed:', error);
  }
}
```

### 3. Send Sponsored Gas Transaction

```jsx
import SponsoredTransactionButton from '../components/wallet/SponsoredTransactionButton';

function MintNFT() {
  const transaction = {
    from: userAddress,
    to: nftContractAddress,
    data: encodedMintFunction,
    value: '0x0'
  };

  return (
    <SponsoredTransactionButton
      transaction={transaction}
      onSuccess={(txHash) => {
        console.log('NFT minted!', txHash);
      }}
      onError={(error) => {
        console.error('Mint failed:', error);
      }}
    >
      Mint NFT (Gas Free)
    </SponsoredTransactionButton>
  );
}
```

### 4. Batch Multiple Transactions

```jsx
import BatchTransactionFlow from '../components/wallet/BatchTransactionFlow';

function PurchaseWithApproval() {
  const transactions = [
    {
      from: userAddress,
      to: tokenContractAddress,
      data: encodeApproveFunction(spenderAddress, amount),
      value: '0x0'
    },
    {
      from: userAddress,
      to: marketplaceAddress,
      data: encodePurchaseFunction(itemId),
      value: '0x0'
    }
  ];

  return (
    <BatchTransactionFlow
      transactions={transactions}
      onComplete={(result) => {
        console.log('Purchase completed!', result);
      }}
      onError={(error) => {
        console.error('Purchase failed:', error);
      }}
    />
  );
}
```

### 5. Capability-Based UI

```jsx
import { useAtomicBatch, usePaymasterService } from '../hooks/useBaseAccountCapabilities';

function AdaptiveUI() {
  const { address } = useWallet();
  const { canBatch } = useAtomicBatch(address);
  const { canSponsorGas } = usePaymasterService(address);

  if (canBatch && canSponsorGas) {
    // Best experience: One-click + Free gas
    return <OneClickPurchaseFlow />;
  } else if (canBatch) {
    // Good experience: One-click but user pays gas
    return <BatchPurchaseFlow />;
  } else {
    // Traditional experience: Multi-step
    return <MultiStepPurchaseFlow />;
  }
}
```

## Environment Variables

Add to your `.env` file:

```env
# Coinbase Paymaster Service (for sponsored gas)
VITE_COINBASE_API_KEY=your_api_key_here
VITE_PAYMASTER_URL=https://api.developer.coinbase.com/rpc/v1/base/your_api_key_here
```

## Migration from Old Wallet Manager

Your existing `walletConnectionManager.js` still works! The new `baseAccountWalletManager.js` wraps it and adds Base Account features on top.

**Option 1: Gradually migrate**
```jsx
// Old code (still works)
import { walletManager } from './utils/walletConnectionManager';
await walletManager.connectWallet('metamask');

// New code (with Base Account support)
import { baseAccountWalletManager } from './utils/baseAccountWalletManager';
await baseAccountWalletManager.connectWallet('metamask');
```

**Option 2: Update in one place**
```jsx
// In your existing components, just replace the import
- import { walletManager } from './utils/walletConnectionManager';
+ import { baseAccountWalletManager as walletManager } from './utils/baseAccountWalletManager';
```

## Testing

### With Base Account (in Base App)
1. Open your Mini App in the Base App
2. Connect your Base Account wallet
3. You should see:
   - One-click confirmation for multiple transactions
   - "Gas Free" badge on transactions
   - Instant transactions without ETH balance

### With Traditional Wallet (in browser)
1. Open your app in a browser
2. Connect MetaMask or another wallet
3. You should see:
   - Multi-step confirmations
   - Standard gas fees
   - Fallback to traditional flow

## Best Practices

1. **Always detect capabilities** - Don't assume all wallets support Base Account features
2. **Provide fallbacks** - Ensure traditional wallets can still use your app
3. **Test both paths** - Test with Base Accounts AND traditional wallets
4. **Show clear UI** - Indicate when users get gas-free or one-click experiences
5. **Handle errors gracefully** - Paymaster service may occasionally be unavailable

## API Reference

### `useBaseAccountCapabilities(address)`
Returns: `{ atomicBatch, paymasterService, auxiliaryFunds, isBaseAccount, isLoading, error, refresh }`

### `usePaymasterService(address)`
Returns: `{ canSponsorGas, paymasterConfig, isLoading, error }`

### `useAtomicBatch(address)`
Returns: `{ canBatch, isLoading, error }`

### `baseAccountWalletManager.connectWallet(walletType, options)`
Connects wallet and detects Base Account capabilities

### `baseAccountWalletManager.sendTransaction(transaction, useSponsoredGas)`
Sends a single transaction with optional sponsored gas

### `baseAccountWalletManager.sendBatchTransactions(transactions, useSponsoredGas)`
Sends multiple transactions as an atomic batch

## Additional Resources

- [Base Account Documentation](https://docs.base.org/base-accounts)
- [Mini App Wallet Guide](https://docs.farcaster.xyz/developers/guides/mini-apps/wallets)
- [Paymaster Service](https://docs.base.org/base-accounts/paymaster-service)
- [Batch Transactions](https://docs.base.org/base-accounts/batch-transactions)