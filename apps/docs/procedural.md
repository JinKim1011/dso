# Procedural Guide

This document is a working draft for the DSO PoC. The exact workflow may change as the product and schema evolve.

## Purpose

This guide explains how to install DSO as a package, how to run terminal-based initial setup, and how to use the system during the PoC phase.

After terminal setup is completed, the workbench becomes the main place where the available features are used.

## 1. Package Installation

DSO is intended to be installed into a repository as an npm package.

Example:

```bash
pnpm i dso
```

Recommended environment:

- Node.js 18+
- pnpm

After installation, run the initialization command in the terminal.

Example:

```bash
dso init
```

During `dso init`, the setup flow asks which starting path to use. When setup is complete, the workbench opens in the browser.

## 2. Initial Setup

The initial setup should stay small and explicit, and it should run in the terminal.

During `dso init`, the PoC supports two paths:

1. build directly from scratch
2. start from the DSO template and build on top of that

The recommended path is the DSO template. It gives a stronger starting point for building tokens that follow the Inference Design System paradigm, especially when the goal is to work with semantic meaning, roles, constraints, and relationships from the beginning.

Suggested initial setup:

1. Choose the main token source of truth for the session.
2. Define the semantic token shape before adding many values.
3. Decide which axes matter for the current test, such as theme, state, or density.
4. Keep the schema strict enough to validate meaning, but simple enough to move quickly.

Recommended configuration priorities:

- semantic naming first
- role and usage metadata second
- constraints and relations third
- visual polish last

This order keeps the system focused on structure instead of appearance.

## 3. Technical Constraints

The current direction assumes a few practical constraints.

### What to keep in mind

- **TypeScript first**: token shapes should be represented in TypeScript before they become flexible runtime data.
- **Schema-driven data**: JSON Schema, Zod, or TypeBox can be used to keep token records explicit.
- **Relationship-aware editing**: a token should not be treated as an isolated value if it has aliases, dependencies, or usage rules.
- **PoC-friendly scope**: avoid overbuilding the ingestion layer before the schema is stable.

### What to avoid for now

- very loose token naming
- hidden rules that only live in documentation
- hardcoded assumptions that cannot be validated
- large migrations before the semantic layer is stable

## 4. Persistence Model

DSO persists design tokens and the manifest as versioned files in the repository, such as JSON and TypeScript outputs. It does not require a database. The workbench's manifest-save route is a dev-time helper for writing those files locally, not a public API for production apps or end users.

The storage location should be defined by a repo-level config file that is committed with the project, similar to how Storybook uses `main.ts` for repo-scoped setup. That keeps the manifest path explicit and makes it easy for teams to move the output into a custom folder if needed.

When the repo config is absent, the current default is the repository root `design-tokens-manifest.json`.

## 5. Initialization Path

There are two initialization paths in the PoC.

### Option A: Build directly from scratch

Use this when the goal is to explore a custom setup from the beginning. Setup starts in the terminal and then continues in the workbench.

### Option B: Start from the DSO template

This is the recommended path for the PoC.

Start with:

- semantic token naming
- explicit metadata fields
- relationship graphs between tokens
- validation around the schema from the beginning

This approach is cleaner because the system can be designed around inference-ready data instead of retrofitting meaning into old structures.

### Recommendation

If the goal is to prove the DSO direction, start from the DSO template first. Use direct scratch setup when the intent is to explore a custom flow.

## 6. Step-by-Step Usage

### Step 1: Install the package

Install DSO in the target repository.

```bash
pnpm i dso
```

### Step 2: Run initialization in terminal

Run initialization and choose a start path.

```bash
dso init
```

Choose one path:

- build directly from scratch
- start from the DSO template (recommended)

### Step 3: Open workbench

After initialization is complete, open the workbench in the browser and continue the rest of the flow there.

### Step 4: Define the semantic token

Create a token name that reflects intent, not just appearance.

Example:

```json
{
  "name": "color.interactive.primary",
  "value": "#0066FF"
}
```

### Step 5: Attach metadata

Add role, usage, constraints, and relation fields.

```json
{
  "name": "color.interactive.primary",
  "value": "#0066FF",
  "role": "primary-action",
  "usage": "main interactive action",
  "constraints": {
    "minContrastOn": ["color.background.default"]
  },
  "relations": {
    "relatedTo": ["color.interactive.secondary"],
    "doNotUseWith": ["color.text.destructive"]
  }
}
```

### Step 6: Validate the shape

Check that the token matches the current schema and that the naming pattern is consistent.

Validation should confirm:

- the token name is semantic
- the metadata fields are present and valid
- the relationship rules are not contradictory

### Step 7: Edit in the workbench

Use the workbench to browse the token tree, inspect the metadata, and update the token while keeping its relationships visible.

The workbench should be used to:

- review token structure
- edit metadata safely
- inspect schema changes in context
- stage changes before they are committed

### Step 8: Inspect schema result

Check how the token behaves in the schema view and relationship graph.

This is where you verify:

- the semantic role still makes sense
- the schema axes and constraints are coherent
- the change does not break related tokens

### Step 9: Record the relationship graph

If the token is part of a larger set, connect it to the other tokens it depends on or influences.

Examples:

- `basedOn`
- `relatedTo`
- `doNotUseWith`
- `aliasOf`

This graph is important because future agents should ingest both the token data and the relationships around it.

### Step 10: Prepare for ingestion

When the token set is ready, package it as structured data for downstream tools.

The ideal input shape is:

1. token JSON
2. relationship graph
3. schema definition

This is the format that will make LLM or agent ingestion easier later.

## 7. Practical Workflow Summary

For the current PoC, the recommended loop is:

1. install DSO into the repository
2. run `dso init` in terminal
3. choose scratch setup or DSO template
4. open workbench
5. define a semantic token
6. add metadata and constraints
7. validate against the schema
8. edit in the workbench
9. inspect schema result
10. connect it to related tokens
11. keep the structure ready for future ingestion

## 8. Draft Status

This document is intentionally incomplete. It should be updated as the package flow, terminal init flow, workbench flow, and template strategy become more concrete.
