# Known Limitations

## Non-Passive Event Listener Violations

### Issue
The browser console shows violations about non-passive event listeners for `touchstart` and `touchmove` events:
```
[Violation] Added non-passive event listener to a scroll-blocking 'touchstart' event
[Violation] Added non-passive event listener to a scroll-blocking 'touchmove' event
```

### Root Cause
These violations come from the `react-force-graph-2d` and `react-force-graph-3d` libraries (version 1.29.0). The libraries use touch events for mobile pan/zoom interactions but don't mark them as passive, which can potentially block scrolling.

### Impact
- **Severity**: Low - Performance warning, not an error
- **Functionality**: Does not affect functionality
- **User Experience**: May cause slight scrolling delays on mobile devices during graph interactions

### Resolution Options

1. **Suppress Warnings (Current Implementation)**
   - A console violation suppression utility has been added (`src/utils/suppressConsoleViolations.js`)
   - Suppresses these specific warnings in development mode
   - Does not affect production builds

2. **Wait for Library Update**
   - Monitor `react-force-graph` library updates
   - Check if newer versions fix this issue
   - Current version: 1.29.0

3. **Fork and Patch Library (Not Recommended)**
   - Would require maintaining a custom fork
   - Not recommended unless absolutely necessary

### Technical Details
- **Library**: `react-force-graph-2d` and `react-force-graph-3d` v1.29.0
- **Events**: `touchstart`, `touchmove`
- **Browser**: Chrome/Edge violation warnings
- **Fix Required**: Library maintainers need to mark touch event listeners as passive where possible

### References
- [Chrome Status - Passive Event Listeners](https://www.chromestatus.com/feature/5745543795965952)
- [MDN - Passive Event Listeners](https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener#passive)

