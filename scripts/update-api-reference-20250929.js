// Updates docs/04-Backend/api-reference.md with three deltas:
// 1) Add responses for GET /tenants/me
// 2) Add GET /projects/:id/members/me section
// 3) Change OAuth refresh request body to optional

import fs from 'fs';
import path from 'path';

const docPath = path.resolve(process.cwd(), 'docs/04-Backend/api-reference.md');

function updateFile() {
  let s = fs.readFileSync(docPath, 'utf8');

  // 1) Tenants: add responses for /tenants/me if missing
  try {
    const tenantsHeaderIdx = s.indexOf('### Get Current User\'s Tenant');
    if (tenantsHeaderIdx !== -1) {
      const endpointBlock = '**Endpoint:** `GET /api/v1/tenants/me`  \n**Authentication:** Required  \n**Authorization:** Any authenticated user';
      const hasEndpointBlock = s.indexOf(endpointBlock, tenantsHeaderIdx) !== -1;
      const hasTenantNotFound = s.indexOf("tenant/not-found", tenantsHeaderIdx) !== -1;
      if (hasEndpointBlock && !hasTenantNotFound) {
        s = s.replace(
          endpointBlock,
          endpointBlock +
            '\n\n**Responses:**\n- 200: Returns the tenant owned by the authenticated user\n- 404: `{ success: false, error: { code: \'tenant/not-found\', message: \'Tenant not found\' } }`'
        );
      }
    }
  } catch {}

  // 2) Project Members: add GET /projects/:id/members/me if missing
  try {
    if (s.indexOf('GET /api/v1/projects/:id/members/me') === -1) {
      const membersHeaderIdx = s.indexOf('## 👥 Project Members API');
      if (membersHeaderIdx !== -1) {
        const response204Idx = s.indexOf('**Response:** `204 No Content`', membersHeaderIdx);
        if (response204Idx !== -1) {
          const insertPos = response204Idx + '**Response:** `204 No Content`'.length;
          const section =
            '\n\n### Get My Project Membership\n' +
            "Get the current user's membership in a specific project.\n\n" +
            '**Endpoint:** `GET /api/v1/projects/:id/members/me`  ' +
            '\n**Authentication:** Required  ' +
            '\n**Authorization:** Any authenticated user\n\n' +
            'If the user is not a member of the project, this endpoint returns 404.\n\n' +
            '**Example Success Response:**\n\n' +
            '```json\n' +
            '{\n' +
            '  "success": true,\n' +
            '  "data": {\n' +
            '    "projectId": "641f4411f24b4fcac1b1501c",\n' +
            '    "userId": "auth0|123",\n' +
            '    "role": "MEMBER"\n' +
            '  }\n' +
            '}\n' +
            '```\n\n' +
            '**Example Not Found Response:**\n\n' +
            '```json\n' +
            '{\n' +
            '  "success": false,\n' +
            '  "error": {\n' +
            '    "code": "project/member-not-found",\n' +
            '    "message": "Member not found in project"\n' +
            '  }\n' +
            '}\n' +
            '```';
          s = s.slice(0, insertPos) + section + s.slice(insertPos);
        }
      }
    }
  } catch {}

  // 3) OAuth refresh: make request body optional with schema
  try {
    const refreshHeaderIdx = s.indexOf('### Refresh Integration Tokens');
    if (refreshHeaderIdx !== -1) {
      const reqBodyIdx = s.indexOf('**Request Body:** None', refreshHeaderIdx);
      if (reqBodyIdx !== -1) {
        s = s.replace(
          '**Request Body:** None',
          '**Request Body (optional):**\n```typescript\n{\n  force?: boolean; // If true, bypass cached validity and force refresh\n}\n```'
        );
      }
    }
  } catch {}

  fs.writeFileSync(docPath, s);
  console.log('api-reference.md updated');
}

updateFile();



