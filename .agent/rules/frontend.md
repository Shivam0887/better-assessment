---
trigger: always_on
---

# Frontend Guidelines

## TypeScript

- **Strict mode enabled** — no `any` types unless absolutely unavoidable.
- Define all API response types and component prop types in `src/types/index.ts` or colocated `.types.ts` files.
- Use `interface` for object shapes that may be extended, `type` for unions and intersections.
- Prefer explicit return types on exported functions.

## React Component Conventions

- **Functional components only** — no class components.
- **Named exports** for all components (no default exports).
- File naming: `PascalCase.tsx` for components, `kebab-case.ts` for hooks and utilities.
- One component per file. Subcomponents that are tightly coupled may share a file.
- Colocate component-specific styles, types, and constants.

```tsx
// ✅ Good — named export, typed props
interface EpicCardProps {
  epic: Epic;
  onExpand: (id: string) => void;
}

export function EpicCard({ epic, onExpand }: EpicCardProps) {
  return ( ... );
}
```

## Data Fetching with `use` Hook

Use React 19's `use` hook with `Suspense` boundaries for data loading:

```tsx
// api/client.ts — return Promises, don't await inside
export function fetchProjects(): Promise<Project[]> {
  return fetch("/api/v1/projects")
    .then((res) => {
      if (!res.ok) throw new Error("Failed to fetch projects");
      return res.json();
    })
    .then((data) => data.projects);
}

// pages/HomePage.tsx — consume with `use`
import { use, Suspense } from "react";
import { fetchProjects } from "@/api/client";

const projectsPromise = fetchProjects();

function ProjectsList() {
  const projects = use(projectsPromise);
  return <ProjectGrid projects={projects} />;
}

export function HomePage() {
  return (
    <Suspense fallback={<ProjectsSkeleton />}>
      <ProjectsList />
    </Suspense>
  );
}
```

**Key rules:**

- Create the promise **outside** the component (or in a store/cache) to avoid re-fetching on every render.
- Wrap `use` consumers in `<Suspense>` with a meaningful skeleton/spinner fallback.
- For mutations (POST, PATCH, DELETE), use regular `fetch` in event handlers — **not** `use`.
- Cache and invalidate promises via Zustand store when data changes.

## State Management with Zustand

```tsx
// store/index.ts
import { create } from "zustand";

interface AppStore {
  isNotificationsOpen: boolean;
  toggleNotifications: () => void;

  editedScope: Partial<Scope> | null;
  setEditedScope: (scope: Partial<Scope> | null) => void;

  projectsPromise: Promise<Project[]> | null;
  invalidateProjects: () => void;
}

export const useAppStore = create<AppStore>((set) => ({
  isNotificationsOpen: false,
  toggleNotifications: () =>
    set((s) => ({ isNotificationsOpen: !s.isNotificationsOpen })),

  editedScope: null,
  setEditedScope: (scope) => set({ editedScope: scope }),

  projectsPromise: null,
  invalidateProjects: () => set({ projectsPromise: fetchProjects() }),
}));
```

- Use Zustand for **client-side UI state** (modals, drawers, selections, edit buffers).
- Use Zustand to **cache data-fetching promises** and provide invalidation.
- Keep stores small and focused. Split into multiple stores if needed.

## Forms with React Hook Form + Zod

```tsx
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const ideaSchema = z.object({
  productName: z.string().min(1, "Product name is required"),
  ideaText: z
    .string()
    .min(100, "Describe your idea in at least 100 characters"),
  targetAudience: z.string().optional(),
  budgetRange: z.enum(["low", "medium", "high"]).optional(),
  timelinePressure: z
    .enum(["asap", "1_3_months", "3_6_months", "flexible"])
    .optional(),
});

type IdeaFormData = z.infer<typeof ideaSchema>;
```

- Define Zod schemas alongside the form component or in a shared `schemas/` directory.
- Infer TypeScript types from Zod schemas with `z.infer<>`.
- Use shadcn `<Form>` components which integrate with React Hook Form.

## Routing with React Router v7

```tsx
import { BrowserRouter, Routes, Route } from "react-router";

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<HomePage />} />
          <Route path="scopes/new" element={<NewScopePage />} />
          <Route path="scopes/:id" element={<ScopeResultPage />} />
          <Route path="scopes" element={<ScopesLibraryPage />} />
          <Route path="projects/:id" element={<ProjectPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
```

## shadcn/ui Usage

- Components live in `src/components/ui/` — **copied into the project**, not imported from a package.
- Install via CLI: `pnpm dlx shadcn@latest add button card dialog` etc.
- Customize freely — they are your code, not a dependency.
- Use `cn()` from `src/lib/utils.ts` for conditional class merging.

## Tailwind CSS v4

- Tailwind v4 uses **CSS-first configuration** — no `tailwind.config.js`.
- Configure theme in `src/index.css` using `@theme`.
- Use `@import "tailwindcss"` instead of `@tailwind` directives.

```css
/* src/index.css */
@import "tailwindcss";

@theme {
  --color-primary: #d4af37; /* Premium Gold */
  --color-primary-foreground: #ffffff;
  --font-sans: "Inter", sans-serif;
}
```

## CSS-Only Animations

Use CSS transitions and keyframes for all animations. No framer-motion or other JS animation libraries.

```css
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
.spinner {
  animation: spin 1s linear infinite;
}

.drawer {
  transform: translateX(100%);
  transition: transform 0.3s ease-in-out;
}
.drawer[data-open="true"] {
  transform: translateX(0);
}
```

## Native Drag and Drop

Use the HTML5 Drag and Drop API for milestone reordering:

```tsx
<div
  draggable
  onDragStart={(e) => e.dataTransfer.setData("text/plain", milestone.id)}
  onDragOver={(e) => e.preventDefault()}
  onDrop={(e) =>
    handleReorder(e.dataTransfer.getData("text/plain"), targetIndex)
  }
>
  {/* milestone content */}
</div>
```
