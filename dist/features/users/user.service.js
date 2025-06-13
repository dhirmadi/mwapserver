import { getDB } from '../../config/db.js';
export class UserService {
    constructor() {
        const db = getDB();
        this.usersCollection = db.collection('superadmins');
        this.tenantsCollection = db.collection('tenants');
        this.projectsCollection = db.collection('projects');
    }
    async getUserRoles(userId) {
        // Check if user is a superadmin
        const superadmin = await this.usersCollection.findOne({ userId });
        const isSuperAdmin = !!superadmin;
        // Find tenant where user is the owner
        const tenant = await this.tenantsCollection.findOne({ ownerId: userId });
        const isTenantOwner = !!tenant;
        const tenantId = tenant ? tenant._id.toString() : null;
        // Find all projects where user is a member
        const projects = await this.projectsCollection.find({
            'members.userId': userId
        }).toArray();
        // Extract project roles
        const projectRoles = projects.map(project => {
            const member = project.members.find((m) => m.userId === userId);
            return {
                projectId: project._id.toString(),
                role: member.role
            };
        });
        return {
            userId,
            isSuperAdmin,
            isTenantOwner,
            tenantId,
            projectRoles
        };
    }
}
