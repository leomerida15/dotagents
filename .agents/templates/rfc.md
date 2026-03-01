# RFC: [Proposal Title]

> Request for Comments - Use this template when proposing changes that need stakeholder input and discussion before implementation.

## Summary

A one-paragraph explanation of the proposal. Should be understandable by someone not deeply familiar with the domain.

## Motivation

Why is this RFC needed?

- What problem does it solve?
- What is the current state and why is it insufficient?
- What opportunity does it unlock?

**Goal**: Clearly explain the "why" before the "how".

## Detailed Design

### Technical Specification

Describe the proposed solution in detail:

#### Scope
- What's included in this proposal
- What's explicitly excluded

#### Architecture
```
[Diagram or ASCII art if helpful]

+----------+     +----------+
| Component| --> | Component|
+----------+     +----------+
```

#### API Changes
If applicable, describe any API additions/modifications:

```typescript
// Example interface or type definitions
interface NewFeature {
  // ...
}
```

#### Data Model
If applicable, describe data structure changes:

#### Configuration
Any new configuration options or environment variables:

### User Experience

How does this affect end users?
- New workflows enabled
- Breaking changes
- Migration required?

### Security Considerations

- New attack vectors?
- Data exposure risks?
- Authentication/authorization changes?

## Drawbacks

Why should we NOT do this?

- [Drawback 1]
- [Drawback 2]

Be honest about the costs.

## Rationale and Alternatives

### Why this design?

Explain the thought process that led to this proposal.

### Alternative 1: [Name]
- Description
- Why not chosen

### Alternative 2: [Name]
- Description
- Why not chosen

### What happens if we do nothing?

Describe the status quo alternative.

## Unresolved Questions

What needs to be decided or discussed before this can be implemented?

- [ ] Question 1: ...
- [ ] Question 2: ...
- [ ] Question 3: ...

## Implementation Phases

| Phase | Description | Estimated Effort | Dependencies |
|-------|-------------|------------------|--------------|
| 1 | [Description] | [S/M/L] | None |
| 2 | [Description] | [S/M/L] | Phase 1 |
| 3 | [Description] | [S/M/L] | Phase 2 |

## Success Criteria

How will we know if this RFC is successful?

- [Measurable outcome 1]
- [Measurable outcome 2]

## References

- [Related ADR]
- [External documentation]
- [Prior art / similar implementations]

---

**Author**: [Name]
**Created**: YYYY-MM-DD
**Last Updated**: YYYY-MM-DD
**Status**: [Draft | In Review | Approved | Rejected]
