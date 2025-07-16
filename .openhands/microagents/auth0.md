---
name: auth0
type: knowledge
version: 1.0.0
agent: CodeActAgent
triggers:
- auth0
- oidc
---

You have access to environment variables `AUTH0_CLIENT_ID` and `AUTH0_CLIENT_SECRET`
to authenticate with the Auth0 Management API. 

<IMPORTANT>
- Always use Auth0 Management API (https://auth0.com/docs/api/management/v2) for tasks.
- Use `curl` with `client_credentials` flow to get a Management API token.
- Store the management token in memory only (never persist).

Example to get a management token:

```bash
curl --request POST \
  --url https://katyev.eu.auth0.com/oauth/token \
  --header 'content-type: application/json' \
  --data '{
    "client_id":"'"$AUTH0_CLIENT_ID"'",
    "client_secret":"'"$AUTH0_CLIENT_SECRET"'",
    "audience":"https://api.mwap.local",
    "grant_type":"client_credentials"
  }'
```


- Use this token for all subsequent API calls, e.g. to list users:

```bash
curl --request GET   --url https://katyev.eu.auth0.com//api/v2/users   --header "authorization: Bearer $MANAGEMENT_TOKEN"
```
</IMPORTANT>

**Auth0 Management Best Practices**:
- Only request scopes you need (e.g. `read:users`, `update:users`).
- Never expose `client_secret` in logs or responses.
- Rotate credentials periodically as per platform policy.

Tasks you can assist with:
- Creating, listing, updating users in Auth0
- Managing roles and permissions
- Inspecting Auth0 tenant settings for debugging
- Generating new application credentials for tests
- Providing short test scripts for `curl` interactions

If any Auth0 API returns an error (401, 403), refresh the management token using the credentials.
