---
name: openhands_migrated_agents
type: knowledge
version: 1.0.0
agent: CodeActAgent
triggers:
  - openhands
  - microagents
---

# Migrated OpenHands Agents (Index)

The following OpenHands microagents are available and mirrored for Cursor usage. Refer to `.openhands/microagents/*` for full source; this file serves as an index and light guidance:

- add_agent: Creates new microagents/templates
- agent_memory: Guidance on repo memory and what to store
- auth0: Auth0 Management API usage via client_credentials
- documentation: Factual docs with citations
- codereview: Structured code review rubric
- prreviewer: PR reviewer tasks and quality checks
- security: Core security best practices
- feature_build / feature_design / feature_plan / feature_validate: execution lifecycle
- github: Using GITHUB_TOKEN + API; create_pr tool usage
- schema.generator: prompt + JSON schema for generating Mongoose schemas

All detailed prompts remain unchanged in `.openhands/` and should be respected when acting in Cursor.


