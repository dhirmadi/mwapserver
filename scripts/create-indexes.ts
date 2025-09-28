/**
 * Create essential MongoDB indexes for performance and RBAC.
 * Safe to run multiple times.
 */
import { getDB, connectDB } from '../src/config/db.js';

async function main(): Promise<void> {
  await connectDB();
  const db = getDB();

  const tasks: Array<Promise<any>> = [];

  // Tenants: owner lookup
  tasks.push(db.collection('tenants').createIndex({ ownerId: 1 }, { name: 'tenants_ownerId_idx', unique: true }).catch(() => {}));

  // Projects: tenant and members lookups
  tasks.push(db.collection('projects').createIndex({ tenantId: 1 }, { name: 'projects_tenantId_idx' }).catch(() => {}));
  tasks.push(db.collection('projects').createIndex({ 'members.userId': 1 }, { name: 'projects_members_userId_idx' }).catch(() => {}));

  // Superadmins: presence check
  tasks.push(db.collection('superadmins').createIndex({ userId: 1 }, { name: 'superadmins_userId_idx', unique: true }).catch(() => {}));

  await Promise.all(tasks);
  // eslint-disable-next-line no-console
  console.log('✅ Index creation completed');
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('❌ Index creation failed', err);
  process.exit(1);
});


