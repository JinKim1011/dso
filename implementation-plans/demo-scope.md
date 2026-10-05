# Closed beta

The first release scope paln should produce a deployable and useable web application suitable for a 'controlled team'. Additional infrastructure, operation, and identity-management work would be needed before threating it as a large-scale production service.

## Landing Page

The public landing page is the entry point for DSO. It introduces the product, explains the problem it addresses, and directs visitors into the interactive demo or the early-access request flow.

The landing page should include:

- A concise description of DSO as a workbench for authoring and publishing design-system resources.
- A clear action to open the interactive demo.
- A short overview of the workflow:
  - Author tokens and components.
  - Associate components with tokens and document templates.
  - Publish a versioned release.
  - Generate JSON, CSS, and Markdown resources.
- A visible early-access request action.
- A clear distinction between the public demo and authenticated project workspaces.
- Links to relevant documentation or technical details.

### Journey

1. A visitor opens the public DSO landing page.
2. The page explains what DSO does and identifies the main workflow.
3. The visitor chooses either `Demo` or `Early access`.
4. `Demo` launches the resettable interactive demo.
5. `Early access` opens the validated early-access form.
6. After exploring the demo, the visitor can return to the landing page or submit an early-access request.

## Demo

The interactive demo provides a safe, resettable way to explore DSO without creating an account or accessing private project data. The demo must not expose PostgreSQL, private projects, credentials, API keys, or unpublished team resources. Demo changes should be temporary, isolated from real projects, and safe to discard.

### Scope

- Browse a seeded design-system project.
- View design tokens, components, templates, and token relationships.
- Edit selected tokens in a temporary staged workspace.
- Preview how token changes affect generated resources.
- Publish a demonstration release.
- Inspect generated `tokens.json`, `tokens.css`, and component Markdown.
- Reset the demo to its original state at any time.

### Journey

1. The visitor opens the public DSO demo.
2. DSO loads a seeded demonstration project.
3. The visitor explores token categories, registered components, document templates, and component-token relationships.
4. The visitor edits a supported token in the staged workspace.
5. DSO displays the updated token value and its effect on generated resources.
6. The visitor previews the staged release.
7. The visitor starts the demonstration publish workflow.
8. DSO creates a temporary demonstration release without modifying private project data.
9. The visitor views the generated `tokens.json`, `tokens.css`, and component Markdown output.
10. The visitor can reset the demo and return to the original seeded project.
11. The visitor can request early access after completing or leaving the demo.

## Early access

### Request process

- Show a form with email and optional message.
- Validate the input.
- Submit it to a protected API form service.
- Store or forward the rquest.
- Show a confirmation message.

### Admin process

Manual account support is needed because first release does not inlcude public registration. An administrator would need to:

- Create the user record.
- Store a properly hashed password.
- Create or assign a project.
- Add the user to `project_memebers`.
- Assign a role such as `viewer`, `editor`, or `admin`.
- Help with password reset to account removal if those feature are not implemented.

```
Database relationship

users
  |
  v
project_members
  |
  v
projects
```

## Future extension : Open Beta

### Security

Public access creates more realistic threats:

- Account takeover
- Credential stuffing
- Abuse of public endpoints
- Cross-tenant data leaks
- API-key theft
- Denial-of-service attempts
- Malicious templates or generated content

### Database

- Users and organizations
- Many-to-many memberships
- Roles and permissions
- Tenant ownership
- Foreign keys
- Unique constraints
- Cascading deletes
- Indexes for authorization queries
- Transactions for account and project operations
