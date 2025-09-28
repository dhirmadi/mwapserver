---
name: schema_generator
type: task
version: 1.0.0
agent: CodeActAgent
triggers:
  - generate_schema
---

Input: { entityName: string, fields: object }
Output: TypeScript Mongoose schema (string)

Follow `.openhands/microagents/schema.generator/*` for prompt and JSON schema. Enforce strict TS, validation rules, and Mongoose best practices.


