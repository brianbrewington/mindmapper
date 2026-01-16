# MindMapper Documentation

## Directory Structure

```
docs/
├── README.md           ← You are here
├── bugs.md             # Known issues and bug tracking
├── ideas/              # Brainstorming and rough concepts
│   ├── expansion_ideas.md
│   ├── interoperability_format.md
│   └── native_apps.md
├── requirements/       # Product requirements documents (PRDs)
├── design/             # Architecture and technical design
│   ├── code_critique.md
│   └── software_docs.md
├── guides/             # How-to guides and tutorials
├── decisions/          # Architecture Decision Records (ADRs)
└── changelog/          # Release notes and version history
```

## Quick Links

### For Contributors
- [Code Critique](design/code_critique.md) - Code quality analysis and recommendations
- [Known Bugs](bugs.md) - Bug tracking and technical debt

### For Product
- [Expansion Ideas](ideas/expansion_ideas.md) - Future feature ideas
- [Interoperability Format](ideas/interoperability_format.md) - JSON schema for external tools
- [Native Apps](ideas/native_apps.md) - iPad/macOS app considerations

### For Developers
- [Software Architecture](design/software_docs.md) - System design overview

## Adding Documentation

### Ideas (`docs/ideas/`)
Rough concepts, brainstorms, "what if" explorations. Low commitment.

### Requirements (`docs/requirements/`)
Formal PRDs with:
- Problem statement
- User stories
- Acceptance criteria
- Success metrics

### Design (`docs/design/`)
Technical specifications:
- Architecture diagrams
- Data models
- API contracts
- UI/UX wireframes

### Decisions (`docs/decisions/`)
Architecture Decision Records (ADRs) using format:
```
# ADR-001: Title

## Status
Proposed | Accepted | Deprecated | Superseded

## Context
Why is this decision needed?

## Decision
What was decided?

## Consequences
What are the implications?
```

### Changelog (`docs/changelog/`)
Release notes for each version.

---

*Last updated: January 2026*
