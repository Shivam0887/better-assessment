---
trigger: always_on
---

# Tech Stack

## Backend

| Layer      | Technology              | Package / Version        |
| ---------- | ----------------------- | ------------------------ |
| Language   | Python                  | 3.11                     |
| Framework  | Flask                   | `flask` (latest)         |
| Database   | Supabase (PostgreSQL)   | `supabase` (supabase-py) |
| AI / LLM   | Google Gemini 2.5 Flash | `google-genai`           |
| Validation | Marshmallow or manual   | —                        |
| CORS       | Flask-CORS              | `flask-cors`             |

## Frontend

| Layer             | Technology                        | Package / Version                               |
| ----------------- | --------------------------------- | ----------------------------------------------- |
| Language          | TypeScript                        | strict mode                                     |
| Framework         | React 19                          | via Vite                                        |
| Build Tool        | Vite                              | latest                                          |
| Styling           | Tailwind CSS v4                   | `tailwindcss@4`                                 |
| Component Library | shadcn/ui                         | latest (Tailwind v4 compatible)                 |
| Charts            | shadcn/ui chart component         | (built on Recharts)                             |
| Routing           | React Router v7                   | `react-router`                                  |
| State Management  | Zustand                           | `zustand`                                       |
| Data Fetching     | `use` hook + `fetch` + `Suspense` | native React 19                                 |
| Forms             | React Hook Form + Zod             | `react-hook-form`, `zod`, `@hookform/resolvers` |
| Drag & Drop       | Native HTML Drag and Drop API     | —                                               |
| Animations        | CSS-only                          | transitions, keyframes, no JS libraries         |
| Package Manager   | pnpm                              | `pnpm`                                          |

## Infrastructure

| Concern          | Choice                            |
| ---------------- | --------------------------------- |
| Database hosting | Supabase (cloud)                  |
| Authentication   | None (single-user for assessment) |
| Deployment       | Vercel (Serverless Functions)     |
| Testing          | Not configured                    |
