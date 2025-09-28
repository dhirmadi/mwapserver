---
name: auth0
type: knowledge
version: 1.0.0
agent: CodeActAgent
triggers:
  - auth0
  - oidc
---

Use Auth0 Management API via client_credentials.

Env required: `AUTH0_CLIENT_ID`, `AUTH0_CLIENT_SECRET`.

Steps:
1) Obtain management token with curl (client_credentials)
2) Use token for subsequent Management API calls
3) Never log or persist secrets

Reference: see detailed instructions in `.openhands/microagents/auth0.md`.


