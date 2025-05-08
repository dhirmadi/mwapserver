export function logInfo(message: string, meta?: Record<string, unknown>): void {
  console.log(JSON.stringify({
    level: 'info',
    message,
    timestamp: new Date().toISOString(),
    ...(meta || {})
  }));
}

export function logError(message: string, error?: unknown): void {
  console.error(JSON.stringify({
    level: 'error',
    message,
    timestamp: new Date().toISOString(),
    error: error instanceof Error ? {
      name: error.name,
      message: error.message,
      stack: error.stack
    } : error
  }));
}

export function logAudit(action: string, actor: string, target: string, meta?: Record<string, unknown>): void {
  console.log(JSON.stringify({
    level: 'audit',
    action,
    actor,
    target,
    timestamp: new Date().toISOString(),
    ...(meta || {})
  }));
}