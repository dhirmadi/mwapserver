# MWAP Repository Microagent Guide 

[Solution Design](../../docs/v3-architecture-reference.md)

## 🛠 Project Overview
MWAP (Modular Web Application Platform) is a fullstack, secure, scalable SaaS framework built with:
- **Backend**: Node.js (ESM) + Express + MongoDB Atlas
- **Authentication**: Auth0 (PKCE, MFA, approval flow)
- **Database**: MOngoDB Atlas

## ✍ Prompting Best Practices
- **Minimal inputs** only, no verbosity
- Use structure:
  ```
  Task: <action>
  Context: <high-level background>
  Requirements:
    - Bullet
    - Specific
  ```
- **One task per prompt**: atomic focus
- **Use code comments** to guide outputs
- **Ask for code-only responses**, no explanations

## 🏩 Architecture Principles
- **API Gateway** with Express.js and NGINX
- **JWT authentication** with RS256 + JWKS endpoint validation
- **Strict Zero Trust model** for APIs and storage
- **Progressive enhancement**: Cloud providers, project types, OAuth handled dynamically
- **Security-first**: Helmet headers, CORS, OWASP ZAP tested

## 🔥 Coding Standards
- **TypeScript-first**: `strict: true`, no implicit `any`
- **Native ESM** modules only
- **One logical feature per file/folder** (auth, tenant, projects)
- **Centralized error handling** via `AppError`
- **No Duplication** by applying DRY principle
- **No secrets in Code** do not comit any secrets to GitHub


## 🛡️ Security and Compliance
- **GDPR-first** data practices
- **MongoDB Field-Level Encryption**
- **Rate limiting** on all APIs
- **Auth0 MFA and OAuth callback protection**

## 🧹 Codebase Organization
- **Server (Express)**: Routes, Controllers, Services
- **Docs**: API specifications, architecture diagrams
- **Scripts**: Heroku build/deploy automation

File Structure:
```
src/   → Server source code
docs/     → API + Architecture
scripts/  → CI/CD build tools
```

## 🔎 Repository Behavior
- Follow **feature folder structure** rigidly
- Clean imports (no deep relative hell like `../../../`)
- Backend uses **typed Express routes** and **rate-limited APIs**

## 🔧 API Schema Practices
- **Strict request validation** at controller entry
- **Consistent success/error response format**
- OpenAPI schemas kept updated

## 🧐 Key Strategic Lessons
- Start with minimal, type-safe MVP
- Avoid complexity until needed (Vault, Mesh after MVP)
- Prompt OpenHands agents with focused tasks to maximize output quality

---

# #LetsBuildSecurely 🚀

