# Plan: <split-view-by-category / TokensView>

## 1. Context

- Design Token Manifest needs more semantic/role guidance for defining agent-friendly design tokens.
- Current `TokensView` implementation renders a single 'all tokens' view.
- Each `category`(Color, Typography, Spacing, Radius, Motion, Shadow) has its own mental model and fields.

## 2. Goal

- Split a single 'all tokens' view into one page per category.
- This enables category-specific field modeling without changing the manifest source of truth.

## 3. Non-goal

- Update `buildTokenGraphModel`: this already groups types into `categories` (with `tokenTypeIds`) and includes `tokenTypes`, so per-category pages can be implemented in the route/view layer.

## 4. Scope

- Introduce category routes under `apps/workbench/app/tokens/` for `color`, `typography`, `spacing`, `radius`, `motion`, and `elevation` (incremental rollout).
- Keep a shared base page/view for common shell and ReactFlow behavior
- Move or add category-specific form components only when the category actually needs its own field model
- Keep existing shared editors where they still fit the domain (`TokenColorForm`, `TokenTypographyForm`, `TokenSingleValueForm`)
- Keep `navigation.ts` pointing to the selected default category entry point in the workbench shell

## 5. Approach

- Treat category as the route boundary, not as a new model layer.
- Reuse the existing `buildTokenGraphModel` output and filter by category in the page or view layer.
- Keep `mapTokenGraphToFlow(model)` as-is for now; add optional mapper params only if category-specific layout divergence appears.
- Keep the shared graph topology stable first; remove the root node only if the category page really needs a different layout contract.
- Avoid a new API endpoint until there is a real need to fetch category-specific data separately.

## 6. Steps

- Step 1: Keep each category route as a thin wrapper that passes `category` into shared `TokensView`.
- Step 2: Add routes `typography`, `spacing`, `radius`, `motion`, `elevation`.
- Step 3: Keep navigation default route aligned with rollout (currently `/tokens/color`).
- Step 4: Add category-specific form components only when an existing shared form is no longer adequate.
- Step 5: If layout must diverge, extend flow mapping for category-only layout and fit behavior.
- Step 6: Verify staged edits and manifest write path still produce one manifest output.

## 7. Risks / Notes

- If all category pages keep the same ReactFlow layout, separate route wrappers are enough; do not duplicate the whole view implementation.
- If a category needs different node shapes, field sets, or save behavior, then extract a dedicated domain view and form set for that category.
- Split by user mental model and field model, not by implementation convenience.
- Prefer a shared shell plus category-specific content over six fully independent pages unless the categories truly diverge.

## 8. Recommended Architecture

- `apps/workbench/app/tokens/page.tsx` remains a shared all-category entry.
- `apps/workbench/app/tokens/<category>/page.tsx` should be the category route entry point.
- Category-specific components can live under `apps/workbench/app/tokens/<category>/components/` when they stop being shared.
- Shared token graph/model utilities should stay under `apps/workbench/app/tokens/lib/`.
- `TokensView` remains shared and receives `category?: ...` for filtering.
