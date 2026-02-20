import { Link } from "react-router";
import type { ProjectCardData } from "@/types";
import { formatDate, getInitials } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ProjectCardProps {
  project: ProjectCardData;
}

const STATUS_LABELS: Record<string, string> = {
  active: "Active",
  on_hold: "On Hold",
  completed: "Completed",
  archived: "Archived",
};

const STATUS_CLASSES: Record<string, string> = {
  active:
    "bg-status-in-progress/10 text-status-in-progress border-status-in-progress/20",
  on_hold: "bg-risk-medium/10 text-risk-medium border-risk-medium/20",
  completed:
    "bg-status-completed/10 text-status-completed border-status-completed/20",
  archived: "bg-surface-dim text-text-tertiary border-border",
};

const HEALTH_COLORS: Record<string, string> = {
  green: "bg-health-green",
  amber: "bg-health-amber",
  red: "bg-health-red",
};

export function ProjectCard({ project }: ProjectCardProps) {
  const circumference = 2 * Math.PI * 28;
  const progressOffset =
    circumference - (project.progress_percent / 100) * circumference;

  const teamMembers = project.team_members ?? [];

  return (
    <TooltipProvider>
      <Link to={`/projects/${project.id}`} className="group block no-underline">
        <Card className="bg-surface border-border hover:shadow-card-hover hover:border-border-strong transition-all duration-200">
          <CardHeader className="p-5 pb-0">
            <div className="flex items-start justify-between">
              <div className="min-w-0 flex-1">
                <CardTitle className="text-base font-heading font-semibold text-text truncate group-hover:text-primary transition-colors">
                  {project.name}
                </CardTitle>
                <Badge
                  variant="outline"
                  className={`mt-1.5 text-[11px] uppercase tracking-wider ${STATUS_CLASSES[project.status]}`}
                >
                  {STATUS_LABELS[project.status]}
                </Badge>
              </div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div
                    className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${HEALTH_COLORS[project.health]} cursor-help`}
                  />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="capitalize">Health: {project.health}</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </CardHeader>

          <CardContent className="p-5 pt-4">
            {/* Progress ring */}
            <div className="flex items-center gap-4 mb-4">
              <div className="relative w-16 h-16 shrink-0">
                <svg
                  width="64"
                  height="64"
                  viewBox="0 0 64 64"
                  className="-rotate-90"
                >
                  <circle
                    cx="32"
                    cy="32"
                    r="28"
                    fill="none"
                    stroke="var(--color-border)"
                    strokeWidth="4"
                  />
                  <circle
                    cx="32"
                    cy="32"
                    r="28"
                    fill="none"
                    stroke="var(--color-primary)"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={progressOffset}
                    className="transition-all duration-500"
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-text">
                  {project.progress_percent}%
                </span>
              </div>
              <div className="text-xs text-text-secondary">
                <div>
                  <span className="font-semibold text-text">
                    {project.completed_milestones}
                  </span>{" "}
                  / {project.milestone_count} milestones
                </div>
                {project.next_due_date && (
                  <div className="mt-1">
                    Next due:{" "}
                    <span className="font-medium text-text">
                      {formatDate(project.next_due_date)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Team avatars */}
            {teamMembers.length > 0 && (
              <div className="flex items-center -space-x-2">
                {teamMembers.slice(0, 5).map((member) => (
                  <Tooltip key={member.id}>
                    <TooltipTrigger asChild>
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white
                          ring-2 ring-surface cursor-help transition-transform hover:-translate-y-0.5 hover:z-10"
                        style={{ backgroundColor: member.avatar_color }}
                      >
                        {getInitials(member.name)}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{member.name}</p>
                    </TooltipContent>
                  </Tooltip>
                ))}
                {teamMembers.length > 5 && (
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-semibold
                    text-text-secondary bg-surface-dim ring-2 ring-surface"
                  >
                    +{teamMembers.length - 5}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </Link>
    </TooltipProvider>
  );
}
