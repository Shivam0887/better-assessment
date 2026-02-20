# Runway — AI-Powered Product Development Lifecycle Tool

## Project Overview

Runway is an end-to-end product development lifecycle tool. It takes a product idea from text description through AI-generated scoping, project setup, team assignment, execution tracking, and AI-written status reports.

**Three-phase user journey:**

1. **Scope** — Describe an idea → AI generates epics, user stories, tech stack, timeline, risks
2. **Plan** — Convert AI scope into a live project with milestones, due dates, team assignments
3. **Track** — Log daily updates, monitor progress, generate AI weekly status reports

**Reference:** See `runway_product_spec.md` for the full product specification.

## Tech Stack Summary

- **Backend:** Python 3.11, Flask, Supabase (supabase-py), Google Gemini 2.5 Flash (google-genai)
- **Frontend:** React 19 + TypeScript (Vite), Tailwind CSS v4, shadcn/ui, React Router v7, Zustand, React Hook Form + Zod
- **Data Fetching:** React 19 `use` hook + `fetch` + `Suspense`
- **Package Manager:** pnpm (frontend)
- **No Auth, No Docker, No Testing** (assessment scope)

## Rules

Detailed coding rules and guidelines are in `.agent/rules/`:

- `@.agent/rules/tech-stack.md` — Complete tech stack with versions and packages
- `@.agent/rules/project-structure.md` — Directory layout and file organization
- `@.agent/rules/backend.md` — Flask, Supabase, Python conventions
- `@.agent/rules/frontend.md` — React, TypeScript, shadcn/ui, Tailwind v4, state, routing, forms
- `@.agent/rules/ai-integration.md` — Gemini structured output, error handling, prompts
- `@.agent/rules/api-design.md` — REST conventions, design language, naming
