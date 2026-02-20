import { use, Suspense } from "react";
import { Link } from "react-router";
import { fetchProjects } from "@/api/client";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Activity, Plus, Layout } from "lucide-react";

const projectsPromise = fetchProjects();

function ProjectsList() {
  const projects = use(projectsPromise);

  if (projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in">
        <div className="w-16 h-16 rounded-2xl bg-surface border-2 border-dashed border-border flex items-center justify-center mb-6">
          <Activity className="w-8 h-8 text-text-tertiary" />
        </div>
        <h2 className="text-xl font-heading font-bold text-text mb-2">
          No projects yet
        </h2>
        <p className="text-text-secondary max-w-sm mb-8">
          Generate a scope for your product idea to create your first project
          and start tracking progress.
        </p>
        <Button
          asChild
          size="lg"
          className="bg-primary hover:bg-primary-hover text-primary-foreground font-semibold gap-2"
        >
          <Link to="/scopes/new">
            <Plus className="w-5 h-5" />
            Generate Your First Scope
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
      {projects.map((project) => (
        <ProjectCard key={project.id} project={project} />
      ))}
    </div>
  );
}

function ProjectsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <Skeleton key={i} className="h-48 w-full rounded-xl" />
      ))}
    </div>
  );
}

export function HomePage() {
  return (
    <div className="px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Layout className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-text">Projects</h1>
            <p className="text-sm text-text-secondary">
              Track and manage all your active product builds
            </p>
          </div>
        </div>
      </div>

      <Suspense fallback={<ProjectsSkeleton />}>
        <ProjectsList />
      </Suspense>
    </div>
  );
}
