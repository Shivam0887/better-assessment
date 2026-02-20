# Better Runway

Better Runway is an AI-powered project scoping and management tool designed to streamline the product development lifecycle. It leverages the Google Gemini 2.5 Flash model to automatically generate comprehensive project scopes—including epics, user stories, and potential risks—directly from a simple product idea.

![Better Runway Dashboard](/frontend/public/og-image.png)

> **Live Demo:** [better-assessment.vercel.app](https://better-assessment.vercel.app/)

## Key Features

- **AI Scope Generation**: Describe your idea, and Gemini 2.5 Flash generates a structured breakdown of epics, user stories, and development risks.
- **Full Project Management (CRUD)**: Create, read, update, and delete projects, milestones, and user stories.
- **Interactive UI**: Drag-and-drop milestone planning, responsive sidebars, and tabbed project navigation.
- **Mobile-First Design**: Fully responsive layout optimized for all device sizes, featuring a mobile drawer and adaptive data grids.
- **Real-time Status Tracking**: Monitor project health, completion rates, and upcoming deadlines at a glance.

## Tech Stack

This project is built as a monorepo deployed on Vercel, combining a modern React frontend with a robust Python backend.

### Frontend

- **Framework**: React 19 (via Vite)
- **Styling**: Tailwind CSS v4
- **Components**: shadcn/ui (Radix Primitives)
- **Icons**: Lucide React
- **State Management**: Zustand
- **Routing**: React Router v7

### Backend

- **Framework**: Flask (Python 3.12)
- **Database**: Supabase (PostgreSQL)
- **AI Model**: Google Gemini 2.5 Flash (`google-genai` SDK)
- **Deployment**: Vercel Serverless Functions

## Getting Started

### Prerequisites

- Node.js (v18+) & pnpm
- Python (v3.12+)
- Supabase Account

### Environment Variables

Create a `.env` file in the root directory (or separate `.env` files for frontend/backend if preferred for local dev patterns):

```
# Backend
SUPABASE_URL=your_supabase_project_url
SUPABASE_KEY=your_supabase_anon_key
GEMINI_API_KEY=your_google_ai_studio_key
FLASK_ENV=development

# Frontend (Vite auto-loads VITE_ prefixed vars)
VITE_API_URL=http://127.0.0.1:5000/api/v1
```

### Local Development

1.  **Clone the repository**

    ```bash
    git clone https://github.com/yourusername/better-runway.git
    cd better-runway
    ```

2.  **Backend Setup**

    ```bash
    cd backend
    python -m venv venv
    # Windows
    venv\Scripts\activate
    # Mac/Linux
    # source venv/bin/activate

    pip install -r requirements.txt
    python run.py
    ```

    The backend API will run at `http://127.0.0.1:5000`.

3.  **Frontend Setup**
    Open a new terminal:
    ```bash
    cd frontend
    pnpm install
    pnpm dev
    ```
    The frontend will run at `http://localhost:5173`.

## Deployment

The project is configured for seamless deployment on **Vercel**.

1.  **Push to GitHub**.
2.  **Import to Vercel**: Select the repository.
3.  **Configure Build Settings**:
    - **Framework Preset**: Vite
    - **Root Directory**: `frontend` (or utilize the `vercel.json` configuration for monorepo handling).
4.  **Add Environment Variables**: Add `SUPABASE_URL`, `SUPABASE_KEY`, and `GEMINI_API_KEY` in the Vercel dashboard.
5.  **Deploy**: Vercel will automatically build the frontend and deploy the Python backend as serverless functions.

## Project Structure

```
better-runway/
├── api/                 # Vercel Serverless Entry Point
├── backend/             # Flask Application & Services
│   ├── app/
│   │   ├── routes/      # API Endpoints
│   │   ├── services/    # Business Logic (AI, DB)
│   │   └── utils/
├── frontend/            # React Application
│   ├── src/
│   │   ├── components/  # UI Components
│   │   ├── pages/       # Route Views
│   │   ├── store/       # Zustand State
│   │   └── hooks/       # Custom React Hooks
└── vercel.json          # Deployment Configuration
```

## License

This project is open-source and available under the limits of the assessment guidelines.
