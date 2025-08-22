// src/components/payment/FarmerPaymentSetup.jsx
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  CreditCard, 
  Smartphone, 
  Wallet,
  Plus,
  Trash2,
  CheckCircle,
  AlertCircle,
  Copy,
  Eye,
  EyeOff,
  ExternalLink
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { 
  validatePolishIBAN, 
  validatePolishPhoneNumber, 
  validateCryptoAddress,
  CRYPTO_NETWORKS 
} from '@/lib/firebaseSchema';

const FarmerPaymentSetup = () => {
  const { userProfile, updateUserProfile } = useAuth();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('bank');
  
  // Form state
  const [paymentData, setPaymentData] = useState({
    bankAccount: {
      enabled: false,
      bankName: '',
      accountNumber: '',
      accountHolder: '',
      swiftCode: '',
      iban: '',
      verified: false
    },
    blik: {
      enabled: false,
      phoneNumber: '',
      verified: false
    },
    cryptoWallets: [],
    preferences: {
      autoConfirmPayments: false,
      paymentDeadlineHours: 24,
      minimumOrderAmount: 0,
      preferredMethod: 'bank_transfer'
    }
  });

  // Load existing payment data
  useEffect(() => {
    if (userProfile?.paymentInfo) {
      setPaymentData(userProfile.paymentInfo);
    }
  }, [userProfile]);

  // Handle form field changes
  const handleFieldChange = (section, field, value) => {
    setPaymentData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  // Add new crypto wallet
  const addCryptoWallet = () => {
    const newWallet = {
      id: Date.now().toString(),
      network: 'ethereum',
      address: '',
      currency: 'ETH',
      label: '',
      enabled: true,
      verified: false
    };
    
    setPaymentData(prev => ({
      ...prev,
      cryptoWallets: [...prev.cryptoWallets, newWallet]
    }));
  };

  // Update crypto wallet
  const updateCryptoWallet = (id, field, value) => {
    setPaymentData(prev => ({
      ...prev,
      cryptoWallets: prev.cryptoWallets.map(wallet =>
        wallet.id === id ? { ...wallet, [field]: value } : wallet
      )
    }));
  };

  // Remove crypto wallet
  const removeCryptoWallet = (id) => {
    setPaymentData(prev => ({
      ...prev,
      cryptoWallets: prev.cryptoWallets.filter(wallet => wallet.id !== id)
    }));
  };

  // Validate payment methods
  const validatePaymentData = () => {
    const errors = [];

    // Validate bank account if enabled
    if (paymentData.bankAccount.enabled) {
      if (!paymentData.bankAccount.accountNumber && !paymentData.bankAccount.iban) {
        errors.push('Bank account number or IBAN is required');
      }
      
      if (paymentData.bankAccount.iban && !validatePolishIBAN(paymentData.bankAccount.iban)) {
        errors.push('Invalid Polish IBAN format');
      }
      
      if (!paymentData.bankAccount.accountHolder) {
        errors.push('Account holder name is required');
      }
    }

    // Validate BLIK if enabled
    if (paymentData.blik.enabled) {
      if (!paymentData.blik.phoneNumber) {
        errors.push('Phone number is required for BLIK');
      } else if (!validatePolishPhoneNumber(paymentData.blik.phoneNumber)) {
        errors.push('Invalid Polish phone number format');
      }
    }

    // Validate crypto wallets
    paymentData.cryptoWallets.forEach((wallet, index) => {
      if (wallet.enabled && wallet.address && !validateCryptoAddress(wallet.address, wallet.network)) {
        errors.push(`Invalid ${wallet.network} wallet address in wallet ${index + 1}`);
      }
    });

    return errors;
  };

  // Save payment configuration
  const handleSave = async () => {
    try {
      setSaving(true);
      
      const errors = validatePaymentData();
      if (errors.length > 0) {
        toast({
          title: 'Validation Error',
          description: errors.join(', '),
          variant: 'destructive'
        });
        return;
      }

      // Update user profile with payment information
      await updateUserProfile({
        paymentInfo: {
          ...paymentData,
          updatedAt: new Date()
        }
      });

      toast({
        title: 'Success',
        description: 'Payment methods updated successfully'
      });

    } catch (error) {
      console.error('Error saving payment data:', error);
      toast({
        title: 'Error',
        description: 'Failed to save payment methods',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  // Verify payment method (placeholder for real verification)
  const verifyPaymentMethod = async (type, ) => {
    // In a real implementation, this would:
    // - For bank: verify with small test transaction
    // - For BLIK: send verification code via SMS
    // - For crypto: request small test transaction
    
    toast({
      title: 'Verification Started',
      description: `${type} verification process initiated. Please check your notifications.`
    });
  };

  // Copy to clipboard
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied',
      description: 'Copied to clipboard'
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Payment Methods</h2>
        <p className="text-gray-600">
          Configure how customers can pay you. Verified payment methods will be shown to customers during checkout.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="bank" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Bank Transfer
          </TabsTrigger>
          <TabsTrigger value="blik" className="flex items-center gap-2">
            <Smartphone className="h-4 w-4" />
            BLIK
          </TabsTrigger>
          <TabsTrigger value="crypto" className="flex items-center gap-2">
            <Wallet className="h-4 w-4" />
            Crypto
          </TabsTrigger>
          <TabsTrigger value="preferences">
            Preferences
          </TabsTrigger>
        </TabsList>

        {/* Bank Transfer Tab */}
        <TabsContent value="bank">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Bank Transfer</span>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={paymentData.bankAccount.enabled}
                    onCheckedChange={(checked) => handleFieldChange('bankAccount', 'enabled', checked)}
                  />
                  {paymentData.bankAccount.verified && (
                    <Badge variant="success" className="flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" />
                      Verified
                    </Badge>
                  )}
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {paymentData.bankAccount.enabled && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="bankName">Bank Name</Label>
                      <Input
                        id="bankName"
                        value={paymentData.bankAccount.bankName}
                        onChange={(e) => handleFieldChange('bankAccount', 'bankName', e.target.value)}
                        placeholder="e.g., PKO Bank Polski"
                      />
                    </div>
                    <div>
                      <Label htmlFor="accountHolder">Account Holder</Label>
                      <Input
                        id="accountHolder"
                        value={paymentData.bankAccount.accountHolder}
                        onChange={(e) => handleFieldChange('bankAccount', 'accountHolder', e.target.value)}
                        placeholder="Full name on account"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="iban">IBAN (Polish format)</Label>
                    <Input
                      id="iban"
                      value={paymentData.bankAccount.iban}
                      onChange={(e) => handleFieldChange('bankAccount', 'iban', e.target.value)}
                      placeholder="PL61 1090 1014 0000 0712 1981 2874"
                    />
                  </div>

                  <div>
                    <Label htmlFor="accountNumber">Account Number (alternative)</Label>
                    <Input
                      id="accountNumber"
                      value={paymentData.bankAccount.accountNumber}
                      onChange={(e) => handleFieldChange('bankAccount', 'accountNumber', e.target.value)}
                      placeholder="26 character account number"
                    />
                  </div>

                  <div>
                    <Label htmlFor="swiftCode">SWIFT/BIC Code (optional)</Label>
                    <Input
                      id="swiftCode"
                      value={paymentData.bankAccount.swiftCode}
                      onChange={(e) => handleFieldChange('bankAccount', 'swiftCode', e.target.value)}
                      placeholder="e.g., PKOPPLPW"
                    />
                  </div>

                  {!paymentData.bankAccount.verified && (
                    <Button
                      onClick={() => verifyPaymentMethod('Bank Account', paymentData.bankAccount)}
                      variant="outline"
                    >
                      Verify Bank Account
                    </Button>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* BLIK Tab */}
        <TabsContent value="blik">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>BLIK Transfer</span>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={paymentData.blik.enabled}
                    onCheckedChange={(checked) => handleFieldChange('blik', 'enabled', checked)}
                  />
                  {paymentData.blik.verified && (
                    <Badge variant="success" className="flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" />
                      Verified
                    </Badge>
                  )}
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {paymentData.blik.enabled && (
                <>
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      BLIK transfers allow customers to send money directly to your phone number using their mobile banking app.
                    </AlertDescription>
                  </Alert>

                  <div>
                    <Label htmlFor="blikPhone">Phone Number</Label>
                    <Input
                      id="blikPhone"
                      value={paymentData.blik.phoneNumber}
                      onChange={(e) => handleFieldChange('blik', 'phoneNumber', e.target.value)}
                      placeholder="+48 123 456 789"
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      This must be the phone number linked to your BLIK-enabled bank account
                    </p>
                  </div>

                  {!paymentData.blik.verified && (
                    <Button
                      onClick={() => verifyPaymentMethod('BLIK', paymentData.blik)}
                      variant="outline"
                    >
                      Verify BLIK Number
                    </Button>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Crypto Tab */}
        <TabsContent value="crypto">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Cryptocurrency Wallets</span>
                <Button onClick={addCryptoWallet} size="sm">
                  <Plus className="h-4 w-4 mr-1" />
                  Add Wallet
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {paymentData.cryptoWallets.length === 0 ? (
                <Alert>
                  <Wallet className="h-4 w-4" />
                  <AlertDescription>
                    No crypto wallets configured. Add a wallet to accept cryptocurrency payments.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-4">
                  {paymentData.cryptoWallets.map((wallet, index) => (
                    <Card key={wallet.id} className="p-4">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">Wallet {index + 1}</h4>
                          {wallet.verified && (
                            <Badge variant="success" className="flex items-center gap-1">
                              <CheckCircle className="h-3 w-3" />
                              Verified
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={wallet.enabled}
                            onCheckedChange={(checked) => updateCryptoWallet(wallet.id, 'enabled', checked)}
                          />
                          <Button
                            onClick={() => removeCryptoWallet(wallet.id)}
                            variant="ghost"
                            size="sm"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {wallet.enabled && (
                        <div className="space-y-3">
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <Label>Network</Label>
                              <select
                                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                value={wallet.network}
                                onChange={(e) => {
                                  const network = e.target.value;
                                  const currencyMap = {
                                    ethereum: 'ETH',
                                    bitcoin: 'BTC',
                                    polygon: 'MATIC',
                                    bsc: 'BNB',
                                    solana: 'SOL'
                                  };
                                  updateCryptoWallet(wallet.id, 'network', network);
                                  updateCryptoWallet(wallet.id, 'currency', currencyMap[network] || 'ETH');
                                }}
                              >
                                {Object.entries(CRYPTO_NETWORKS).map(([key, value]) => (
                                  <option key={key} value={value}>
                                    {value.charAt(0).toUpperCase() + value.slice(1)}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <Label>Currency</Label>
                              <Input
                                value={wallet.currency}
                                onChange={(e) => updateCryptoWallet(wallet.id, 'currency', e.target.value)}
                                placeholder="ETH, USDC, etc."
                              />
                            </div>
                          </div>

                          <div>
                            <Label>Wallet Address</Label>
                            <div className="flex gap-2">
                              <Input
                                value={wallet.address}
                                onChange={(e) => updateCryptoWallet(wallet.id, 'address', e.target.value)}
                                placeholder="0x... or wallet address"
                                className="flex-1"
                              />
                              <Button
                                onClick={() => copyToClipboard(wallet.address)}
                                variant="outline"
                                size="sm"
                                disabled={!wallet.address}
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>

                          <div>
                            <Label>Label (optional)</Label>
                            <Input
                              value={wallet.label}
                              onChange={(e) => updateCryptoWallet(wallet.id, 'label', e.target.value)}
                              placeholder="e.g., Main ETH Wallet"
                            />
                          </div>

                          {!wallet.verified && wallet.address && (
                            <Button
                              onClick={() => verifyPaymentMethod('Crypto Wallet', wallet)}
                              variant="outline"
                              size="sm"
                            >
                              Verify Wallet
                            </Button>
                          )}
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Preferences Tab */}
        <TabsContent value="preferences">
          <Card>
            <CardHeader>
              <CardTitle>Payment Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Auto-confirm payments</Label>
                  <p className="text-sm text-gray-500">
                    Automatically mark orders as paid when payment is detected
                  </p>
                </div>
                <Switch
                  checked={paymentData.preferences.autoConfirmPayments}
                  onCheckedChange={(checked) => handleFieldChange('preferences', 'autoConfirmPayments', checked)}
                />
              </div>

              <div>
                <Label>Payment deadline (hours)</Label>
                <Input
                  type="number"
                  value={paymentData.preferences.paymentDeadlineHours}
                  onChange={(e) => handleFieldChange('preferences', 'paymentDeadlineHours', parseInt(e.target.value))}
                  min="1"
                  max="168"
                  className="w-32"
                />
                <p className="text-sm text-gray-500 mt-1">
                  How long customers have to complete payment (1-168 hours)
                </p>
              </div>

              <div>
                <Label>Minimum order amount (PLN)</Label>
                <Input
                  type="number"
                  value={paymentData.preferences.minimumOrderAmount}
                  onChange={(e) => handleFieldChange('preferences', 'minimumOrderAmount', parseFloat(e.target.value) || 0)}
                  min="0"
                  step="0.01"
                  className="w-32"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Minimum order value to accept payments
                </p>
              </div>

              <div>
                <Label>Preferred payment method</Label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  value={paymentData.preferences.preferredMethod}
                  onChange={(e) => handleFieldChange('preferences', 'preferredMethod', e.target.value)}
                >
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="blik">BLIK</option>
                  <option value="crypto">Cryptocurrency</option>
                  <option value="cash">Cash on Delivery</option>
                </select>
                <p className="text-sm text-gray-500 mt-1">
                  Default payment method shown first to customers
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save Payment Methods'}
        </Button>
      </div>

      {/* Payment Method Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Active Payment Methods Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {paymentData.bankAccount.enabled && (
              <div className="p-3 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <CreditCard className="h-4 w-4" />
                  <span className="font-medium">Bank Transfer</span>
                  {paymentData.bankAccount.verified ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-yellow-600" />
                  )}
                </div>
                <p className="text-sm text-gray-600">
                  {paymentData.bankAccount.bankName || 'Bank not specified'}
                </p>
                <p className="text-xs text-gray-500">
                  {paymentData.bankAccount.verified ? 'Verified' : 'Pending verification'}
                </p>
              </div>
            )}

            {paymentData.blik.enabled && (
              <div className="p-3 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Smartphone className="h-4 w-4" />
                  <span className="font-medium">BLIK</span>
                  {paymentData.blik.verified ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-yellow-600" />
                  )}
                </div>
                <p className="text-sm text-gray-600">
                  {paymentData.blik.phoneNumber || 'Phone not specified'}
                </p>
                <p className="text-xs text-gray-500">
                  {paymentData.blik.verified ? 'Verified' : 'Pending verification'}
                </p>
              </div>
            )}

            {paymentData.cryptoWallets.filter(w => w.enabled).length > 0 && (
              <div className="p-3 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Wallet className="h-4 w-4" />
                  <span className="font-medium">Crypto</span>
                </div>
                <p className="text-sm text-gray-600">
                  {paymentData.cryptoWallets.filter(w => w.enabled).length} wallet(s)
                </p>
                <p className="text-xs text-gray-500">
                  {paymentData.cryptoWallets.filter(w => w.enabled && w.verified).length} verified
                </p>
              </div>
            )}
          </div>

          {!paymentData.bankAccount.enabled && !paymentData.blik.enabled && paymentData.cryptoWallets.filter(w => w.enabled).length === 0 && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                No payment methods configured. Customers will only be able to pay with cash on delivery.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default FarmerPaymentSetup;