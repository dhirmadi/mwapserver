export function logInfo(message, meta) {
    console.log(JSON.stringify({
        level: 'info',
        message,
        timestamp: new Date().toISOString(),
        ...(meta || {})
    }));
}
export function logError(message, error) {
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
export function logAudit(action, actor, target, meta) {
    console.log(JSON.stringify({
        level: 'audit',
        action,
        actor,
        target,
        timestamp: new Date().toISOString(),
        ...(meta || {})
    }));
}
