// src/components/CivicConfigTest.jsx
// Add this component temporarily to test your Civic configuration

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

export const CivicConfigTest = () => {
  const [testResults, setTestResults] = useState(null);
  const [testing, setTesting] = useState(false);

  const runConfigTest = () => {
    setTesting(true);
    
    // Test 1: Environment Variable
    const clientId = import.meta.env.VITE_CIVIC_CLIENT_ID;
    const hasClientId = !!clientId;
    const clientIdLength = clientId?.length || 0;
    const clientIdPreview = clientId ? `${clientId.substring(0, 8)}...` : 'Not found';

    // Test 2: URL and Environment
    const currentUrl = window.location.origin;
    const environment = import.meta.env.MODE;

    // Test 3: Basic Civic SDK Import
    let sdkImported = false;
    try {
      import('@civic/auth/vanillajs').then(() => {
        sdkImported = true;
      });
      sdkImported = true; // If we got here, import worked
    } catch {
      sdkImported = false;
    }

    const results = {
      environmentVariable: {
        passed: hasClientId,
        message: hasClientId ? 
          `Client ID found (${clientIdLength} chars): ${clientIdPreview}` : 
          'VITE_CIVIC_CLIENT_ID not found in environment variables',
        details: {
          length: clientIdLength,
          preview: clientIdPreview,
          environment: environment
        }
      },
      domain: {
        passed: currentUrl.includes('localhost'),
        message: `Current domain: ${currentUrl}`,
        details: {
          isLocalhost: currentUrl.includes('localhost'),
          protocol: window.location.protocol,
          port: window.location.port
        }
      },
      sdk: {
        passed: sdkImported,
        message: sdkImported ? 'Civic SDK imported successfully' : 'Failed to import Civic SDK'
      }
    };

    setTestResults(results);
    setTesting(false);
  };

  const TestResult = ({ test, title }) => (
    <div className="border rounded p-3 mb-2">
      <div className="flex items-center gap-2 mb-1">
        <span className={`text-lg ${test.passed ? 'text-green-500' : 'text-red-500'}`}>
          {test.passed ? '✅' : '❌'}
        </span>
        <span className="font-medium">{title}</span>
      </div>
      <p className="text-sm text-gray-600 ml-6">{test.message}</p>
      {test.details && (
        <div className="ml-6 mt-1 text-xs text-gray-500">
          {Object.entries(test.details).map(([key, value]) => (
            <div key={key}>{key}: {String(value)}</div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <Card className="w-full max-w-2xl mx-auto m-4">
      <CardHeader>
        <CardTitle>🔍 Civic Auth Configuration Test</CardTitle>
      </CardHeader>
      <CardContent>
        <Button 
          onClick={runConfigTest} 
          disabled={testing}
          className="mb-4"
        >
          {testing ? 'Testing...' : 'Run Configuration Test'}
        </Button>

        {testResults && (
          <div className="space-y-2">
            <TestResult test={testResults.environmentVariable} title="Environment Variable" />
            <TestResult test={testResults.domain} title="Domain Configuration" />
            <TestResult test={testResults.sdk} title="SDK Import" />

            <Alert className="mt-4">
              <AlertDescription>
                <strong>Next Steps:</strong>
                <br />
                {!testResults.environmentVariable.passed && (
                  <>• Add VITE_CIVIC_CLIENT_ID to your .env file and restart the dev server<br /></>
                )}
                {testResults.environmentVariable.passed && (
                  <>• Go to auth.civic.com and add "{window.location.origin}" to your allowed domains<br /></>
                )}
                • Make sure your Civic application type is set to "Web Application"<br />
                • Try leaving redirect URLs empty in Civic dashboard initially
              </AlertDescription>
            </Alert>

            {testResults.environmentVariable.passed && (
              <div className="mt-4 p-3 bg-blue-50 rounded">
                <h4 className="font-medium mb-2">Civic Dashboard Checklist:</h4>
                <ol className="text-sm space-y-1 list-decimal list-inside">
                  <li>Go to <a href="https://auth.civic.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">auth.civic.com</a></li>
                  <li>Find your application with Client ID: <code className="bg-gray-100 px-1 rounded">{testResults.environmentVariable.details.preview}</code></li>
                  <li>Add domain: <code className="bg-gray-100 px-1 rounded">{window.location.origin}</code></li>
                  <li>Set Application Type to "Web Application"</li>
                  <li>Save settings and try authentication again</li>
                </ol>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};