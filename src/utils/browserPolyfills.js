// src/utils/browserPolyfills.js
// Browser polyfills for Node.js globals and crypto operations

/**
 * Browser-compatible Buffer implementation
 */
export const BufferPolyfill = {
  /**
   * Create buffer from data
   * @param {string|Array|Uint8Array} data - Input data
   * @param {string} encoding - Encoding type (utf8, hex, base64)
   * @returns {Uint8Array}
   */
  from: (data, encoding = 'utf8') => {
    if (typeof data === 'string') {
      switch (encoding) {
        case 'hex':
          // Convert hex string to Uint8Array
          { const hexBytes = new Uint8Array(data.length / 2);
          for (let i = 0; i < data.length; i += 2) {
            hexBytes[i / 2] = parseInt(data.substr(i, 2), 16);
          }
          return hexBytes; }
          
        case 'base64':
          // Convert base64 to Uint8Array
          { const binaryString = atob(data);
          const base64Bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            base64Bytes[i] = binaryString.charCodeAt(i);
          }
          return base64Bytes; }
          
        case 'utf8':
        default:
          // Convert string to Uint8Array
          return new TextEncoder().encode(data);
      }
    } else if (Array.isArray(data)) {
      return new Uint8Array(data);
    } else if (data instanceof Uint8Array) {
      return data;
    } else {
      throw new Error(`Unsupported data type: ${typeof data}`);
    }
  },
  
  /**
   * Allocate new buffer
   * @param {number} size - Buffer size
   * @returns {Uint8Array}
   */
  alloc: (size) => new Uint8Array(size),
  
  /**
   * Concatenate multiple arrays
   * @param {Array<Uint8Array>} arrays - Arrays to concatenate
   * @returns {Uint8Array}
   */
  concat: (arrays) => {
    const totalLength = arrays.reduce((sum, arr) => sum + arr.length, 0);
    const result = new Uint8Array(totalLength);
    let offset = 0;
    for (const arr of arrays) {
      result.set(arr, offset);
      offset += arr.length;
    }
    return result;
  },
  
  /**
   * Compare two buffers
   * @param {Uint8Array} a - First buffer
   * @param {Uint8Array} b - Second buffer
   * @returns {number} - Comparison result (-1, 0, 1)
   */
  compare: (a, b) => {
    if (a.length !== b.length) {
      return a.length - b.length;
    }
    for (let i = 0; i < a.length; i++) {
      if (a[i] !== b[i]) {
        return a[i] - b[i];
      }
    }
    return 0;
  }
};

/**
 * Utility functions for data conversion
 */
export const DataUtils = {
  /**
   * Convert Uint8Array to hex string
   * @param {Uint8Array} array - Input array
   * @returns {string} Hex string
   */
  arrayToHex: (array) => {
    return Array.from(array)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  },

  /**
   * Convert string to hex
   * @param {string} str - Input string
   * @returns {string} Hex string
   */
  stringToHex: (str) => {
    return DataUtils.arrayToHex(new TextEncoder().encode(str));
  },

  /**
   * Convert hex string to string
   * @param {string} hex - Hex string
   * @returns {string} UTF-8 string
   */
  hexToString: (hex) => {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
      bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
    }
    return new TextDecoder().decode(bytes);
  },

  /**
   * Convert number to bytes (little-endian)
   * @param {number} num - Number to convert
   * @param {number} bytes - Number of bytes
   * @returns {Uint8Array}
   */
  numberToBytes: (num, bytes = 4) => {
    const buffer = new ArrayBuffer(bytes);
    const view = new DataView(buffer);
    
    if (bytes === 4) {
      view.setUint32(0, num, true); // little-endian
    } else if (bytes === 8) {
      view.setFloat64(0, num, true); // little-endian
    } else if (bytes === 2) {
      view.setUint16(0, num, true); // little-endian
    } else {
      throw new Error(`Unsupported byte length: ${bytes}`);
    }
    
    return new Uint8Array(buffer);
  },

  /**
   * Convert bytes to number (little-endian)
   * @param {Uint8Array} bytes - Bytes to convert
   * @returns {number}
   */
  bytesToNumber: (bytes) => {
    const view = new DataView(bytes.buffer);
    
    if (bytes.length === 4) {
      return view.getUint32(0, true); // little-endian
    } else if (bytes.length === 8) {
      return view.getFloat64(0, true); // little-endian
    } else if (bytes.length === 2) {
      return view.getUint16(0, true); // little-endian
    } else if (bytes.length === 1) {
      return view.getUint8(0);
    } else {
      throw new Error(`Unsupported byte length: ${bytes.length}`);
    }
  }
};

/**
 * Crypto utilities for browser
 */
export const CryptoUtils = {
  /**
   * Generate random bytes
   * @param {number} size - Number of bytes
   * @returns {Uint8Array}
   */
  randomBytes: (size) => {
    const array = new Uint8Array(size);
    if (window.crypto && window.crypto.getRandomValues) {
      window.crypto.getRandomValues(array);
    } else {
      // Fallback for older browsers
      for (let i = 0; i < size; i++) {
        array[i] = Math.floor(Math.random() * 256);
      }
    }
    return array;
  },

  /**
   * Generate UUID v4
   * @returns {string} UUID string
   */
  generateUUID: () => {
    if (window.crypto && window.crypto.randomUUID) {
      return window.crypto.randomUUID();
    } else {
      // Fallback UUID generation
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
    }
  },

  /**
   * Hash data using SHA-256
   * @param {string|Uint8Array} data - Data to hash
   * @returns {Promise<string>} Hex-encoded hash
   */
  sha256: async (data) => {
    let bytes;
    if (typeof data === 'string') {
      bytes = new TextEncoder().encode(data);
    } else {
      bytes = data;
    }
    
    const hashBuffer = await crypto.subtle.digest('SHA-256', bytes);
    return DataUtils.arrayToHex(new Uint8Array(hashBuffer));
  }
};

/**
 * Set up global polyfills
 */
export const setupGlobalPolyfills = () => {
  // Add Buffer to global scope if not present
  if (typeof window !== 'undefined' && !window.Buffer) {
    window.Buffer = BufferPolyfill;
  }

  // Add process.env polyfill if not present
  if (typeof window !== 'undefined' && !window.process) {
    window.process = {
      env: {
        NODE_ENV: import.meta.env.MODE || 'development',
        ...import.meta.env
      }
    };
  }

  // Add crypto polyfill for older browsers
  if (typeof window !== 'undefined' && !window.crypto) {
    window.crypto = {
      getRandomValues: (array) => {
        for (let i = 0; i < array.length; i++) {
          array[i] = Math.floor(Math.random() * 256);
        }
        return array;
      }
    };
  }

  console.log('🔧 Browser polyfills initialized');
};

// Auto-setup polyfills when imported
if (typeof window !== 'undefined') {
  setupGlobalPolyfills();
}

export default {
  BufferPolyfill,
  DataUtils,
  CryptoUtils,
  setupGlobalPolyfills
};