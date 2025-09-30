# Base Mini App Setup - Complete ✅

Your Farmer project has been successfully converted to a Base Mini App on the `miniapp-base` branch!

## What Was Done

### 1. Mini App SDK Integration ✅
- ✅ Installed `@farcaster/miniapp-sdk`
- ✅ Added `sdk.actions.ready()` call in `src/main.jsx:77`
- ✅ Signals to Base App when your mini app is ready to display

### 2. Manifest File ✅
- ✅ Created `public/.well-known/farcaster.json`
- ✅ Configured with your app metadata
- ⚠️ **TODO**: Update with your actual domain and Base Account address

### 3. Embed Metadata ✅
- ✅ Added `fc:miniapp` meta tag to `index.html:65-76`
- ✅ Enables rich embeds when shared
- ⚠️ **TODO**: Update domain URLs to match your deployment

### 4. Base Account Wallet Integration ✅
- ✅ Created capability detection hooks
- ✅ Enhanced wallet manager with Base Account support
- ✅ Sponsored gas transaction components
- ✅ Atomic batch transaction components

## New Files Created

### Hooks
- `src/hooks/useBaseAccountCapabilities.js` - Detect Base Account features

### Utils
- `src/utils/baseAccountWalletManager.js` - Enhanced wallet manager

### Components
- `src/components/wallet/SponsoredTransactionButton.jsx` - Sponsored gas UI
- `src/components/wallet/BatchTransactionFlow.jsx` - Batch transaction UI

### Documentation
- `src/examples/baseAccountIntegration.md` - Integration guide
- `src/examples/MigratingExistingComponent.md` - Migration guide

## Next Steps

### 1. Update Configuration Files

#### `.env` file
Add these environment variables:
```env
# Coinbase Paymaster API (for sponsored gas)
VITE_COINBASE_API_KEY=your_api_key_here
VITE_PAYMASTER_URL=https://api.developer.coinbase.com/rpc/v1/base/your_api_key_here

# Your deployed domain
VITE_APP_URL=https://your-domain.com
```

#### `public/.well-known/farcaster.json`
Update these fields:
```json
{
  "baseBuilder": {
    "allowedAddresses": ["YOUR_BASE_ACCOUNT_ADDRESS"]
  },
  "miniapp": {
    "homeUrl": "https://your-actual-domain.com",
    "iconUrl": "https://your-actual-domain.com/icons/android/android-launchericon-512-512.png",
    // ... update all URLs
  }
}
```

#### `index.html`
Update the fc:miniapp meta tag (line 65-76):
```html
<meta name="fc:miniapp" content='{
  "version":"next",
  "imageUrl":"https://your-actual-domain.com/icons/android/android-launchericon-512-512.png",
  "button":{
      "title":"Open Farmer",
      "action":{
      "type":"launch_miniapp",
      "name":"Farmer",
      "url":"https://your-actual-domain.com"
      }
  }
}' />
```

### 2. Generate Account Association Credentials

1. Deploy your app to make the manifest publicly accessible
2. Go to [Base Build Account Association Tool](https://build.base.org)
3. Enter your domain (e.g., `your-app.vercel.app`)
4. Click "Verify" and follow instructions
5. Copy the generated `accountAssociation` fields
6. Paste into `public/.well-known/farcaster.json`

### 3. Test Your Mini App

#### In Base App (Production-like)
1. Deploy to staging/production
2. Open in Base App
3. Should see:
   - Instant wallet connection (no prompts)
   - One-click batch transactions
   - Gas-free transactions
   - "⚡ Gas Free" badges

#### In Browser (Development)
1. Run `npm run dev`
2. Connect MetaMask
3. Should see:
   - Traditional wallet flow
   - Multi-step transactions
   - Standard gas fees
   - Fallback UI

### 4. Migrate Existing Components

See `src/examples/MigratingExistingComponent.md` for detailed examples.

#### Quick migration:
```jsx
// Update imports in your existing components
- import { walletManager } from './utils/walletConnectionManager';
+ import { baseAccountWalletManager } from './utils/baseAccountWalletManager';
+ import { useBaseAccountCapabilities } from './hooks/useBaseAccountCapabilities';

// Detect capabilities
const capabilities = useBaseAccountCapabilities(address);

// Show UI indicators
{capabilities.paymasterService && <Badge>⚡ Gas Free</Badge>}

// Send transactions (automatically uses sponsored gas if available)
await baseAccountWalletManager.sendTransaction(transaction, true);
```

### 5. Install Dependencies (If Needed)

If you want to use wagmi for advanced features:
```bash
# Close all terminals/editors that might lock files
npm install wagmi viem @tanstack/react-query --legacy-peer-deps
```

Note: The current implementation works without wagmi using native `window.ethereum` API.

## Usage Examples

### Example 1: Simple Payment with Auto Sponsored Gas
```jsx
import { baseAccountWalletManager } from './utils/baseAccountWalletManager';
import { usePaymasterService } from './hooks/useBaseAccountCapabilities';

function PaymentButton({ amount, recipient }) {
  const [address, setAddress] = useState(null);
  const { canSponsorGas } = usePaymasterService(address);

  const handlePayment = async () => {
    const transaction = {
      from: address,
      to: recipient,
      value: ethers.utils.parseEther(amount).toHexString()
    };

    // Automatically uses sponsored gas if available
    const txHash = await baseAccountWalletManager.sendTransaction(transaction);
    console.log('Payment sent:', txHash);
  };

  return (
    <button onClick={handlePayment}>
      Pay {amount} ETH
      {canSponsorGas && ' (Gas Free!)'}
    </button>
  );
}
```

### Example 2: Batch NFT Mint
```jsx
import BatchTransactionFlow from './components/wallet/BatchTransactionFlow';

function MintMultipleNFTs({ nftIds }) {
  const transactions = nftIds.map(id => ({
    from: address,
    to: NFT_CONTRACT,
    data: encodeMintFunction(id),
    value: '0x0'
  }));

  return (
    <BatchTransactionFlow
      transactions={transactions}
      onComplete={(result) => {
        console.log('All NFTs minted!', result);
      }}
    />
  );
}
```

### Example 3: Adaptive Checkout Flow
```jsx
import { useBaseAccountCapabilities } from './hooks/useBaseAccountCapabilities';

function CheckoutFlow() {
  const capabilities = useBaseAccountCapabilities(address);

  if (capabilities.atomicBatch && capabilities.paymasterService) {
    // Best UX: One-click + Free
    return <OneClickGasFreeCheckout />;
  } else if (capabilities.atomicBatch) {
    // Good UX: One-click but pay gas
    return <OneClickCheckout />;
  } else {
    // Traditional UX: Multi-step
    return <MultiStepCheckout />;
  }
}
```

## Key Features

### Base Account Features
- ✅ **Atomic Batch Transactions** - Multiple operations in one confirmation
- ✅ **Sponsored Gas** - App pays gas fees for users
- ✅ **Capability Detection** - Automatic fallback to traditional wallets
- ✅ **Progressive Enhancement** - Better UX for Base Accounts, works for all wallets

### Wallet Support
- ✅ Base Accounts (enhanced features)
- ✅ MetaMask (traditional)
- ✅ Solana/Phantom (existing support)
- ✅ Bitcoin/Unisat (existing support)

## Publishing Your Mini App

1. ✅ Complete all configuration updates above
2. ✅ Test thoroughly in both Base App and browser
3. ✅ Deploy to production
4. ✅ Verify manifest is accessible at `https://your-domain.com/.well-known/farcaster.json`
5. ✅ Use [Base Build Preview Tool](https://build.base.org) to validate
6. ✅ Create a post in Base App with your URL to publish

## Support Resources

- [Base Mini App Docs](https://docs.farcaster.xyz/developers/guides/mini-apps)
- [Base Account Capabilities](https://docs.base.org/base-accounts)
- [Paymaster Service](https://docs.base.org/base-accounts/paymaster-service)
- [Integration Guide](./src/examples/baseAccountIntegration.md)
- [Migration Guide](./src/examples/MigratingExistingComponent.md)

## Troubleshooting

### Sponsored gas not working?
- Check `VITE_COINBASE_API_KEY` is set in `.env`
- Verify you're on Base chain (chainId: 0x2105)
- Check Coinbase Developer Platform for API limits

### Batch transactions failing?
- Ensure all transactions have same `from` address
- Verify wallet supports `atomicBatch` capability
- Check transaction data is properly encoded

### Capabilities not detected?
- Verify connected to Base chain
- Check `wallet_getCapabilities` is supported
- Test with known Base Account

### Mini app not loading?
- Verify `sdk.actions.ready()` is called after React renders
- Check manifest is accessible at `/.well-known/farcaster.json`
- Verify `fc:miniapp` meta tag is in `index.html`

## Git Branch

All changes are on the `miniapp-base` branch:
```bash
# View changes
git diff evmCivic miniapp-base

# Merge into main when ready
git checkout main
git merge miniapp-base
```

---

**Status**: ✅ Base Mini App setup complete!
**Branch**: `miniapp-base`
**Next**: Update configuration and deploy