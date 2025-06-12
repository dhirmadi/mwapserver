import { PermissionError } from '../utils/errors.js';
import { getUserFromToken } from '../utils/auth.js';
import { getDB } from '../config/db.js';
import { ObjectId } from 'mongodb';
export function requireTenantRole(role) {
    return async (req, res, next) => {
        try {
            const user = getUserFromToken(req);
            // Role check logic will be implemented in Phase 2
            next();
        }
        catch (error) {
            next(error);
        }
    };
}
export function requireProjectRole(role) {
    return async (req, res, next) => {
        try {
            const user = getUserFromToken(req);
            const projectId = req.params.id;
            if (!projectId) {
                throw new PermissionError('Project ID is required');
            }
            // Check if user is a superadmin (they bypass project role checks)
            const superadmin = await getDB().collection('superadmins').findOne({ userId: user.sub });
            if (superadmin) {
                return next();
            }
            // Find the project and check if user has the required role
            const project = await getDB().collection('projects').findOne({
                _id: new ObjectId(projectId),
                'members.userId': user.sub
            });
            if (!project) {
                throw new PermissionError('Project not found or user not a member');
            }
            const member = project.members.find((m) => m.userId === user.sub);
            if (!member) {
                throw new PermissionError('User is not a member of this project');
            }
            // Check if user has the required role or higher
            const roles = ['MEMBER', 'DEPUTY', 'OWNER'];
            const requiredRoleIndex = roles.indexOf(role);
            const userRoleIndex = roles.indexOf(member.role);
            if (userRoleIndex < requiredRoleIndex) {
                throw new PermissionError(`Requires ${role} role or higher`);
            }
            next();
        }
        catch (error) {
            next(error);
        }
    };
}
export function requireSuperAdminRole() {
    return async (req, res, next) => {
        try {
            const user = getUserFromToken(req);
            console.log('[MWAP] Checking superadmin role for user:', user);
            const superadmin = await getDB().collection('superadmins').findOne({ userId: user.sub });
            if (!superadmin) {
                console.log('[MWAP] User is not a superadmin:', user.sub);
                throw new PermissionError('Requires superadmin role');
            }
            console.log('[MWAP] User is a superadmin:', user.sub);
            next();
        }
        catch (error) {
            console.log('[MWAP] Superadmin check failed:', error instanceof Error ? error.message : 'Unknown error');
            next(error);
        }
    };
}
