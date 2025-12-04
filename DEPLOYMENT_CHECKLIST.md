# Base Mini App Deployment Checklist

Your Farmer app is configured for deployment at **https://farmer4u.web.app**

## ✅ Completed

- [x] Installed @farcaster/miniapp-sdk
- [x] Added sdk.actions.ready() in src/main.jsx
- [x] Created manifest at public/.well-known/farcaster.json
- [x] Updated manifest with production domain (farmer4u.web.app)
- [x] Added fc:miniapp meta tag to index.html
- [x] Updated all URLs to production domain
- [x] Installed @coinbase/onchainkit for authentication
- [x] Replaced Civic Auth with SIWF authentication
- [x] Configured Base Account wallet integration

## 📋 Before Deployment

### 1. Environment Variables

Add to your `.env` file (or Firebase environment config):

```env
# Required: Coinbase/OnchainKit API Key
VITE_COINBASE_API_KEY=your_api_key_here
# OR
VITE_ONCHAINKIT_API_KEY=your_api_key_here

# Optional: Paymaster Service (for sponsored gas)
VITE_PAYMASTER_URL=https://api.developer.coinbase.com/rpc/v1/base/your_api_key

# Your deployed app URL
VITE_APP_URL=https://farmer4u.web.app
```

**Get API Key:** https://portal.cdp.coinbase.com/

### 2. Build and Test Locally

```bash
# Install dependencies
npm install

# Build for production
npm run build

# Preview build locally
npm run preview
```

Test the build at `http://localhost:4173`:
- [ ] App loads without errors
- [ ] SDK ready signal fires
- [ ] Authentication flow works
- [ ] Wallet connection works
- [ ] All routes accessible

### 3. Deploy to Firebase

```bash
# Login to Firebase (if not already)
firebase login

# Deploy
firebase deploy
```

This will deploy:
- Hosting: Your React app
- Functions: Any Firebase functions
- Firestore rules: Database rules

### 4. Verify Deployment

After deployment, verify these URLs work:

✅ **App URL:** https://farmer4u.web.app
- [ ] App loads successfully
- [ ] No console errors
- [ ] Service worker registers (optional)

✅ **Manifest URL:** https://farmer4u.web.app/.well-known/farcaster.json
- [ ] Returns valid JSON
- [ ] All fields populated
- [ ] No 404 errors

✅ **Icon URL:** https://farmer4u.web.app/icons/android/android-launchericon-512-512.png
- [ ] Image loads
- [ ] Shows app icon

## 🔐 Account Association

Once deployed, generate account association credentials:

### Step 1: Navigate to Base Build
Go to: https://build.base.org

### Step 2: Enter Your Domain
Enter: **farmer4u.web.app** (without https://)

### Step 3: Verify Ownership
1. Click "Submit"
2. Click "Verify" button
3. Sign the message with your Base Account (using passkey/biometric)

### Step 4: Copy Credentials
You'll receive three fields:
```json
{
  "accountAssociation": {
    "header": "eyJmaWQiOjkx...",
    "payload": "eyJkb21haW4i...",
    "signature": "MHgwMDAwMD..."
  }
}
```

### Step 5: Update Manifest
1. Open `public/.well-known/farcaster.json`
2. Replace lines 2-6 with your generated credentials
3. Keep your Base Account address in `baseBuilder.allowedAddresses`

### Step 6: Redeploy
```bash
npm run build
firebase deploy
```

### Step 7: Verify Account Association
Go back to Base Build and verify:
- [ ] Green checkmark on "Account association" tab
- [ ] No errors or warnings

## 🚀 Publishing to Base App

### Step 1: Test in Base Build Preview
1. Go to: https://build.base.org
2. Enter: **farmer4u.web.app**
3. Click "Preview"
4. Check:
   - [ ] Embed shows correctly
   - [ ] Launch button works
   - [ ] App loads in Base App preview
   - [ ] Authentication works
   - [ ] All features functional

### Step 2: Post to Publish
To publish your mini app to Base App:

1. Open the Base App on your phone
2. Create a new post
3. Include your URL: **https://farmer4u.web.app**
4. Publish the post
5. Your mini app is now live! 🎉

### Step 3: Share Your Mini App
Share the post URL with users. When they click, your mini app will:
- Show as a rich embed
- Have a "Open Farmer" button
- Launch directly in Base App

## 🧪 Testing Checklist

### In Base App
- [ ] Mini app loads from shared link
- [ ] Splash screen shows, then disappears
- [ ] Authentication prompts for SIWF
- [ ] One-click sign in works
- [ ] Wallet automatically connected
- [ ] Transactions show sponsored gas (if enabled)
- [ ] Batch transactions work in one confirmation
- [ ] No errors in console

### In Browser (Fallback)
- [ ] App loads normally
- [ ] SIWF authentication works
- [ ] Wallet connection works
- [ ] Traditional multi-step flow works
- [ ] No Base-specific features break

### Features to Test
- [ ] Home page loads
- [ ] Product listing works
- [ ] Farmer profiles display
- [ ] Campaign pages work
- [ ] Checkout flow functional
- [ ] Protected routes enforce auth
- [ ] Admin panel (if admin)
- [ ] Farmer dashboard (if farmer)

## 📊 Monitoring

After launch, monitor:

### Firebase Console
- **Hosting:** https://console.firebase.google.com
  - Traffic metrics
  - Bandwidth usage
  - Error rates

### Base Build
- **Analytics:** https://build.base.org
  - Installs/launches
  - User engagement
  - Error reports

### Browser Console (during testing)
Watch for:
- SDK ready signal: "🔐 User authenticated with SIWF"
- Wallet connection: "✅ Base Account detected"
- Any error messages

## 🐛 Troubleshooting

### Manifest Not Found (404)
**Problem:** https://farmer4u.web.app/.well-known/farcaster.json returns 404

**Solutions:**
1. Verify `public/.well-known/` directory exists
2. Check `firebase.json` hosting config
3. Rebuild and redeploy
4. Clear CDN cache (Firebase: wait 5-10 minutes)

### Account Association Failed
**Problem:** Base Build shows "Invalid signature" or "Verification failed"

**Solutions:**
1. Verify manifest is accessible and valid JSON
2. Check you're signing with the correct Base Account
3. Ensure domain matches exactly (no http://, no trailing slash)
4. Try generating credentials again

### App Doesn't Load in Base App
**Problem:** Mini app shows blank screen or doesn't launch

**Solutions:**
1. Check browser console for errors
2. Verify `sdk.actions.ready()` is called
3. Check all environment variables set
4. Test in Base Build preview first
5. Verify manifest URLs are accessible

### Authentication Not Working
**Problem:** SIWF sign in doesn't work or shows errors

**Solutions:**
1. Verify `VITE_COINBASE_API_KEY` is set
2. Check OnchainProviders wraps App.jsx
3. Test auth flow in browser first
4. Check console for OnchainKit errors
5. Verify you have a Farcaster account

### Wallet Features Not Working
**Problem:** Sponsored gas or batch transactions don't work

**Solutions:**
1. Check you're on Base chain (chainId: 0x2105)
2. Verify wallet is a Base Account (not just MetaMask)
3. Check paymaster API key is valid
4. Test with Base Account in Base App first

## 📞 Support Resources

- **Base Mini Apps Docs:** https://docs.farcaster.xyz/developers/guides/mini-apps
- **OnchainKit Docs:** https://onchainkit.xyz
- **Base Build:** https://build.base.org
- **Farcaster Docs:** https://docs.farcaster.xyz
- **Firebase Docs:** https://firebase.google.com/docs

## 🎉 Success Criteria

Your mini app is successfully deployed when:

✅ Manifest accessible at production URL
✅ Account association verified in Base Build
✅ App launches in Base App preview
✅ Authentication works (SIWF)
✅ Wallet integration functional
✅ Posted to Base App and live
✅ Users can access and use all features

---

**Current Status:** Ready for deployment
**Domain:** https://farmer4u.web.app
**Branch:** miniapp-base
**Next Step:** Generate account association credentials