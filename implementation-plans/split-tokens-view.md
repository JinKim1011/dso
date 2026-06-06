# Plan: <split-view-by-category / TokensView>

## 1. Context

- Design Token Manifest needs more semantic/role guidance for defining agent-friendly design tokens.
- Current `TokensView` implementation renders a single 'all tokens' view.
- Each `category`(Color, Typography, Spacing, Radius, Motion, Shadow) has its own mental model and fields.

## 2. Goal

- Split a single 'all tokens' view into one page per category.
- This enables category-specific field modeling without changing the manifest source of truth.

## 3. Non-goal

- Update `buildTokenGraphModel`: this already groups types into `categories` (with `tokenTypeIds`) and includes `tokenTypes`, so per-category pages can be implemented in the view layer.

## 4. Scope

- Introduce category routes under `apps/workbench/app/tokens/` for `color`, `typography`, `spacing`, `radius`, `motion`, and `shadow`.
- Keep `TokensView` for common shell and ReactFlow behavior
- Move category-specific form components into `tokens/<category>/components` (`TokenColorForm`, `TokenTypographyForm`, `TokenSingleValueForm`).
- Keep `navigation.ts` pointing to the selected default category entry point in the workbench shell

## 5. Approach

- Treat category as the route boundary, not as a new model layer.
- Reuse the existing `buildTokenGraphModel` output and filter by category in view layer.
- Keep `mapTokenGraphToFlow(model)` as-is for now; add optional mapper params only if category-specific layout divergence appears.
- Keep the shared graph topology stable first
- Avoid a new API endpoint until there is a real need to fetch category-specific data separately.

## 6. Steps

- Step 1: Keep each category route as a thin wrapper that passes `category` into shared `TokensView`.
- Step 2: Add routes `typography`, `spacing`, `radius`, `motion`, `shadow`.
- Step 3: Keep navigation default route as `/tokens/color`.
- Step 4: Move category-specific form components only when an existing shared form is no longer adequate.
- Step 5: Verify staged edits and manifest write path still produce one manifest output.

## 7. Risks / Notes

- Split by user mental model and field model, not by implementation convenience.
- Prefer a shared shell plus category-specific content over six fully independent pages unless the categories truly diverge.
- If all category pages keep the same ReactFlow layout, separate route wrappers are enough; do not duplicate the whole view implementation.
- If a category needs different node shapes, field sets, or save behavior, then extract a dedicated domain view and form set for that category.

## 8. Architecture

- `apps/workbench/app/tokens/<category>/page.tsx` should be the category route entry point.
- Category-specific components can live under `apps/workbench/app/tokens/<category>/components/` when they stop being shared.
- Shared token graph/model utilities should stay under `apps/workbench/app/tokens/lib/`.
- `TokensView` remains shared and receives `category?: ...` for filtering.
