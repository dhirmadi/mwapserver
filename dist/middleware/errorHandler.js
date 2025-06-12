import { logError } from '../utils/logger.js';
import { errorResponse } from '../utils/response.js';
export function errorHandler(error, req, res, next) {
    console.error("🔥 MWAP ERROR TRACE");
    console.error("🔥 Stack:", error.stack);
    console.error("🔥 Message:", error.message);
    console.error("🔥 Request Body:", req.body);
    logError('Request error', error);
    errorResponse(res, error);
}
