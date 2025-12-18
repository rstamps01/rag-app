/**
 * Console Violation Suppression Utility
 * 
 * Suppresses known non-passive event listener violations from third-party libraries.
 * These violations come from react-force-graph library and don't affect functionality.
 * 
 * Note: These are performance warnings, not errors. The library uses touch events
 * for mobile pan/zoom interactions but doesn't mark them as passive, which can
 * potentially block scrolling. This is a known limitation of the library.
 */

// Store original console methods
const originalWarn = console.warn;
const originalError = console.error;

// Track if we've already patched
let isPatched = false;

/**
 * Suppress non-passive event listener violations from react-force-graph
 * These are performance warnings that don't affect functionality
 */
export const suppressPassiveListenerViolations = () => {
  if (isPatched) return;
  isPatched = true;

  // Only suppress in development mode
  if (process.env.NODE_ENV === 'development') {
    console.warn = (...args) => {
      const message = args[0];
      
      // Suppress non-passive event listener violations from react-force-graph
      if (
        typeof message === 'string' &&
        (message.includes('[Violation]') || message.includes('Violation')) &&
        (message.includes('non-passive event listener') ||
         message.includes('touchstart') ||
         message.includes('touchmove')) &&
        (message.includes('scroll-blocking') || message.includes('passive'))
      ) {
        // Suppress this specific warning - it's from react-force-graph library
        return;
      }
      
      // Allow all other warnings
      originalWarn.apply(console, args);
    };
  }
};

/**
 * Restore original console methods
 */
export const restoreConsoleMethods = () => {
  if (!isPatched) return;
  isPatched = false;
  
  console.warn = originalWarn;
  console.error = originalError;
};

// Auto-suppress on import in development
if (process.env.NODE_ENV === 'development') {
  suppressPassiveListenerViolations();
}

