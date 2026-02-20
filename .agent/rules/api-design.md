---
trigger: always_on
---

# API Design & Design Language

## REST API Conventions

- Base URL: `/api/v1/`
- RESTful conventions with proper HTTP methods.
- All responses are JSON.
- Error format: `{ "error": "message", "code": 400 }`
- Use Supabase UUIDs as IDs — never expose internal auto-increment IDs.
- CORS is enabled for the frontend dev server origin.
- See `runway_product_spec.md` §4 for the full route table.

## Design Language

- **Style:** Clean and minimal — think **Linear** or **Notion**.
- **Palette:** gold-ish (`#D4AF37`) / white / gray with clear visual hierarchy.
- **Typography:** Use a modern sans-serif font (e.g., Inter from Google Fonts).
- **Status colors:** Gray (not started), Blue (in progress), Green (completed), Red (blocked/blocker).
- **Risk severity colors:** Red (high), Amber (medium), Gray (low).
- **Health indicators:** Green (no blockers), Amber (1 blocker), Red (2+ blockers or past-due).
- **Empty states:** Always provide meaningful empty states with CTAs.
- **Loading states:** Use skeletons (via shadcn `<Skeleton>`) over spinners where possible.

## Critical Rules

1. **Never hardcode secrets.** All API keys and URLs go in `.env` files (gitignored).
2. **Keep route handlers thin.** Business logic belongs in `services/`, not in route files.
3. **Use structured output** for scope generation and scope-to-project conversion — never rely on regex/string parsing of LLM output.
4. **Use regular text output** for weekly summaries (prose, not JSON).
5. **Type everything.** No `any` in TypeScript. Define proper types for all API contracts.
6. **Use Suspense boundaries.** Every `use()` call must be wrapped in a `<Suspense>` with a fallback.
7. **Zustand for UI state, `use` hook for server data.** Don't mix.
8. **CSS-only animations.** No JavaScript animation libraries. Use transitions and keyframes.
9. **Native drag and drop.** No DnD libraries. Use the HTML5 API.
10. **Supabase is the database layer.** No SQLAlchemy, no raw SQL files, no migrations in code. Schema is managed via Supabase Dashboard.
11. **Single transaction semantics.** When converting scope to project, batch all Supabase inserts logically and handle errors atomically.
12. **Prefer shadcn/ui components** over custom-built UI. Customize the copied components as needed.
