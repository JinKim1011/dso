---
applyTo: "**/*.md"
---

# Markdown writing guidelines

## Document responsibility

- Give each document one clear responsibility.
- Keep implementation evidence, API contracts, architecture, security policy, setup instructions, and development plans in their respective documents.
- Do not repeat rules, verification results, or implementation details that are owned by another document.
- Link to the source document instead of duplicating its content.
- Preserve a short "Find relevant reads in:" section near the top for closely related documents.

## Content state

- Prefer the latest implementation state over an accumulated historical record.
- Replace outdated facts, counts, examples, dates, and status labels.
- Separate implemented, planned, provider-responsibility, and verification-required states.
- Do not present planned or deployment-only controls as implemented.
- Add implementation links and verification commands where they improve reproducibility.

## Scope and duplication

- Remove content that belongs in a more specific document.
- Keep threat models focused on assets, actors, trust boundaries, threats, and required failure behavior.
- Keep implementation inventories focused on implemented controls and verification evidence.
- Keep migration verification focused on latest execution evidence and reproduction steps.
- Keep API contracts focused on endpoints, request/response fields, errors, and compatibility.
- Keep setup guides focused on the minimum steps needed to prepare and run the system.
- Keep the root README focused on product purpose, implemented use cases, repository structure, local setup, commands, and documentation links.

## Markdown style

- Use natural Markdown paragraphs with no artificial source line wraps in the middle of a paragraph.
- Keep code blocks, tables, lists, headings, and diagrams only where structure improves readability.
- Do not use trailing whitespace for forced line breaks.
- Format related prose in one or two concise paragraphs when it reads better than a list.
- Prefer short, complete sentences and direct language.

## Accuracy

- Verify endpoint names, field names, environment variables, package names, scripts, table counts, migration names, and test results against the implementation.
- Verify that every relative link targets an existing file.
- Do not invent file, package, command, or test names.
- Use exact implementation terminology, including actual JSON field names and HTTP error codes.
- If code and documentation disagree, document the correct implementation and call out unrelated planned changes separately.

## Standard document structure

```md
# Document title

Describe the document's responsibility in one or two sentences.

Find relevant reads in:

- [related document](./related.md) for ...

## Main section

Keep only facts owned by this document.
```

## Cross-document ownership

- ER model: entities, keys, cardinality, and relationships.
- Migration verification: current verification evidence and reproduction commands.
- Published release API contract: external HTTP contract and compatibility rules.
- Workbench local development: local database and workbench setup.
- Threat model: threats and required failure behavior.
- Implemented security measures: implemented controls and verification evidence.
- Root README: repository entry point and currently implemented use cases.
- Audit event catalog: implemented security measures, unless the project later establishes a dedicated data-contract document.
