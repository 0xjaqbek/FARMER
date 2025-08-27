// src/components/auth/CivicAuthStatus.jsx
import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Shield, 
  CheckCircle, 
  Wallet, 
  User,
  Mail
} from 'lucide-react';

const CivicAuthStatus = () => {
  const { currentUser, userProfile } = useAuth();

  if (!currentUser) return null;

  return (
    <Card className="bg-blue-50 border-blue-200">
      <CardContent className="pt-4">
        <div className="flex items-center gap-3">
          <Shield className="w-5 h-5 text-blue-600" />
          <div className="flex-1">
            <h4 className="font-semibold text-blue-900">Civic Auth Status</h4>
            <div className="flex items-center gap-2 mt-1">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="text-sm text-blue-700">Verified Account</span>
              
              {userProfile?.authProvider === 'civic' && (
                <Badge variant="outline" className="text-xs">
                  <Wallet className="w-3 h-3 mr-1" />
                  Web3 Ready
                </Badge>
              )}
            </div>
            
            <div className="text-xs text-blue-600 mt-1 space-y-1">
              <div className="flex items-center gap-1">
                <User className="w-3 h-3" />
                <span>Identity verified</span>
              </div>
              
              <div className="flex items-center gap-1">
                <Mail className="w-3 h-3" />
                <span>Email confirmed</span>
              </div>
              
              {userProfile?.authProvider === 'civic' && (
                <div className="flex items-center gap-1">
                  <Wallet className="w-3 h-3" />
                  <span>Crypto wallet enabled</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CivicAuthStatus;