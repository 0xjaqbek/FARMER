# Migrating Existing Components to Base Account Support

## Example: Updating CryptoWalletPayment Component

Here's how to update your existing `CryptoWalletPayment.jsx` to support Base Account features while maintaining backward compatibility.

### Before (Traditional Wallet Only)

```jsx
// src/components/payment/CryptoWalletPayment.jsx
import { walletManager, useWalletConnection } from '../utils/walletConnectionManager';

const CryptoWalletPayment = ({ wallet, orderData, exchangeRate }) => {
  const { connectWallet, isConnecting } = useWalletConnection();

  const handlePayment = async () => {
    const transaction = {
      from: connectedAddress,
      to: wallet.address,
      value: ethers.utils.parseEther(cryptoAmount).toHexString()
    };

    const txHash = await window.ethereum.request({
      method: 'eth_sendTransaction',
      params: [transaction]
    });
  };

  // ... rest of component
};
```

### After (With Base Account Support)

```jsx
// src/components/payment/CryptoWalletPayment.jsx
import { baseAccountWalletManager } from '../utils/baseAccountWalletManager';
import { useBaseAccountCapabilities } from '../hooks/useBaseAccountCapabilities';

const CryptoWalletPayment = ({ wallet, orderData, exchangeRate }) => {
  const [connectedAddress, setConnectedAddress] = useState('');

  // Detect Base Account capabilities
  const capabilities = useBaseAccountCapabilities(connectedAddress);

  const handleConnect = async () => {
    // This automatically detects Base Account features
    const result = await baseAccountWalletManager.connectWallet('metamask');
    setConnectedAddress(result.address);
  };

  const handlePayment = async () => {
    const transaction = {
      from: connectedAddress,
      to: wallet.address,
      value: ethers.utils.parseEther(cryptoAmount).toHexString()
    };

    // Automatically uses sponsored gas if available
    const txHash = await baseAccountWalletManager.sendTransaction(
      transaction,
      true // Use sponsored gas if available
    );
  };

  return (
    <div>
      {/* Show gas-free badge if supported */}
      {capabilities.paymasterService && (
        <Badge variant="success">⚡ Gas Free Payment</Badge>
      )}

      <Button onClick={handlePayment}>
        Pay {cryptoAmount} {wallet.symbol}
        {capabilities.paymasterService && ' (No Gas Required)'}
      </Button>
    </div>
  );
};
```

## Step-by-Step Migration

### 1. Update Imports

```jsx
// Old
- import { walletManager } from '../utils/walletConnectionManager';
// New
+ import { baseAccountWalletManager } from '../utils/baseAccountWalletManager';
+ import { useBaseAccountCapabilities } from '../hooks/useBaseAccountCapabilities';
```

### 2. Add Capability Detection

```jsx
function YourComponent() {
  const [address, setAddress] = useState(null);
  const capabilities = useBaseAccountCapabilities(address);

  // capabilities.isBaseAccount
  // capabilities.paymasterService
  // capabilities.atomicBatch
}
```

### 3. Update Connection Logic

```jsx
// Old
const handleConnect = async () => {
  const result = await walletManager.connectWallet('metamask');
  setAddress(result.address);
};

// New (automatically detects capabilities)
const handleConnect = async () => {
  const result = await baseAccountWalletManager.connectWallet('metamask');
  setAddress(result.address);
  console.log('Is Base Account:', result.isBaseAccount);
};
```

### 4. Update Transaction Sending

```jsx
// Old
const sendPayment = async (transaction) => {
  return await window.ethereum.request({
    method: 'eth_sendTransaction',
    params: [transaction]
  });
};

// New (with automatic sponsored gas)
const sendPayment = async (transaction) => {
  return await baseAccountWalletManager.sendTransaction(
    transaction,
    true // Automatically use sponsored gas if available
  );
};
```

### 5. Add UI Indicators

```jsx
function PaymentButton() {
  const capabilities = useBaseAccountCapabilities(address);

  return (
    <div>
      <Button onClick={handlePayment}>
        Pay {amount}
      </Button>

      {/* Show gas-free indicator */}
      {capabilities.paymasterService && (
        <span className="gas-free-badge">⚡ No gas required</span>
      )}

      {/* Show Base Account badge */}
      {capabilities.isBaseAccount && (
        <span className="base-account-badge">
          Powered by Base Account
        </span>
      )}
    </div>
  );
}
```

## Real-World Example: Checkout Flow

### Multi-step Purchase (Approve + Buy)

```jsx
import BatchTransactionFlow from '../components/wallet/BatchTransactionFlow';
import { useBaseAccountCapabilities } from '../hooks/useBaseAccountCapabilities';

function CheckoutFlow({ productId, price }) {
  const [address, setAddress] = useState(null);
  const capabilities = useBaseAccountCapabilities(address);

  // Prepare transactions
  const transactions = [
    {
      from: address,
      to: USDC_ADDRESS,
      data: encodeApproveFunction(MARKETPLACE_ADDRESS, price),
      value: '0x0'
    },
    {
      from: address,
      to: MARKETPLACE_ADDRESS,
      data: encodePurchaseFunction(productId),
      value: '0x0'
    }
  ];

  // Base Account: One confirmation
  if (capabilities.atomicBatch) {
    return (
      <BatchTransactionFlow
        transactions={transactions}
        onComplete={handlePurchaseComplete}
        onError={handleError}
      />
    );
  }

  // Traditional: Two separate confirmations
  return (
    <div>
      <Button onClick={() => sendTransaction(transactions[0])}>
        1. Approve USDC
      </Button>
      <Button onClick={() => sendTransaction(transactions[1])}>
        2. Purchase Item
      </Button>
    </div>
  );
}
```

## Testing Checklist

- [ ] Test with Base Account in Base App
  - [ ] Verify one-click batch transactions work
  - [ ] Verify sponsored gas works (no ETH balance needed)
  - [ ] Verify UI shows "Gas Free" indicators

- [ ] Test with traditional wallet in browser
  - [ ] Verify multi-step flow works
  - [ ] Verify users pay their own gas
  - [ ] Verify no Base Account features are incorrectly shown

- [ ] Test capability detection
  - [ ] Verify capabilities are detected correctly
  - [ ] Verify fallback to traditional flow when needed
  - [ ] Verify error handling when detection fails

## Common Patterns

### Pattern 1: Conditional Features

```jsx
function PaymentComponent() {
  const { canSponsorGas } = usePaymasterService(address);

  return (
    <div>
      <h3>Payment Options</h3>
      {canSponsorGas ? (
        <p>✅ Pay with credit (gas covered by app)</p>
      ) : (
        <p>⚠️ Gas fees apply</p>
      )}
    </div>
  );
}
```

### Pattern 2: Progressive Enhancement

```jsx
function TransactionButton({ transaction }) {
  const capabilities = useBaseAccountCapabilities(address);

  const enhancedTransaction = {
    ...transaction,
    // Add paymaster if available
    ...(capabilities.paymasterService && {
      paymasterUrl: process.env.VITE_PAYMASTER_URL
    })
  };

  return (
    <SponsoredTransactionButton transaction={enhancedTransaction} />
  );
}
```

### Pattern 3: Feature Detection + Analytics

```jsx
function App() {
  const capabilities = useBaseAccountCapabilities(address);

  useEffect(() => {
    // Track which wallet type users have
    if (capabilities.isBaseAccount) {
      analytics.track('base_account_detected', {
        atomicBatch: capabilities.atomicBatch,
        paymasterService: capabilities.paymasterService
      });
    }
  }, [capabilities]);
}
```

## Troubleshooting

### Issue: Capabilities not detected
**Solution**: Ensure you're on Base chain (chainId: 0x2105)

```jsx
useEffect(() => {
  const checkChain = async () => {
    const chainId = await window.ethereum.request({
      method: 'eth_chainId'
    });

    if (chainId !== '0x2105') {
      console.warn('Not on Base chain, capabilities may not be available');
    }
  };

  checkChain();
}, []);
```

### Issue: Sponsored gas not working
**Solution**: Check your paymaster API key

```jsx
// In .env
VITE_COINBASE_API_KEY=your_actual_api_key_here
```

### Issue: Batch transactions failing
**Solution**: Ensure all transactions have the same `from` address

```jsx
const transactions = [
  { from: address, to: '0x...', data: '0x...' },
  { from: address, to: '0x...', data: '0x...' }  // Same address
];
```