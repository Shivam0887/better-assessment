# RUNWAY

## AI-Powered Product Development Lifecycle Tool

**Stack:** Python 3.11 + Flask · React 19 + TypeScript · Supabase (PostgreSQL) · Gemini 2.5 Flash

---

## Table of Contents

1. [Product Overview](#1-product-overview)
2. [Complete Feature List](#2-complete-feature-list)
3. [Data Model](#3-data-model)
4. [Backend API Route Design](#4-backend-api-route-design)
5. [Data Flow Diagrams](#5-data-flow-diagrams)
6. [UI Screens & Elements](#6-ui-screens--elements)
7. [AI Integration Details](#7-ai-integration-details)
8. [Project Folder Structure](#8-project-folder-structure)

---

## 1. Product Overview

Runway is an end-to-end product development lifecycle tool designed for startup studios and product agencies. It takes an idea from a single text description all the way through AI-generated scoping, project setup, team assignment, execution tracking, and AI-written status reports — in one seamless workflow.

The name _Runway_ is intentional. In startup language, runway means how long you have before you run out of time or money. This tool is designed to help teams move fast, stay aligned, and ship — which is exactly what Better Software does for its clients.

### The Three-Phase User Journey

> **Phase 1: Scope** → Describe an idea, let AI generate epics, user stories, tech stack, timeline, and risks.
>
> **Phase 2: Plan** → Convert the AI scope into a live project with milestones, due dates, and team member assignments.
>
> **Phase 3: Track** → Log daily updates, monitor milestone progress, and generate AI-written weekly status reports.

---

## 2. Complete Feature List

### 2.1 Phase 1 — Scope Generation

This is where the user's raw idea becomes a structured engineering plan. The user types a product description in plain English and the system uses an LLM to break it into actionable engineering output.

#### Idea Input Form

- A large, prominent textarea where the user types their product idea in plain English (e.g. _"An Airbnb for dog sitters with real-time chat and payment processing"_).
- A product name field and optional context fields: target audience, budget range (Low / Medium / High), and timeline pressure (ASAP / 1–3 months / 3–6 months / Flexible). These extra fields are fed into the LLM prompt to improve output quality.
- A character counter nudging the user toward a minimum of 100 characters for better AI output. Submitting too short shows an inline warning rather than blocking the submit action.
- A **Generate Scope** button that triggers the API call. While waiting, the form is replaced by an animated loading state with rotating status messages: _"Analyzing your idea..."_, _"Breaking into epics..."_, _"Estimating timeline..."_. This makes the wait feel productive rather than frozen.

#### Scope Results View

- A structured output displayed in collapsible cards — one card per epic. Each epic card shows its name, description, and estimated effort in story points or days.
- Each epic card expands to show the user stories underneath it. User stories are displayed in a simple list with a short title and a one-sentence description in _"As a [user], I want to [action] so that [outcome]"_ format.
- A sidebar or top panel showing the overall summary: suggested tech stack (displayed as tech badges), total timeline estimate in weeks, and a risk panel listing 3–5 identified risks color-coded by severity (High / Medium / Low).
- Inline edit capability — the user can click any epic title, description, or user story and edit it before converting to a project. Changes are saved locally first, then persisted to the database on "Save Edits".
- A **Convert to Project** button that is prominent and always visible. Clicking it opens a confirmation modal that shows a summary of what will be created before committing.
- A **Save as Draft** button that persists the scope without converting it, allowing the user to come back and refine it later.
- A **Regenerate** button that re-runs the LLM call with the same inputs, useful if the first output missed the mark.

---

### 2.2 Phase 2 — Project Setup

Once the user converts a scope to a project, the app sets up the full project structure using the AI-generated epics as the foundation.

#### Auto-Generated Project Structure

- Epics from the scope automatically become **Milestones** in the project. The order of milestones follows a logical dependency — authentication before features, core features before payment, payment before launch.
- The AI-suggested timeline is used to auto-calculate due dates. If the AI estimated "Authentication: 1 week" and the project start date is today, the first milestone due date is set to 7 days from now. Each subsequent milestone stacks on top.
- The user can drag and drop milestones to reorder them, and can edit individual due dates by clicking on them (a date picker appears inline).

#### Team Member Management

- A **Team** tab within the project where the user can add team members. Each member has a name, role (e.g. Frontend Developer, Backend Developer, Designer, QA, Project Manager), and an optional avatar color (used in the UI as a colored circle initial badge — no image upload needed for the assessment).
- Each milestone has an "Assign To" dropdown that shows all team members. A member can be assigned to multiple milestones.
- The project overview shows a simple team roster with each member's name, role, and number of milestones assigned to them.

#### Project Dashboard

- A visual progress bar for each milestone showing completion percentage (0%, 25%, 50%, 75%, or 100% — updated manually or via updates logged).
- A project-level progress ring showing the overall completion percentage across all milestones.
- A timeline view (simple horizontal bar chart) showing each milestone as a bar spanning its start-to-due-date range. Color-coded by status: Not Started (gray), In Progress (blue), Completed (green), Blocked (red).
- Project metadata panel showing the original idea summary, the generated tech stack, and a link back to the original scope for reference.

---

### 2.3 Phase 3 — Execution Tracking

This is the day-to-day operational layer. Once a project is live, team members (or the demo user) log updates against milestones to track real progress.

#### Update Logging

- A **Log Update** form accessible from the project dashboard and from within each milestone's detail view. The form has: a milestone selector (pre-selected if entered from milestone view), an update type tag (Progress, Blocker, Completed, Note), a text area for the update content, and a timestamp that defaults to now but can be adjusted.
- Updates are displayed in a chronological activity feed on the project dashboard — most recent first. Each update shows the milestone it belongs to, the update type as a colored badge, the content, and the timestamp.
- Blocker updates are visually distinguished with a red left border and a warning icon. This helps the project manager quickly scan for problems in the feed.
- Marking a milestone as Completed via an update (or via the milestone status dropdown) triggers a subtle confetti animation. Small details like this make the product feel alive.

#### Milestone Detail View

- Clicking a milestone opens a detail panel (slide-in drawer from the right, not a separate page) showing: the milestone name and description, the assigned team member, the due date, the current status, the full list of user stories from the original scope, and all updates logged for this milestone.
- Within this drawer, the user can change the milestone status, log a new update, and tick off individual user stories as done.

#### AI Weekly Summary

- A **Generate Weekly Summary** button on the project dashboard. Clicking it gathers all updates from the past 7 days, sends them to the LLM with a structured prompt, and returns a clean 3–4 paragraph status report written in professional prose.
- The summary is displayed in a modal with a formatted output. It covers: overall progress this week, key accomplishments, current blockers (if any), and recommended next steps. The user can copy it to clipboard with one click or download it as a `.txt` file.
- The summary prompt includes context from the project: the product name, the original idea, all milestones and their statuses, and the week's updates formatted as structured data.
- A **tone selector** before generating: Technical (for internal engineering standups) or Executive (for client-facing reports). The system prompt changes based on this selection.

---

### 2.4 Cross-Cutting Features

#### Scopes Library

A **Scopes** page listing all previously generated scopes. Each entry shows the product name, idea summary (truncated), creation date, and status (Draft, Converted to Project, or Archived). The user can click any scope to view it, edit it, or convert it to a project if it hasn't been already.

#### Projects Dashboard (Home)

The home screen shows all active projects in a card grid. Each card shows: the project name, a progress ring, the number of milestones, the next upcoming milestone due date, and a health indicator (Green: no blockers; Amber: one blocker; Red: two or more blockers or a past-due milestone).

#### Search

A global search bar in the top nav that searches across project names, milestone names, and update content. Results are grouped by type and link directly to the relevant item.

#### Notifications Panel

A bell icon in the nav opens a slide-out panel showing system notifications: milestones due within 48 hours, milestones that are past due, and projects with active blockers. These are generated server-side when the notification panel is opened — no background job required for the 48-hour scope.

---

## 3. Data Model

The database is PostgreSQL hosted on **Supabase**. We use the `supabase-py` client for data operations. The schema is managed via the Supabase Dashboard.

### 3.1 Entity Relationship Overview

```
Scope        (1) → (0..1) Project
Project      (1) → (many) Milestone
Project      (1) → (many) TeamMember
Milestone  (many) → (1)   TeamMember  [assigned_to]
Milestone    (1) → (many) Update
Milestone    (1) → (many) UserStory
Scope        (1) → (many) Epic
Epic         (1) → (many) UserStory
```

### 3.2 Table Definitions

#### `scopes`

| Column            | Type         | Notes                                                 |
| ----------------- | ------------ | ----------------------------------------------------- |
| id                | UUID (PK)    | Auto-generated                                        |
| product_name      | VARCHAR(255) | User-provided product name                            |
| idea_text         | TEXT         | The raw idea description                              |
| target_audience   | VARCHAR(255) | Optional — fed into LLM prompt                        |
| budget_range      | ENUM         | `low / medium / high`                                 |
| timeline_pressure | ENUM         | `asap / 1_3_months / 3_6_months / flexible`           |
| ai_output_raw     | JSONB        | Full raw JSON from LLM — preserved for debugging      |
| suggested_stack   | JSONB        | Array of tech stack strings e.g. `["React", "Flask"]` |
| timeline_weeks    | INTEGER      | LLM-estimated total duration in weeks                 |
| risks             | JSONB        | Array of `{description, severity}` objects            |
| status            | ENUM         | `draft / converted / archived`                        |
| created_at        | TIMESTAMP    | Auto-set on creation                                  |
| updated_at        | TIMESTAMP    | Auto-updated on save                                  |

#### `epics`

| Column      | Type         | Notes                                     |
| ----------- | ------------ | ----------------------------------------- |
| id          | UUID (PK)    |                                           |
| scope_id    | UUID (FK)    | References `scopes.id` — CASCADE DELETE   |
| name        | VARCHAR(255) | Epic title e.g. "Authentication System"   |
| description | TEXT         | Short description of what the epic covers |
| effort_days | INTEGER      | LLM-estimated effort in working days      |
| order_index | INTEGER      | Determines display order (0-indexed)      |

#### `user_stories`

| Column       | Type                | Notes                                            |
| ------------ | ------------------- | ------------------------------------------------ |
| id           | UUID (PK)           |                                                  |
| epic_id      | UUID (FK)           | References `epics.id` — CASCADE DELETE           |
| milestone_id | UUID (FK, nullable) | Set when scope is converted to project           |
| title        | VARCHAR(255)        | Short story title                                |
| description  | TEXT                | "As a [user], I want [action] so that [outcome]" |
| is_completed | BOOLEAN             | Ticked off by user in milestone detail view      |
| order_index  | INTEGER             | Display order within the epic                    |

#### `projects`

| Column      | Type              | Notes                                      |
| ----------- | ----------------- | ------------------------------------------ |
| id          | UUID (PK)         |                                            |
| scope_id    | UUID (FK, unique) | One-to-one link back to originating scope  |
| name        | VARCHAR(255)      | Copied from `scope.product_name`, editable |
| description | TEXT              | Short project description                  |
| start_date  | DATE              | Set when project is created from scope     |
| status      | ENUM              | `active / on_hold / completed / archived`  |
| created_at  | TIMESTAMP         |                                            |
| updated_at  | TIMESTAMP         |                                            |

#### `team_members`

| Column       | Type         | Notes                                     |
| ------------ | ------------ | ----------------------------------------- |
| id           | UUID (PK)    |                                           |
| project_id   | UUID (FK)    | References `projects.id` — CASCADE DELETE |
| name         | VARCHAR(255) | Full name of the team member              |
| role         | VARCHAR(100) | e.g. "Frontend Developer", "QA Engineer"  |
| avatar_color | VARCHAR(7)   | Hex color code e.g. `#2563EB`             |
| created_at   | TIMESTAMP    |                                           |

#### `milestones`

| Column           | Type                | Notes                                                 |
| ---------------- | ------------------- | ----------------------------------------------------- |
| id               | UUID (PK)           |                                                       |
| project_id       | UUID (FK)           | References `projects.id` — CASCADE DELETE             |
| epic_id          | UUID (FK, nullable) | Link back to the source epic in the scope             |
| assigned_to      | UUID (FK, nullable) | References `team_members.id` — SET NULL on delete     |
| name             | VARCHAR(255)        | Copied from `epic.name`, editable                     |
| description      | TEXT                | Copied from `epic.description`, editable              |
| status           | ENUM                | `not_started / in_progress / completed / blocked`     |
| progress_percent | INTEGER             | `0, 25, 50, 75, or 100` — manually updated            |
| start_date       | DATE                | Auto-calculated from project start + preceding effort |
| due_date         | DATE                | Auto-calculated, user-editable                        |
| order_index      | INTEGER             | Drag-and-drop order within project                    |
| created_at       | TIMESTAMP           |                                                       |
| updated_at       | TIMESTAMP           |                                                       |

#### `updates`

| Column       | Type      | Notes                                       |
| ------------ | --------- | ------------------------------------------- |
| id           | UUID (PK) |                                             |
| milestone_id | UUID (FK) | References `milestones.id` — CASCADE DELETE |
| update_type  | ENUM      | `progress / blocker / completed / note`     |
| content      | TEXT      | The update text written by the user         |
| logged_at    | TIMESTAMP | Defaults to now(), user can adjust          |
| created_at   | TIMESTAMP |                                             |

#### `summaries`

| Column       | Type      | Notes                                        |
| ------------ | --------- | -------------------------------------------- |
| id           | UUID (PK) |                                              |
| project_id   | UUID (FK) | References `projects.id` — CASCADE DELETE    |
| content      | TEXT      | The AI-generated summary text                |
| tone         | ENUM      | `technical / executive`                      |
| week_start   | DATE      | Start of the 7-day window the summary covers |
| generated_at | TIMESTAMP | When the summary was created                 |

---

## 4. Backend API Route Design

The Flask backend follows RESTful conventions. All endpoints return JSON. The base URL is `/api/v1/`. Error responses follow the format `{ "error": "message", "code": 400 }`.

### 4.1 Scopes

| Method | Route                 | Description                                                                         |
| ------ | --------------------- | ----------------------------------------------------------------------------------- |
| GET    | `/scopes`             | List all scopes — returns id, product_name, status, created_at                      |
| POST   | `/scopes/generate`    | Receive idea text + context, call LLM, persist full scope, return structured output |
| GET    | `/scopes/:id`         | Return full scope including epics and user stories                                  |
| PATCH  | `/scopes/:id`         | Update product name, idea text, or status                                           |
| POST   | `/scopes/:id/convert` | Convert scope to project — creates project + milestones + user_stories              |
| DELETE | `/scopes/:id`         | Soft delete (set status to `archived`)                                              |

### 4.2 Projects

| Method | Route                              | Description                                                          |
| ------ | ---------------------------------- | -------------------------------------------------------------------- |
| GET    | `/projects`                        | List all active projects with progress summary                       |
| GET    | `/projects/:id`                    | Full project detail: milestones, team, recent updates                |
| PATCH  | `/projects/:id`                    | Update name, description, status, start_date                         |
| GET    | `/projects/:id/milestones`         | All milestones for a project, ordered by `order_index`               |
| PATCH  | `/projects/:id/milestones/reorder` | Accept array of `{id, order_index}` pairs to persist drag-drop order |
| GET    | `/projects/:id/updates`            | Paginated activity feed — all updates across all milestones          |
| POST   | `/projects/:id/summary`            | Gather last 7 days of updates, call LLM, persist and return summary  |
| GET    | `/projects/:id/summaries`          | All past summaries for a project                                     |
| GET    | `/projects/:id/notifications`      | Compute and return milestone overdue/due-soon alerts                 |

### 4.3 Milestones, Team Members & Updates

| Method | Route                     | Description                                                  |
| ------ | ------------------------- | ------------------------------------------------------------ |
| GET    | `/milestones/:id`         | Single milestone with its user stories and updates           |
| PATCH  | `/milestones/:id`         | Update status, progress_percent, due_date, assigned_to, name |
| POST   | `/milestones/:id/updates` | Log a new update for a milestone                             |
| PATCH  | `/user-stories/:id`       | Toggle `is_completed` or update title/description            |
| GET    | `/projects/:id/team`      | List all team members for a project                          |
| POST   | `/projects/:id/team`      | Add a new team member                                        |
| PATCH  | `/team-members/:id`       | Update name, role, or avatar_color                           |
| DELETE | `/team-members/:id`       | Remove team member — `assigned_to` on milestones SET NULL    |
| GET    | `/search?q=...`           | Global search across projects, milestones, updates           |

---

## 5. Data Flow Diagrams

### 5.1 Phase 1: Scope Generation Flow

1. User fills in the Idea Input Form (`product_name`, `idea_text`, `target_audience`, `budget_range`, `timeline_pressure`) and clicks **Generate Scope**.
2. React POSTs to `/api/v1/scopes/generate`.
3. Flask service layer builds the LLM prompt by injecting the form fields into a structured system prompt using the `google-genai` SDK with a defined JSON schema for structured output.
4. Flask calls the Google Gemini 2.5 Flash API and awaits the response.
5. The LLM returns a structured JSON object with: `{ epics: [...], suggested_stack: [...], timeline_weeks: N, risks: [...] }`.
6. Flask validates the schema. If validation fails, it retries once with a corrective prompt.
7. Flask persists the `scope` row, then inserts `epic` rows (linked to scope), then inserts `user_story` rows (linked to epics). All inside a single DB transaction.
8. Flask returns the full structured scope as the API response.
9. React receives the response and renders the Scope Results View without a page reload.

### 5.2 Phase 2: Convert to Project Flow

1. User reviews scope output and clicks **Convert to Project**. A confirmation modal appears summarizing: number of milestones to be created, estimated total duration, and team to be set up.
2. User confirms. React POSTs to `/api/v1/scopes/:id/convert` with a `start_date`.
3. Flask creates the `project` row linked to the scope (`scope.status` updated to `"converted"`).
4. Flask iterates over the scope's epics. For each epic:
   - Creates a `milestone` row linked to the project and the source epic.
   - Calculates `start_date` and `due_date` based on cumulative `effort_days` from the project `start_date`.
   - Copies `user_story` rows and updates their `milestone_id` FK.
5. Flask returns the newly created project (with milestones) as the API response.
6. React navigates to the new Project Dashboard page.

### 5.3 Phase 3: Weekly Summary Flow

1. User clicks **Generate Weekly Summary** and selects tone (Technical or Executive).
2. React POSTs to `/api/v1/projects/:id/summary` with `{ tone: "executive" }`.
3. Flask queries all updates where `logged_at >= (NOW - 7 days)`, joined with their parent milestones.
4. Flask builds the LLM context: project metadata, milestone statuses, updates grouped by milestone, formatted as structured text.
5. Flask calls the LLM with a system prompt appropriate to the selected tone.
6. LLM returns a 3–4 paragraph summary in plain prose.
7. Flask persists the `summary` row and returns the content.
8. React displays the summary in a modal with **Copy** and **Download** buttons.

---

## 6. UI Screens & Elements

The design language should be clean and minimal — think Linear or Notion — using a **gold-ish / white / gray** palette with clear visual hierarchy.

### Screen 1: Home — Projects Dashboard

- Top navigation bar: Runway logo (left), global search bar (center), notifications bell with unread badge (right), and a **New Project** button.
- Page header: "Your Projects" heading + a secondary button "Browse Scopes Library" linking to the scopes page.
- Project cards grid (3 columns on desktop, 1 on mobile): each card contains the project name, status badge (Active / On Hold), a circular progress ring with the overall completion percentage in the center, a row of team member avatar badges (colored initials circles), a "Next due" label showing the nearest upcoming milestone due date, and a health indicator dot (green / amber / red) in the top-right corner.
- **Empty state** (no projects yet): a centered illustration with the text "Start with an idea" and a prominent "Generate Your First Scope" button.

### Screen 2: New Scope — Idea Input Form

- Full-width centered layout with a 2-column form on desktop (single column on mobile).
- **Left column — main input:** a large "Your Product Idea" textarea (minimum 4 rows), a product name text input above it, and a character counter below.
- **Right column — context (optional):** a "Target Audience" text input, a "Budget Range" segmented button group (Low / Medium / High), and a "Timeline Pressure" segmented button group (ASAP / 1–3 Months / 3–6 Months / Flexible).
- A full-width "Generate Scope" primary button at the bottom.
- **Loading state** replaces the form: a centered spinner with rotating status messages cycling every 2 seconds.

### Screen 3: Scope Results View

- **Header section:** product name as the page title, a "Save as Draft" ghost button, a "Regenerate" icon button, and a prominent "Convert to Project" primary button — all in the top-right.
- **Left panel (70% width):** a vertical list of Epic cards. Each card has a colored left border (each epic gets a unique color from a predefined palette), the epic name as a bold heading, the description as body text, an effort badge (e.g. "5 days"), and a toggle to expand/collapse the user stories. Expanded stories are shown as a list with a checkbox (cosmetic at this stage), story title, and description.
- **Right panel (30% width — sticky sidebar):** a "Suggested Stack" section showing tech badges; a "Timeline" section with the estimated weeks figure; a "Identified Risks" section listing risks as colored chips (red = High, amber = Medium, gray = Low) with descriptions in a tooltip on hover.
- **Inline editing:** any epic title or description becomes an editable input when clicked. A small "Save Edits" button appears in the header when any edits have been made.

### Screen 4: Project Dashboard

- **Two-column layout:** a left sidebar (25% width) for project navigation, and a main content area (75% width).
- **Left sidebar:** project name at the top, a circular progress ring below it, navigation links for Overview / Timeline / Team / Updates / Summaries, and a "Log Update" button pinned at the bottom.
- **Main area — Overview tab:** a row of four stat cards at the top (Total Milestones, Completed, In Progress, Blocked). Below that, the milestone list with each milestone showing its name, assigned team member avatar, status badge, due date, and a horizontal progress bar. Each milestone is clickable to open the detail drawer. A drag handle on the left allows reordering.
- **Main area — Timeline tab:** a simple horizontal bar chart. The X axis is the project date range. Each milestone is a horizontal bar spanning from its `start_date` to `due_date`, colored by status. Hovering shows a tooltip with milestone details.
- **Main area — Team tab:** a table of team members with columns for Name, Role, Avatar, and Milestones Assigned. An "Add Member" button opens an inline form at the bottom of the table.
- **Main area — Updates tab:** a chronological activity feed. Each update is a row with a colored left border (blue = progress, red = blocker, green = completed, gray = note), the milestone name as a linked tag, the update content, the update type badge, and the timestamp.
- **Main area — Summaries tab:** a list of past AI summaries, each showing the generation date, tone, and a "View" button that opens the summary in a modal.

### Screen 5: Milestone Detail Drawer

- Slides in from the right side of the screen without navigating away from the dashboard.
- **Header:** milestone name (editable inline), a close (X) button, and a status dropdown (Not Started / In Progress / Completed / Blocked).
- **Info row:** due date (editable via date picker on click), assigned team member (dropdown to reassign), and progress percentage (segmented: 0% / 25% / 50% / 75% / 100%).
- **User Stories section:** a checklist of all user stories linked to this milestone. Each story has a checkbox (checking it sets `is_completed = true` via API) and the story title. Completed stories show with a strikethrough.
- **Updates section:** all updates logged for this milestone in chronological order, each with type badge, content, and timestamp.
- A compact **Log Update** form pinned to the bottom of the drawer: a type selector and a textarea. Submitting adds the update to the feed immediately via optimistic UI.

### Screen 6: Scopes Library

- A table view of all scopes with columns: Product Name, Idea Summary (truncated to 80 characters), Status badge (Draft / Converted / Archived), Created Date, and an Actions column.
- **Actions column:** for Draft scopes — "View", "Convert to Project", "Archive". For Converted — "View", "View Project". For Archived — "View", "Restore".
- A search/filter bar above the table to filter by status or search by product name.

---

## 7. AI Integration Details

### 7.1 Scope Generation (Structured Output)

The system uses Gemini's structured output mode to ensure consistent, parseable JSON. We use Pydantic-style schemas via the `google-genai` SDK.

```
SYSTEM:
You are an experienced product manager and software architect at a product
development studio. Your job is to take a startup idea and break it into a
structured engineering scope. Always respond with ONLY valid JSON — no markdown,
no code fences, no explanation. Follow this exact schema:

{
  "epics": [
    {
      "name": "string",
      "description": "string",
      "effort_days": number,
      "order_index": number,
      "user_stories": [
        {
          "title": "string",
          "description": "As a [user], I want [action] so that [outcome]",
          "order_index": number
        }
      ]
    }
  ],
  "suggested_stack": ["string"],
  "timeline_weeks": number,
  "risks": [{ "description": "string", "severity": "high|medium|low" }]
}

USER:
Product: {product_name}.
Idea: {idea_text}.
Audience: {target_audience}.
Budget: {budget_range}.
Timeline: {timeline_pressure}.
```

### 7.2 Weekly Summary Prompt

The summary prompt is designed to produce a genuinely useful, specific report rather than a generic AI-sounding one. Context richness is the key.

```
SYSTEM (executive tone):
You are a senior project manager writing a weekly status report for a client.
Write in professional prose, 3–4 paragraphs. Be specific — use actual milestone
names and update content. Cover: overall progress, key accomplishments this week,
current blockers (if any), and recommended next steps. Never use bullet points
in your response — write in full paragraphs only.

USER:
Project: {project_name}.
Description: {description}.
Week of: {week_start}.

Milestone statuses:
{milestone_statuses_formatted}

Updates this week:
{updates_formatted}
```

### 7.3 Error Handling Strategy for LLM Calls

- Wrap every LLM call in a `try/except` block. Catch `google.genai.errors.APIError` and network failures.
- If structured output fails, retry once with an additional corrective message.
- If the second attempt also fails, return a `500` with the message _"AI generation failed — please try again"_.
- Log all LLM inputs and outputs to a local file (`llm_debug.log`) during development.
- Set a **timeout of 30 seconds** on every LLM API call.

---

## 8. Project Folder Structure

```
better-runway/
├── api/
│   └── index.py                     # Vercel serverless entry point
├── backend/
│   ├── app/
│   │   ├── __init__.py              # Flask app factory
│   │   ├── db.py                    # Supabase client initialization
│   │   ├── routes/
│   │   │   ├── __init__.py          # Blueprint registration
│   │   │   ├── scopes.py            # /api/v1/scopes endpoints
│   │   │   ├── projects.py          # /api/v1/projects endpoints
│   │   │   ├── milestones.py        # /api/v1/milestones endpoints
│   │   │   └── search.py            # /api/v1/search endpoint
│   │   ├── services/
│   │   │   ├── __init__.py
│   │   │   ├── llm_service.py       # All Gemini API calls (structured output)
│   │   │   ├── scope_service.py     # Scope generation & conversion logic
│   │   │   └── summary_service.py   # Weekly summary generation logic
│   │   └── utils/
│   │       ├── __init__.py
│   │       ├── prompt_builder.py    # LLM prompt templates
│   │       └── validators.py        # Input validation helpers
│   ├── config.py                    # Config class (Dev / Prod)
│   ├── requirements.txt             # Python dependencies
│   └── run.py                       # Entry point: python run.py
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   ├── api/
│   │   ├── store/
│   │   ├── lib/
│   │   ├── types/
│   │   ├── App.tsx                  # Router setup
│   │   ├── main.tsx                 # Entry point
│   │   └── index.css                # Tailwind v4
│   ├── package.json
│   └── vite.config.ts
│
├── .agent/
│   ├── rules/                       # Antigravity workspace rules
│   └── workflows/
|   |__ skills/               # Antigravity workflows
│
├── vercel.json                      # Vercel deployment config
├── AGENTS.md                        # Root agent instructions
├── runway_product_spec.md           # Product specification
└── README.md
```
