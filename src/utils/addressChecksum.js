// src/utils/addressChecksum.js
// Utility for debugging and fixing Ethereum address checksum issues
import React from 'react';
import { ethers } from 'ethers';

/**
 * Validate and get checksummed Ethereum address
 * @param {string} address - Address to validate and checksum
 * @returns {Object} Validation result with checksummed address
 */
export const validateAndChecksumAddress = (address) => {
  console.group(`🔍 Address Checksum Validation: ${address}`);
  
  try {
    // Check if address is provided
    if (!address || typeof address !== 'string') {
      throw new Error('Address must be a non-empty string');
    }

    // Remove any whitespace
    const cleanAddress = address.trim();
    
    // Check basic format
    if (!cleanAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
      throw new Error('Address must be a valid 40-character hex string starting with 0x');
    }

    // Get checksummed address using ethers.js
    const checksummedAddress = ethers.getAddress(cleanAddress);
    
    console.log('✅ Original:', address);
    console.log('✅ Checksummed:', checksummedAddress);
    console.log('✅ Valid:', checksummedAddress === address ? 'Yes' : 'No (corrected)');
    
    console.groupEnd();

    return {
      isValid: true,
      original: address,
      checksummed: checksummedAddress,
      needsCorrection: checksummedAddress !== address
    };

  } catch (error) {
    console.error('❌ Validation failed:', error.message);
    console.groupEnd();
    
    return {
      isValid: false,
      original: address,
      error: error.message,
      checksummed: null
    };
  }
};

/**
 * Check all addresses in ZetaChain configuration
 */
export const validateZetaChainAddresses = async () => {
  console.group('🔧 ZetaChain Address Validation');
  
  const addressesToCheck = [
    { name: 'ZetaChain Mainnet Connector', address: '0x1c40cE2CCC2346B43FB1b3ceE8f9A8c37d9D7eC7' },
    { name: 'ZetaChain Testnet Connector', address: '0x1c40cE2CCC2346B43FB1b3ceE8f9A8c37d9D7eC7' },
    // Add more addresses as needed
  ];

  const results = [];

  for (const { name, address } of addressesToCheck) {
    console.log(`\nChecking ${name}:`);
    const result = validateAndChecksumAddress(address);
    results.push({ name, ...result });
  }

  console.log('\n📊 Summary:');
  results.forEach(({ name, isValid, needsCorrection, checksummed, error }) => {
    if (isValid) {
      console.log(`✅ ${name}: ${needsCorrection ? 'Fixed' : 'Valid'} - ${checksummed}`);
    } else {
      console.error(`❌ ${name}: ${error}`);
    }
  });

  console.groupEnd();
  return results;
};

/**
 * Get corrected addresses for ZetaChain configuration
 */
export const getCorrectedZetaChainAddresses = () => {
  const addresses = {
    connector: '0x1c40cE2CCC2346B43FB1b3ceE8f9A8c37d9D7eC7'
  };

  const corrected = {};

  Object.entries(addresses).forEach(([key, address]) => {
    const result = validateAndChecksumAddress(address);
    corrected[key] = result.isValid ? result.checksummed : address;
  });

  console.log('🔧 Corrected ZetaChain addresses:', corrected);
  return corrected;
};

/**
 * Debug component for address validation
 */
export const AddressDebugComponent = ({ addresses = [] }) => {
  const [validationResults, setValidationResults] = React.useState([]);

  React.useEffect(() => {
    const results = addresses.map(({ name, address }) => ({
      name,
      ...validateAndChecksumAddress(address)
    }));
    setValidationResults(results);
  }, [addresses]);

  return (
    <div className="p-4 border rounded bg-gray-50">
      <h3 className="font-semibold mb-2">🔍 Address Checksum Debug</h3>
      {validationResults.map(({ name, isValid, original, checksummed, error }) => (
        <div key={name} className="mb-2 p-2 border rounded bg-white">
          <div className="font-medium">{name}</div>
          <div className="text-xs font-mono text-gray-600">Original: {original}</div>
          {isValid ? (
            <div className="text-xs font-mono text-green-600">✅ Checksummed: {checksummed}</div>
          ) : (
            <div className="text-xs text-red-600">❌ Error: {error}</div>
          )}
        </div>
      ))}
    </div>
  );
};

// Example usage for debugging ZetaChain addresses
export const debugZetaChainAddressIssues = () => {
  console.group('🚨 ZetaChain Address Checksum Debug Session');
  
  // Test the problematic address from the error
  const problematicAddress = '0x1c40cE2CCC2346B43FB1b3ceE8f9A8c37d9D7eC7';
  
  console.log('Testing problematic address from error:', problematicAddress);
  const result = validateAndChecksumAddress(problematicAddress);
  
  if (result.isValid && result.needsCorrection) {
    console.log('🔧 Address needs correction:');
    console.log(`   Use: ${result.checksummed}`);
    console.log(`   Instead of: ${result.original}`);
  } else if (result.isValid) {
    console.log('✅ Address is already correct');
  } else {
    console.error('❌ Address is invalid:', result.error);
  }

  // Get the correct address
  try {
    const correctAddress = ethers.getAddress(problematicAddress);
    console.log('✅ Correct checksummed address:', correctAddress);
  } catch (error) {
    console.error('❌ Failed to get checksummed address:', error.message);
  }

  console.groupEnd();
};

export default {
  validateAndChecksumAddress,
  validateZetaChainAddresses,
  getCorrectedZetaChainAddresses,
  AddressDebugComponent,
  debugZetaChainAddressIssues
};