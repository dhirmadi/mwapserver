id: prreviewer
description: Review GitHub PRs for MWAP and enforce security + style standards
tasks:
  - fetch PR diff
  - load coding_standards.md
  - validate access control usage
  - detect untyped logic
  - score quality
  - comment issues or approve
