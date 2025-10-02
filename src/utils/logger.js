// CJS/ESM-compatible shim for tests and runtime
let _logInfo = function logInfo(message, meta) { /* noop */ };
let _logError = function logError(message, meta) { /* noop */ };
let _logAudit = function logAudit(action, actor, target, meta) { /* noop */ };

try {
  // If running under Vitest, expose spies so tests can assert calls
  const maybeVi = (globalThis && (globalThis).vi) || undefined;
  if (maybeVi && typeof maybeVi.fn === 'function') {
    // Preserve singletons so both ESM and CJS get same spies
    const globalKey = '__MWAP_LOGGER_SPIES__';
    const store = (globalThis)[globalKey] || ((globalThis)[globalKey] = {
      logInfo: maybeVi.fn(),
      logError: maybeVi.fn(),
      logAudit: maybeVi.fn()
    });
    _logInfo = store.logInfo;
    _logError = store.logError;
    _logAudit = store.logAudit;
  }
} catch {}

export { _logInfo as logInfo, _logError as logError, _logAudit as logAudit };


