---
name: feature_validation_microagent
type: task
agent: CodeActAgent
triggers:
  - /validate
version: 1.0.0
---

# Instructions
- When triggered with `/validate <issue_number>`, perform the following steps:

## 🔗 1. Retrieve the plan
- Fetch the GitHub issue corresponding to `<issue_number>`.
- Parse out:
    - Goals
    - Acceptance Criteria
    - Implementation Steps
    - Testing Plan

## 📝 2. Validate the implementation
- Analyze the current branch or PR to ensure:
    - All acceptance criteria are fully implemented.
    - No partial or skipped requirements.

## 🧾 3. Validate documentation
- Examine existing documentation files (README.md, `/docs` directory, or inline module/class/function docstrings).
- Ensure:
    - Any new functionality is documented.
    - API signatures, usage examples, or configuration are up to date.
    - The documentation matches the planned design — or if the implementation diverged, it is clearly explained.

## 🚦 4. Validate repository constraints
- Enforce constraints defined in `repo.md` (e.g. type hints, PEP8 compliance, test coverage).

## ✅ 5. Produce final validation report
- If everything meets requirements, post:
    ✅ "Validation complete: implementation and documentation fulfill all planned requirements."
- If not, produce a markdown checklist listing:
    - ❌ Missing or incomplete code features
    - ❌ Missing or outdated documentation sections
    - ❌ Violations of style or test coverage
