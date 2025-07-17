# Documentation Quick Reference Guide

Quick reference for common documentation tasks and navigation in the MWAP project.

## 🚀 Quick Start

### Essential Commands
```bash
# Validate all documentation
npm run docs:check

# Validate links only
npm run docs:validate

# Test navigation flows
npm run docs:navigation
```

### Main Entry Points
- **📚 Documentation Hub**: [docs/README.md](./README.md)
- **🏗️ Architecture**: [v3-architecture-reference.md](./v3-architecture-reference.md)
- **🔌 API Reference**: [v3-api.md](./v3-api.md)
- **⚡ Feature Patterns**: [features/feature-pattern.md](./features/feature-pattern.md)

## 📁 Directory Structure

```
docs/
├── README.md                    # 📚 Main documentation index
├── v3-architecture-reference.md # 🏗️ System architecture
├── v3-api.md                   # 🔌 API documentation
├── v3-domainmap.md             # 🗺️ Domain model
├── features/                   # ⚡ Feature documentation
├── integrations/               # 🔗 OAuth & external services
├── testing/                    # 🧪 Testing guides
├── frontend/                   # 🎨 Frontend development
├── architecture/               # 🏛️ Architecture utilities
├── environment/                # ⚙️ Configuration
└── archive/                    # 📦 Historical content
```

## 🔍 Common Tasks

### Finding Information
| Need | Go To |
|------|-------|
| OAuth setup | [integrations/oauth-guide.md](./integrations/oauth-guide.md) |
| Feature implementation | [features/feature-pattern.md](./features/feature-pattern.md) |
| API endpoints | [v3-api.md](./v3-api.md) |
| Testing setup | [testing/README.md](./testing/README.md) |
| Frontend development | [frontend/README.md](./frontend/README.md) |
| Environment variables | [environment/environment-variables.md](./environment/environment-variables.md) |
| Project status | [STATUS.md](./STATUS.md) |

### Contributing Documentation
1. **Check existing structure** for appropriate location
2. **Run validation** before committing: `npm run docs:check`
3. **Follow standards** in [documentation-guide.md](./documentation-guide.md)
4. **Use PR template** with documentation checklist
5. **Cross-reference** related documentation

### Navigation Patterns
```
Main Index → Category → Specific Guide
docs/README.md → features/ → feature-pattern.md

Architecture Deep Dive:
docs/README.md → v3-architecture-reference.md → domain specifics

API Reference:
docs/README.md → v3-api.md → endpoint details
```

## 🛠️ Validation Tools

### Link Checking
```bash
# Full validation suite
npm run docs:check

# Individual validations
npm run docs:validate    # Links only
npm run docs:navigation  # Navigation flows
```

### Common Issues
- **Broken Links**: Use relative paths for internal docs
- **Missing Files**: Check file exists before linking
- **Structure**: Ensure required directories exist

### Configuration
- **Settings**: `.docs-config.json`
- **CI/CD**: `.github/workflows/documentation.yml`
- **Scripts**: `scripts/validate-docs-links.js`

## 📝 Writing Standards

### Formatting
- **Headers**: Use `#` for main title, `##` for sections
- **Links**: Use `[Text](./path.md)` format for internal docs
- **Code**: Use fenced code blocks with language
- **Lists**: Use `-` for bullets, `1.` for numbered

### Content Guidelines
- **Factual**: All content must be verifiable
- **Clear**: Use simple, direct language
- **Examples**: Include practical code examples
- **Cross-refs**: Link to related documentation

## 🔗 GitHub Integration

### Issue Templates
- **Bug Reports**: [bug_report.md](../.github/ISSUE_TEMPLATE/bug_report.md)
- **Features**: [feature_request.md](../.github/ISSUE_TEMPLATE/feature_request.md)
- **Documentation**: [documentation.md](../.github/ISSUE_TEMPLATE/documentation.md)

### PR Template
- **Checklist**: [pull_request_template.md](../.github/pull_request_template.md)
- **Documentation Impact**: Required section
- **Architecture Compliance**: Verification required

## 🎯 Team Resources

### Onboarding
- **New Developers**: [DEVELOPER_ONBOARDING.md](./DEVELOPER_ONBOARDING.md)
- **Team Training**: [TEAM_TRAINING_GUIDE.md](./TEAM_TRAINING_GUIDE.md)
- **Documentation Guide**: [documentation-guide.md](./documentation-guide.md)

### Historical Context
- **Archive**: [archive/README.md](./archive/README.md)
- **Changes**: [DOCUMENTATION_HARMONIZATION_SUMMARY.md](./DOCUMENTATION_HARMONIZATION_SUMMARY.md)
- **Verification**: [HARMONIZATION_VERIFICATION.md](./HARMONIZATION_VERIFICATION.md)

## ⚡ Quick Actions

### Daily Development
```bash
# Before starting work
npm run docs:check

# After making changes
git add docs/ && npm run docs:validate

# Before PR
npm run docs:check && git commit -m "docs: update..."
```

### Emergency Fixes
```bash
# Find broken links
npm run docs:validate | grep "❌"

# Check specific file
node scripts/validate-docs-links.js docs/specific-file.md

# Validate structure only
npm run docs:navigation
```

### Getting Help
- **Documentation Issues**: Use GitHub issue templates
- **Questions**: Check [DEVELOPER_ONBOARDING.md](./DEVELOPER_ONBOARDING.md)
- **Training**: Review [TEAM_TRAINING_GUIDE.md](./TEAM_TRAINING_GUIDE.md)

---

*Keep this reference handy for efficient documentation navigation and contribution!*