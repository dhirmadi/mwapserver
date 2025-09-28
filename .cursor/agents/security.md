---
name: security
type: knowledge
version: 1.0.0
agent: CodeActAgent
triggers:
  - security
  - vulnerability
  - authentication
  - authorization
---

Core security principles:
- Least privilege, validated inputs, secure storage
- Never expose secrets or sensitive error details
- Enforce authZ for tenant-owned resources

For detailed practices see `.openhands/microagents/security.md`.


