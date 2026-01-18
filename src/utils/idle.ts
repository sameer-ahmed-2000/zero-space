// Utility function to safely use requestIdleCallback with fallback
export function runWhenIdle(callback: () => void, timeout = 2000) {
    if (typeof requestIdleCallback !== 'undefined') {
        requestIdleCallback(callback, { timeout })
    } else {
        setTimeout(callback, 0)
    }
}
