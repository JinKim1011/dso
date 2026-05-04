# Concept Overview

## What is DSO?

Design System Observer (DSO) reimagines design tokens for an AI-native world. Rather than static configuration, DSO treats tokens as intelligent units that carry intent, context, and relationships—making them understandable and actionable for both humans and AI agents.

Built on the paradigm of [Inference Design Systems](https://www.proofofconcept.pub/p/design-systems-are-now-inference), DSO enables design systems to move beyond pixel values and toward semantic, rule-aware interfaces that AI can reason about.

---

## Problem Definition

### Current State of Design Tokens

Traditional design tokens are typically low-level mappings:

```
color-primary = #0066FF
space-4 = 16px
radius-lg = 12px
```

These have limitations:

1. **No semantic meaning** — A model can't infer why `#0066FF` is "primary" or why it matters
2. **Lost context** — Constraints, relationships, and usage rules live in scattered documents, not in the system
3. **Hard to reason about** — Agents can't make intelligent decisions without understanding role, emphasis, state, and context
4. **Fragmented hierarchy** — Multiple unofficial tokens and branches grow outside the system because there's no safe way to experiment

### Why This Matters for AI

When design systems remain low-level and undocumented, AI agents can't:

- Understand when a token applies and when it doesn't
- Recognize relationships between related tokens
- Apply design principles consistently across variations
- Adapt interfaces intelligently to context (theme, state, density, platform)

---

## Solution: The DSO Approach

DSO solves this by encoding design intent directly into tokens. Instead of just values, tokens carry:

- **Role & usage** — Where and why this token is used
- **Constraints & rules** — What interactions or contexts are valid/invalid
- **Relationships** — Links to related tokens, hierarchies, and alternatives
- **Axes of variation** — Explicit dimensions like theme, state, density, and platform

This transforms tokens into a **machine-readable design language** that AI agents can ingest, reason about, and extend.

---

## Core Concepts

### 1. Intent + Context, Not Just Pixels

Move from low-level values to semantic meaning:

**Before:**

```
color-primary = #0066FF
space-4 = 16px
```

**After:**

```
color.interactive.primary
  • role: primary-action
  • emphasis: high
  • surface: default | inverse | destructive
  • contrast-min: 4.5

space.cluster.section
  • role: spacing-between-sections
  • axis: vertical
  • density: comfortable | compact
```

Each token now carries the information an AI agent needs to make context-aware decisions.

### 2. Semantic Layer as First-Class

Most systems already have layers (core → decision → alias), but DSO prioritizes the **semantic layer** as the primary language:

- **Core/Global** — Low-level values (`blue-500`, `16px`, `1.5rem`)
- **Semantic** — Role-based tokens (`text.body`, `color.interactive.primary`) ← **AI speaks this language**
- **Component-scoped** — Optional, for experimentation (`button.primary.background`)

Models engage with semantic tokens first, drilling down to lower levels only when needed. Humans work the same way—semantic is the default, but prototyping at component scope is always available.

### 3. Structured Naming for Machine Parsing

Naming conventions must be both human-readable and AI-parseable. Use fixed segment order and meaningful categories:

```
color.interactive.primary.default.enabled
  → category: color
  → family: interactive
  → role: primary
  → state-group: default
  → state: enabled
```

Benefits:

- AI can extract structure from the name alone
- Patterns become templates (e.g., "create disabled variant by changing last segment")
- Consistency is enforced through structure, not style guides

### 4. Metadata as Schema

Attach constraints and relationships to tokens as first-class data:

```json
{
  "name": "color.interactive.primary",
  "value": "#0066FF",
  "role": "primary-action",
  "surfaces": ["default", "brand"],
  "minContrastOn": ["color.background.default", "color.background.subtle"],
  "doNotUseWith": ["color.text.destructive"],
  "description": "Main action color for interactive components"
}
```

This allows:

- Agents to read constraints programmatically
- Validation systems to check token relationships automatically
- UIs to surface rules and guidance alongside the token

### 5. Explicit Axes of Variation

Modern adaptive interfaces recombine along dimensions like theme, state, density, and platform. Make these axes explicit:

**Examples:**

```
button.primary.background[theme=light][state=hover]
space.formField.inline[density=compact]
```

Or as TypeScript:

```ts
interface InteractiveColorToken {
  name: string;
  role: "primary" | "secondary";
  theme: "light" | "dark";
  state: "default" | "hover" | "pressed" | "disabled";
  value: string;
}
```

This enables agents to safely handle requests like "create dark mode variant" or "generate compact version."

### 6. Relational Tokens: Hierarchy & References

Encode the patterns and relationships that design systems rely on:

```json
{
  "name": "text.caption",
  "value": "12px",
  "basedOn": "text.body",
  "scaleStep": -1
}
```

Instead of isolated tokens, describe their relationships:

- `text.caption` is always 1 step smaller than `text.body`
- `border.input.focused` references `color.interactive.primary`
- `color.interactive.secondary` has lower contrast than `primary`

Agents can then **reuse these patterns** when creating new scales or variants.

### 7. Prototype as First-Class Data

Enable safe experimentation by treating off-system tokens as signals, not noise:

```json
{
  "name": "experiment.button.ghost",
  "origin": "experiment",
  "usageCount": 23,
  "firstSeenAt": "2024-05-01",
  "lastSeenAt": "2024-05-15",
  "relatedTo": ["button.secondary", "button.tertiary"]
}
```

This allows:

- Data-driven promotion decisions ("should this become a semantic token?")
- Clear signaling to agents ("experiment.\* tokens are outside the main system")
- Pattern discovery across teams

### 8. TypeScript-Backed Token Schema

DSO is meant to define tokens as structured data first, not as loose JSON fields or free-form naming conventions. The long-term direction is to model semantic naming, roles, constraints, and relationships in a TypeScript schema so the same shape can be used across validation, editing, and AI ingestion.

That schema should make the token contract explicit:

- semantic name
- role and usage
- constraints and rules
- relations and aliases
- variation axes such as theme, state, and density

This gives the system one shared source of truth that both the workbench and future automation can rely on.

---

## Key Components

The DSO system is built around four interconnected pieces:

### Token Schema

Defines the structure of a token with all required and optional fields:

```
name
  ├─ value
  ├─ role / usage
  ├─ constraints (minContrast, minSize, etc.)
  ├─ relationships (basedOn, doNotUseWith, etc.)
  ├─ axes (theme, state, density, platform)
  ├─ metadata (description, origin, usageCount)
  └─ references (linkToFigma, relatedTokens, etc.)
```

### Token Manifest

The source of truth: a collection of tokens with their complete metadata, organized by semantic layer and family.

Stored as structured JSON/YAML that is:

- **Validated** against the schema
- **Versioned** to track changes over time
- **Queryable** by agents and tools

### Workbench UI

Interactive environment and the primary touchpoint after terminal initialization for:

- Browsing and editing tokens within their relationships
- Creating and testing new tokens with immediate validation
- Defining and editing schema structures and relationships
- Staging changes before committing to the manifest

### Validation & Scanning

Automated processes to:

- Check token names against naming conventions
- Verify metadata completeness and correctness
- Detect unused or orphaned tokens
- Surface relationship conflicts or inconsistencies

## Future Ingestion Model

When DSO starts feeding token data into an LLM or agent, the target input should be:

1. **Token JSON** - the token record with name, value, metadata, and constraints
2. **Relationship graph** - the edges between tokens, aliases, references, and hierarchy
3. **Schema context** - the TypeScript/Zod/TypeBox contract that explains valid structure

This keeps the model from reading tokens as flat strings. Instead, it receives a structured system where meaning comes from both the token payload and the graph around it.

In practice, that means the ingest path should preserve:

- token identity and semantic naming
- role, usage, and constraint metadata
- relationships such as `basedOn`, `relatedTo`, and `doNotUseWith`
- axes like theme, state, density, and platform

The goal is for the agent to reason over the same data shape that humans edit in the workbench.

---

## Design Principles for Implementation

1. **Semantic first** — Design the semantic layer before drilling into details
2. **Explicit over implicit** — Encode rules and relationships in the system, not in documentation
3. **Parseable by machines** — Structure, naming, and metadata must be programmatically readable
4. **Safe to experiment** — Off-system tokens should be tracked, not banned
5. **Observable patterns** — Make relationships and hierarchies visible at every level

---

## Next Steps

- See [Procedural Guide](./procedural.md) for step-by-step workflows
- Visit the [Workbench README](../workbench/README.md) for UI-specific details
- Check the [root README](../../README.md) for architecture and tech stack
