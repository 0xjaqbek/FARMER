// src/components/reviews/FarmerResponseForm.jsx
import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { addFarmerResponse, updateFarmerResponse } from '../../firebase/reviews';
import { Loader2, MessageSquare, Send, X } from 'lucide-react';

const FarmerResponseForm = ({ 
  reviewId, 
  existingResponse = null,
  onSuccess,
  onCancel 
}) => {
  const { currentUser, userProfile } = useAuth();
  const [response, setResponse] = useState(existingResponse?.comment || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const isEditing = !!existingResponse;
  const maxLength = 500;
  
  // Quick response templates
  const responseTemplates = [
    "Thank you for your review! We're glad you enjoyed our product.",
    "Thank you for your feedback. We take all reviews seriously and are always working to improve.",
    "We appreciate your honest review and will use it to improve our products and service.",
    "Thank you for choosing our farm! Your support means a lot to us.",
    "We're sorry to hear about your experience. Please contact us directly so we can make this right."
  ];
  
  const handleTemplateSelect = (template) => {
    setResponse(template);
  };
  
  const validateResponse = () => {
    if (!response.trim()) {
      return 'Please enter a response';
    }
    
    if (response.trim().length < 10) {
      return 'Response should be at least 10 characters long';
    }
    
    if (response.length > maxLength) {
      return `Response cannot exceed ${maxLength} characters`;
    }
    
    return null;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const validationError = validateResponse();
    if (validationError) {
      setError(validationError);
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      const responseData = {
        comment: response.trim(),
        farmerId: currentUser.uid,
        farmerName: `${userProfile.firstName} ${userProfile.lastName}`
      };
      
      if (isEditing) {
        await updateFarmerResponse(reviewId, responseData);
      } else {
        await addFarmerResponse(reviewId, responseData);
      }
      
      if (onSuccess) {
        onSuccess();
      }
      
    } catch (err) {
      console.error('Error submitting farmer response:', err);
      setError(err.message || 'Failed to submit response. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-blue-600" />
            <span>{isEditing ? 'Edit Your Response' : 'Respond to Review'}</span>
          </div>
          <Badge variant="outline" className="text-blue-600 border-blue-300">
            Farmer
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {/* Quick Templates */}
        {!isEditing && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quick Response Templates
            </label>
            <div className="space-y-2">
              {responseTemplates.map((template, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  className="text-left justify-start h-auto p-2 whitespace-normal"
                  onClick={() => handleTemplateSelect(template)}
                  type="button"
                >
                  {template}
                </Button>
              ))}
            </div>
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Your Response *
            </label>
            <Textarea
              value={response}
              onChange={(e) => setResponse(e.target.value)}
              placeholder="Thank the customer for their review and address any concerns they mentioned. Keep it professional and helpful."
              rows={4}
              className="w-full"
              maxLength={maxLength}
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Minimum 10 characters</span>
              <span className={response.length > maxLength * 0.9 ? 'text-orange-600' : ''}>
                {response.length}/{maxLength}
              </span>
            </div>
          </div>
          
          {/* Response Guidelines */}
          <div className="mb-4 p-3 bg-blue-50 rounded-lg">
            <h4 className="text-sm font-medium text-blue-900 mb-2">
              Response Guidelines:
            </h4>
            <ul className="text-xs text-blue-800 space-y-1">
              <li>• Thank the customer for their review</li>
              <li>• Address specific concerns mentioned in the review</li>
              <li>• Keep your response professional and courteous</li>
              <li>• If there's an issue, offer to resolve it privately</li>
              <li>• Show that you value customer feedback</li>
            </ul>
          </div>
          
          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button 
              type="submit" 
              disabled={loading || !response.trim()}
              className="flex-1"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isEditing ? 'Updating...' : 'Submitting...'}
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  {isEditing ? 'Update Response' : 'Submit Response'}
                </>
              )}
            </Button>
            
            {onCancel && (
              <Button 
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={loading}
              >
                <X className="mr-2 h-4 w-4" />
                Cancel
              </Button>
            )}
          </div>
        </form>
        
        {/* Response Preview */}
        {response.trim() && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Preview:</h4>
            <div className="text-sm text-gray-600 italic">
              "{response.trim()}"
            </div>
            <div className="mt-2 text-xs text-gray-500">
              - {userProfile.firstName} {userProfile.lastName} (Farmer)
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default FarmerResponseForm;