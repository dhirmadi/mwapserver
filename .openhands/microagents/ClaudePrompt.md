# ClaudePrompt.md — MWAP Prompt Template

This file provides a reusable Claude instruction template to be used in conjunction with `repo.md`. Use this to guide Claude when creating or modifying features in the MWAP project.

---

## 🔁 General Instructions (Append to Every Prompt)

Claude, please follow these instructions carefully for all actions on the MWAP repository:

- 🧠 Read and respect `repo.md` for context, structure, and standards
- 🔁 Reuse existing components, hooks, types, middleware, and routes
- ✅ Keep implementations type-safe and minimal
- 📚 Follow MWAP coding standards (e.g., `AppError`, `logger`, `SuccessResponse`)
- 🔐 Do not skip authentication or authorization middleware
- 🚫 Do not create duplicate functions, services, types, or schemas
- 🧪 Validate all inputs using Zod
- 🧱 Maintain clean modular structure per `features/<module>/`

---

## 🧩 Example Feature Prompt Template

> Title: Add project archive button to tenant project table  
> Labels: `phase 7`, `project management`  
> Target files: `client/src/components/tenant/TenantProjects.tsx`, `server/src/features/projects/routes.ts`

**Prompt:**

You are working in the MWAP fullstack TypeScript application. Your task is to add an "Archive" action button to each project listed in the tenant project table.

- Use the existing `useTenantProjects()` hook to refresh the list
- Call `PATCH /api/v1/projects/:id` with `{ archived: true }` when the button is clicked
- Ensure the user has the correct role (`ProjectRole.ADMIN`)
- Use Mantine `ActionIcon` for the UI button
- Log errors and show feedback using `ErrorDisplay` and toast notifications
- Reuse the existing API client utility (`useApi()`)
- Add any required types or updates to `/types/project/` but reuse where possible

Make sure to follow all conventions in `repo.md`.

---

Use this format to guide Claude in scoped feature prompts.