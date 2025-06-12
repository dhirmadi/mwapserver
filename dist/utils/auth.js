import { AuthError } from './errors.js';
export function getUserFromToken(req) {
    const user = req.auth;
    if (!user) {
        throw new AuthError('No token provided');
    }
    if (!user.sub) {
        throw new AuthError('Invalid token - missing sub claim');
    }
    return user;
}
