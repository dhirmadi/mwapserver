# Task Instructions Template

## 🔁 General Instructions

Claude, please follow these instructions carefully for all actions on the MWAP repository:

- 🧠 Read and respect `repo.md` for context, structure, and standards
- 🔁 Reuse existing components, hooks, types, middleware, and routes
- ✅ Keep implementations type-safe and minimal
- 📚 Follow MWAP coding standards (e.g., `AppError`, `logger`, `SuccessResponse`)
- 🔐 Do not skip authentication or authorization middleware
- 🚫 Do not create duplicate functions, services, types, or schemas
- 🧪 Validate all inputs using Zod
- 🧱 Maintain clean modular structure per `features/<module>/`

## 🧩 Task Format

> Title: [Task Title]  
> Labels: [relevant labels]  
> Target files: [files to be modified]

**Task Description:**

[Detailed description of the task]

**Requirements:**
- [Specific requirement 1]
- [Specific requirement 2]
- [etc.]

**Technical Considerations:**
- Follow TypeScript strict mode
- Reuse existing types from `/core/types` or `/features/<module>/types`
- Use appropriate error handling with `AppError`
- Implement proper logging with `logger`
- Structure responses using `ApiResponse<T>` types
- Follow MWAP security requirements for authentication/authorization

**Integration Points:**
- [List any integration points with existing features]
- [Specify any hooks, services, or utilities to be used]

Make sure to follow all conventions in `repo.md`.

---

Note: This template should be customized for each specific task while maintaining adherence to MWAP standards and conventions.