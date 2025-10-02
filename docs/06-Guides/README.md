# Guides Documentation

Comprehensive implementation guides for MWAP platform features and best practices.

---

## 🚀 Quick Navigation

### Building Cloud Provider Integration?
→ **[Complete Frontend Guide](./oauth-frontend-complete-guide.md)** - Full implementation with TypeScript, hooks, and components

### Understanding OAuth Security?
→ **[OAuth Integration Guide](./oauth-integration-guide.md)** - OAuth mechanics, postMessage protocol, and security model

### Need General Security Guidance?
→ **[Security Guide](./security-guide.md)** - Authentication, authorization, and security best practices

---

## 📚 Available Guides

### OAuth & Cloud Provider Integration

| Guide | Purpose | Audience |
|-------|---------|----------|
| **[Complete Frontend Guide](./oauth-frontend-complete-guide.md)** | Build complete cloud provider integration feature | Frontend developers |
| **[OAuth Integration Guide](./oauth-integration-guide.md)** | Understand OAuth popup mechanics and security | All developers |
| **[OAuth Security Guide](./oauth-security.md)** | Threat models, attack vectors, and security strategy | Security-focused |
| **[PKCE Implementation Guide](./pkce-implementation-guide.md)** | Backend PKCE implementation details | Backend developers |

### Security & Architecture

| Guide | Purpose | Audience |
|-------|---------|----------|
| **[Security Guide](./security-guide.md)** | Comprehensive security practices | All developers |
| **[Public Route Security Model](./public-route-security-model.md)** | Security for public endpoints | Backend developers |

### Development & Operations

| Guide | Purpose | Audience |
|-------|---------|----------|
| **[Development Guide](./development-guide.md)** | Development workflows and practices | All developers |
| **[Testing Guide](./testing-guide.md)** | Testing strategies and examples | All developers |
| **[Performance Guide](./performance-guide.md)** | Performance optimization | All developers |
| **[Deployment Guide](./deployment-guide.md)** | Deployment procedures | DevOps |

---

## 🎯 Quick Start by Use Case

### "I need to build a cloud provider connection UI"
1. Read: [Complete Frontend Guide](./oauth-frontend-complete-guide.md)
2. Copy: TypeScript interfaces, API client, React hooks
3. Implement: CloudProvidersList component
4. Test and deploy

### "OAuth popup is not working"
1. Review: [OAuth Integration Guide](./oauth-integration-guide.md) - Troubleshooting section
2. Check: [Archived Troubleshooting Guide](./archive/oauth-troubleshooting-guide.md) - Comprehensive reference
3. Verify: Redirect URIs and popup settings

### "I need to implement PKCE for my SPA"
1. Backend: [PKCE Implementation Guide](./pkce-implementation-guide.md)
2. Frontend: [Complete Frontend Guide](./oauth-frontend-complete-guide.md) - PKCE section
3. Security: [OAuth Security Guide](./oauth-security.md)

### "I need to secure my endpoints"
1. Read: [Security Guide](./security-guide.md)
2. Review: [Public Route Security Model](./public-route-security-model.md)
3. Implement: Security middleware and validation

### "I need to set up testing"
1. Read: [Testing Guide](./testing-guide.md)
2. Review: [Development Guide](./development-guide.md)
3. Implement: Unit and integration tests

---

## 📖 Guide Relationships

```
Complete Frontend Guide
├── Covers: Full feature implementation
├── Includes: TypeScript, API client, hooks, UI components
└── References: OAuth Integration Guide for OAuth details

OAuth Integration Guide  
├── Covers: OAuth mechanics, security, postMessage
├── Deep dives: State validation, backend architecture
└── References: Security guides for best practices

Security Guide
├── Covers: Authentication, authorization, best practices
├── Includes: Auth0, JWT, RBAC, middleware
└── References: OAuth guides for OAuth-specific security

Testing Guide
├── Covers: Unit, integration, performance testing
├── Includes: Vitest, test patterns, mocking
└── References: Development guide for workflows
```

---

## 🔧 Guide Types

### Implementation Guides
**Purpose:** Step-by-step feature implementation  
**Examples:** Complete Frontend Guide, PKCE guides  
**When to use:** Building new features

### Reference Guides
**Purpose:** Deep understanding and troubleshooting  
**Examples:** OAuth Integration Guide, Security Guide  
**When to use:** Understanding architecture, debugging

### Troubleshooting Guides
**Purpose:** Problem solving  
**Examples:** OAuth Troubleshooting Guide  
**When to use:** Resolving issues

### Operational Guides
**Purpose:** Deployment and operations  
**Examples:** Deployment Guide, Performance Guide  
**When to use:** DevOps, optimization

---

## 📊 Documentation Coverage

| Topic | Coverage | Guide(s) |
|-------|----------|----------|
| **Cloud Provider Integration** | ✅ 100% | Complete Frontend Guide |
| **OAuth Popup Flow** | ✅ 100% | OAuth Integration Guide |
| **PKCE Implementation** | ✅ 100% | PKCE guides (backend + frontend) |
| **Security Best Practices** | ✅ 100% | Security Guide, OAuth Security |
| **Testing Strategies** | ✅ 100% | Testing Guide |
| **Deployment** | ✅ 100% | Deployment Guide |
| **Performance** | ✅ 90% | Performance Guide |
| **Development Workflows** | ✅ 100% | Development Guide |

---

## 🗂️ Archive

Historical documentation and review reports are preserved in the **[archive/](./archive/)** folder for reference.

---

## 💡 Contributing to Guides

**Found an issue or have suggestions?**
1. Check if a guide already exists for the topic
2. Review related guides for completeness
3. Submit feedback or open a PR
4. Follow the documentation standards in [docs/08-Contribution/](../08-Contribution/)

---

## 📞 Support

**For implementation questions:** Review the appropriate guide and troubleshooting sections  
**For security questions:** Start with [Security Guide](./security-guide.md)  
**For OAuth issues:** Check [OAuth Troubleshooting Guide](./oauth-troubleshooting-guide.md)  
**For testing help:** See [Testing Guide](./testing-guide.md)

---

**Last Updated:** 2024-10-01  
**Total Active Guides:** 15  
**Status:** ✅ Production Ready
