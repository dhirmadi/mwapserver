import { ApiError } from './errors.js';
export function jsonResponse(res, status, data) {
    return res.status(status).json({
        success: true,
        data
    });
}
export function errorResponse(res, error) {
    const status = error instanceof ApiError ? error.status : 500;
    const code = error instanceof ApiError ? error.code : 'server/internal-error';
    const details = error instanceof ApiError ? error.details : undefined;
    res.status(status).json({
        success: false,
        error: {
            code,
            message: error.message,
            ...(details && { details })
        }
    });
}
export function wrapAsyncHandler(fn) {
    return async function (req, res, next) {
        try {
            await fn(req, res, next);
        }
        catch (error) {
            next(error);
        }
    };
}
