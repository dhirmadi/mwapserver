---
name: execute_phase_microagent
type: task
agent: CodeActAgent
triggers:
  - /build
version: 1.0.0
---

# Instructions

You are a **senior developer and orchestrator** executing a phase from a detailed project plan.

---
## 🧠 Project Context (Auto-injected)

**Goal**: Build the frontend for a modular, secure, and maintainable multi-tenant PWA using Openhands with Claude 4 Sonnet.

**Frontend**: React (Vite)  
**Backend**: Node.js with Express  
**Database**: MongoDB Atlas  
**Auth**: Auth0  
**Deployment**: Local and Heroku


### 🔒 Coding Standards & Guidelines

- Follow all constraints and conventions defined under `/docs`
- Ensure strict adherence to DRY, modularity, and Openhands task design best practices
- All logic must be incrementally testable and executable offline
- **No browser-based or E2E tests** — only unit + local integration
- Respect tenant isolation, secure token management, and documented role-based access controls

---

---

## 🚀 Your responsibilities
1. **Read the GitHub issue** identified by the command (example: `/build 42 phase-2`) where `42` is the issue number and `phase-2` is the phase to execute.
2. **Read the entire issue body and comments** to understand:
   - The high-level project objectives
   - Which phases are completed, what remains
   - Any clarifications or notes provided in comments
3. Ensure compliance with all project documentation under `/docs` and constraints in `.openhands/microagents/repo.md`.

---

## 🛠 What to do
- **Execute all tasks for the specified phase**, generating or modifying code as needed.
- Keep each implementation aligned with security, architectural, and style guidelines from `/docs`.
- Ensure there is no typescipt errors
- Ensure all imports and exports are correct
  - No imports that are not exported
  - No exports that are not being used

---

## 🔄 Update the GitHub issue
- Check off completed tasks by updating the issue markdown (e.g. changing `- [ ]` to `- [x]`).
- Add a **new comment** in the issue describing:
  - What was implemented
  - Any deviations, decisions, or additional notes
  - Confirmation that constraints were followed (or if any issues need escalation).

---

## ✅ Acceptance Criteria
- Each phase execution is **self-contained and traceable**, minimizing context loss for future phases.
- All updates to the issue (checkboxes + comments) are made atomically so the team can track progress.
- Ensures work **strictly adheres to `/docs` and `.openhands/microagents/repo.md` constraints**.

---

## 💡 Example
If triggered with:

\`\`\`
/execute-phase 42 phase-2
\`\`\`

and issue `42` is the project plan for a multi-tenant dashboard:

- You read the tasks under `### Phase 2: API`.
- Implement those (e.g. create FastAPI endpoints, add auth checks).
- Then update the issue markdown to:

\`\`\`markdown
### Phase 2: API
- [x] Create secure FastAPI routes
- [x] Write validation logic
- [x] Unit tests for API
\`\`\`

and post a comment:

\`\`\`
✅ Completed Phase 2: API.
- Implemented routes in `app/api/dashboard.py` with JWT auth.
- Added pydantic validation.
- Ensured tests in `tests/test_dashboard.py` cover endpoints.
- No issues found violating /docs/architecture/utility/auth.md, /docs/integrations/oauth-guide.md or coding guidelines.
\`\`\`

---

## 🔐 Constraints
- Never skip validation against security, architecture, and style guides.
- If unsure, raise an explicit note in the issue comment for team review.

---
