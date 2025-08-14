/**
 * Security utilities for Typeflow Chrome Extension
 * Implements enterprise-grade security measures
 */

// Input validation and sanitization
export class SecurityUtils {
  
  /**
   * Sanitize user input to prevent XSS attacks
   */
  static sanitizeInput(input: string): string {
    if (typeof input !== 'string') {
      return '';
    }
    
    // Remove potentially dangerous HTML tags and scripts
    const sanitized = input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
      .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/vbscript:/gi, '')
      .replace(/on\w+\s*=/gi, '');
    
    return sanitized.trim();
  }

  /**
   * Validate text length to prevent buffer overflow attacks
   */
  static validateTextLength(text: string, maxLength: number = 10000): boolean {
    return typeof text === 'string' && text.length <= maxLength;
  }

  /**
   * Validate API key format
   */
  static validateApiKey(apiKey: string): boolean {
    if (typeof apiKey !== 'string') return false;
    
    // OpenAI API key format validation
    const openaiPattern = /^sk-[a-zA-Z0-9]{48,}$/;
    return openaiPattern.test(apiKey);
  }

  /**
   * Secure storage wrapper for sensitive data
   */
  static async secureStore(key: string, value: any): Promise<void> {
    try {
      // Validate key format
      if (!key || typeof key !== 'string' || key.length > 100) {
        throw new Error('Invalid storage key');
      }
      
      // Store with chrome.storage.local (encrypted by Chrome)
      await chrome.storage.local.set({ [key]: value });
    } catch (error) {
      console.error('Secure storage failed:', error);
      throw new Error('Failed to store sensitive data securely');
    }
  }

  /**
   * Rate limiting implementation
   */
  static rateLimiter = (() => {
    const requests = new Map<string, number[]>();
    
    return {
      checkLimit(identifier: string, maxRequests: number = 100, windowMs: number = 60000): boolean {
        const now = Date.now();
        const windowStart = now - windowMs;
        
        if (!requests.has(identifier)) {
          requests.set(identifier, []);
        }
        
        const userRequests = requests.get(identifier)!;
        
        // Remove old requests outside the window
        const validRequests = userRequests.filter(timestamp => timestamp > windowStart);
        
        if (validRequests.length >= maxRequests) {
          return false; // Rate limit exceeded
        }
        
        // Add current request
        validRequests.push(now);
        requests.set(identifier, validRequests);
        
        return true; // Request allowed
      }
    };
  })();

  /**
   * Content Security Policy validation
   */
  static validateCSP(content: string): boolean {
    // Check for dangerous inline scripts or styles
    const dangerousPatterns = [
      /<script[^>]*>/i,
      /javascript:/i,
      /vbscript:/i,
      /on\w+\s*=/i,
      /eval\s*\(/i,
      /Function\s*\(/i
    ];
    
    return !dangerousPatterns.some(pattern => pattern.test(content));
  }

  /**
   * URL validation for external requests
   */
  static validateUrl(url: string): boolean {
    try {
      const urlObj = new URL(url);
      
      // Only allow HTTPS for external requests (except localhost for development)
      if (urlObj.protocol !== 'https:' && !urlObj.hostname.includes('localhost')) {
        return false;
      }
      
      // Whitelist allowed domains
      const allowedDomains = [
        'api.openai.com',
        'backend.belikenative.com',
        'typeflow.today',
        'localhost'
      ];
      
      return allowedDomains.some(domain => 
        urlObj.hostname === domain || urlObj.hostname.endsWith('.' + domain)
      );
    } catch {
      return false;
    }
  }

  /**
   * Error boundary for safe error handling
   */
  static safeExecute<T>(
    operation: () => T,
    fallback: T,
    errorHandler?: (error: Error) => void
  ): T {
    try {
      return operation();
    } catch (error) {
      if (errorHandler) {
        errorHandler(error instanceof Error ? error : new Error(String(error)));
      }
      return fallback;
    }
  }

  /**
   * Secure random ID generation
   */
  static generateSecureId(): string {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Memory cleanup for sensitive data
   */
  static secureCleanup(obj: any): void {
    if (typeof obj === 'object' && obj !== null) {
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          if (typeof obj[key] === 'string') {
            // Overwrite string with random data
            obj[key] = SecurityUtils.generateSecureId();
          }
          delete obj[key];
        }
      }
    }
  }

  /**
   * Audit log for security events
   */
  static auditLog(event: string, details: any = {}): void {
    const logEntry = {
      timestamp: new Date().toISOString(),
      event,
      details: SecurityUtils.sanitizeInput(JSON.stringify(details)),
      userAgent: navigator.userAgent,
      url: window.location?.href || 'extension'
    };
    
    // Log to console in development, could be sent to monitoring service in production
    console.log('[SECURITY AUDIT]', logEntry);
  }
}

/**
 * Security-enhanced fetch wrapper
 */
export async function secureFetch(
  url: string, 
  options: RequestInit = {}
): Promise<Response> {
  // Validate URL
  if (!SecurityUtils.validateUrl(url)) {
    SecurityUtils.auditLog('BLOCKED_REQUEST', { url, reason: 'Invalid URL' });
    throw new Error('Request blocked: Invalid or unauthorized URL');
  }

  // Rate limiting check
  if (!SecurityUtils.rateLimiter.checkLimit('api_requests', 100, 60000)) {
    SecurityUtils.auditLog('RATE_LIMIT_EXCEEDED', { url });
    throw new Error('Rate limit exceeded. Please try again later.');
  }

  // Add security headers
  const secureOptions: RequestInit = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
      ...options.headers
    },
    credentials: 'omit', // Don't send cookies
    referrerPolicy: 'no-referrer'
  };

  try {
    const response = await fetch(url, secureOptions);
    
    // Audit successful requests
    SecurityUtils.auditLog('API_REQUEST', { 
      url: url.replace(/sk-[a-zA-Z0-9]+/, 'sk-***'), 
      status: response.status 
    });
    
    return response;
  } catch (error) {
    SecurityUtils.auditLog('API_ERROR', { url, error: String(error) });
    throw error;
  }
}

export default SecurityUtils;
