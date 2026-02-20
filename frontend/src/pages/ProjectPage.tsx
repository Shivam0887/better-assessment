import { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router";
import {
  fetchProject,
  fetchMilestones,
  fetchTeamMembers,
  fetchProjectUpdates,
  fetchSummaries,
  logUpdate,
  addTeamMember,
  reorderMilestones,
  generateSummary,
  deleteProject,
  updateProject,
  createMilestone,
} from "@/api/client";
import type {
  Project,
  Milestone,
  TeamMember,
  Update,
  Summary,
  MilestoneStatus,
  UpdateType,
  SummaryTone,
  ProjectStatus,
} from "@/types";
import { formatDate, getInitials } from "@/lib/utils";
import { useAppStore } from "@/store";
import { MilestoneDrawer } from "@/components/milestones/MilestoneDrawer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Users,
  History as HistoryIcon,
  FileText,
  Layout,
  Calendar,
  Plus,
  GripVertical,
  Download,
  Copy,
  RotateCw,
  Loader2,
  Check,
  ChevronsUpDown,
  ChevronRight,
  Settings,
  Trash2,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";

type TabId = "overview" | "timeline" | "team" | "updates" | "summaries";

const STATUS_COLORS: Record<MilestoneStatus, string> = {
  not_started: "bg-status-not-started",
  in_progress: "bg-status-in-progress",
  completed: "bg-status-completed",
  blocked: "bg-status-blocked",
};

const STATUS_LABELS: Record<MilestoneStatus, string> = {
  not_started: "Not Started",
  in_progress: "In Progress",
  completed: "Completed",
  blocked: "Blocked",
};

const STATUS_BADGE_CLASSES: Record<MilestoneStatus, string> = {
  not_started:
    "bg-status-not-started/10 text-status-not-started border-status-not-started/20",
  in_progress:
    "bg-status-in-progress/10 text-status-in-progress border-status-in-progress/20",
  completed:
    "bg-status-completed/10 text-status-completed border-status-completed/20",
  blocked: "bg-status-blocked/10 text-status-blocked border-status-blocked/20",
};

const UPDATE_BORDER: Record<UpdateType, string> = {
  progress: "border-l-update-progress",
  blocker: "border-l-update-blocker",
  completed: "border-l-update-completed",
  note: "border-l-update-note",
};

const UPDATE_BADGE: Record<UpdateType, string> = {
  progress: "bg-update-progress/10 text-update-progress",
  blocker: "bg-update-blocker/10 text-update-blocker",
  completed: "bg-update-completed/10 text-update-completed",
  note: "bg-update-note/10 text-update-note",
};

export function ProjectPage() {
  const { id } = useParams<{ id: string }>();
  const { activeMilestoneId, openMilestoneDrawer, closeMilestoneDrawer } =
    useAppStore();

  const [project, setProject] = useState<Project | null>(null);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [updates, setUpdates] = useState<Update[]>([]);
  const [summaries, setSummaries] = useState<Summary[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabId>("overview");

  // Log update form
  const [showLogUpdate, setShowLogUpdate] = useState(false);
  const [logUpdateType, setLogUpdateType] = useState<UpdateType>("progress");
  const [logUpdateContent, setLogUpdateContent] = useState("");
  const [logUpdateMilestone, setLogUpdateMilestone] = useState("");
  const [submittingUpdate, setSubmittingUpdate] = useState(false);

  // Add team member
  const [showAddMember, setShowAddMember] = useState(false);
  const [newMemberName, setNewMemberName] = useState("");
  const [newMemberRole, setNewMemberRole] = useState("");

  // Summary
  const [generatingSummary, setGeneratingSummary] = useState(false);
  const [summaryContent, setSummaryContent] = useState<string | null>(null);
  const [summaryTone, setSummaryTone] = useState<SummaryTone>("executive");

  // Project Settings
  const [updatingProject, setUpdatingProject] = useState(false);

  // Add milestone
  const [showAddMilestone, setShowAddMilestone] = useState(false);
  const [newMilestoneName, setNewMilestoneName] = useState("");
  const [newMilestoneDueDate, setNewMilestoneDueDate] = useState("");
  const [submittingMilestone, setSubmittingMilestone] = useState(false);

  // Drag and drop
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([
      fetchProject(id),
      fetchMilestones(id),
      fetchTeamMembers(id),
      fetchProjectUpdates(id),
      fetchSummaries(id),
    ])
      .then(([proj, ms, tm, ups, sums]) => {
        setProject(proj);
        setMilestones(ms);
        setTeamMembers(tm);
        setUpdates(ups.updates);
        setSummaries(sums);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const overallProgress =
    milestones.length > 0
      ? Math.round(
          milestones.reduce((sum, m) => sum + m.progress_percent, 0) /
            milestones.length,
        )
      : 0;

  const completedCount = milestones.filter(
    (m) => m.status === "completed",
  ).length;
  const inProgressCount = milestones.filter(
    (m) => m.status === "in_progress",
  ).length;
  const blockedCount = milestones.filter((m) => m.status === "blocked").length;

  const handleLogUpdate = useCallback(async () => {
    if (!logUpdateContent.trim() || !logUpdateMilestone) return;
    setSubmittingUpdate(true);
    try {
      const update = await logUpdate(logUpdateMilestone, {
        update_type: logUpdateType,
        content: logUpdateContent,
      });
      setUpdates((prev) => [update, ...prev]);
      setLogUpdateContent("");
      setShowLogUpdate(false);
    } catch {
      // silently fail
    } finally {
      setSubmittingUpdate(false);
    }
  }, [logUpdateContent, logUpdateMilestone, logUpdateType]);

  const handleAddMember = useCallback(async () => {
    if (!id || !newMemberName.trim() || !newMemberRole.trim()) return;
    try {
      const colors = [
        "#2563EB",
        "#7C3AED",
        "#DB2777",
        "#EA580C",
        "#16A34A",
        "#0891B2",
      ];
      const member = await addTeamMember(id, {
        name: newMemberName,
        role: newMemberRole,
        avatar_color: colors[Math.floor(Math.random() * colors.length)],
      });
      setTeamMembers((prev) => [...prev, member]);
      setNewMemberName("");
      setNewMemberRole("");
      setShowAddMember(false);
    } catch {
      // silently fail
    }
  }, [id, newMemberName, newMemberRole]);

  const handleGenerateSummary = useCallback(async () => {
    if (!id) return;
    setGeneratingSummary(true);
    try {
      const summary = await generateSummary(id, { tone: summaryTone });
      setSummaryContent(summary.content);
      setSummaries((prev) => [summary, ...prev]);
    } catch {
      // silently fail
    } finally {
      setGeneratingSummary(false);
    }
  }, [id, summaryTone]);

  const handleUpdateStatus = useCallback(
    async (status: ProjectStatus) => {
      if (!id || !project) return;
      setUpdatingProject(true);
      try {
        const updated = await updateProject(id, { status });
        setProject(updated);
      } catch (err) {
        console.error("Failed to update status:", err);
      } finally {
        setUpdatingProject(false);
      }
    },
    [id, project],
  );

  const handleDeleteProject = useCallback(async () => {
    if (
      !id ||
      !confirm(
        "Are you sure you want to delete this project? This action cannot be undone.",
      )
    )
      return;
    try {
      await deleteProject(id);
      window.location.href = "/";
    } catch (err) {
      console.error("Failed to delete project:", err);
    }
  }, [id]);

  const handleAddMilestone = useCallback(async () => {
    if (!id || !newMilestoneName.trim() || !newMilestoneDueDate) return;
    setSubmittingMilestone(true);
    try {
      const ms = await createMilestone(id, {
        name: newMilestoneName,
        due_date: newMilestoneDueDate,
      });
      setMilestones((prev) => [...prev, ms]);
      setNewMilestoneName("");
      setNewMilestoneDueDate("");
      setShowAddMilestone(false);
    } catch (err) {
      console.error("Failed to add milestone:", err);
    } finally {
      setSubmittingMilestone(false);
    }
  }, [id, newMilestoneName, newMilestoneDueDate]);

  const handleDragStart = useCallback((index: number) => {
    setDraggedIndex(index);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleDrop = useCallback(
    (targetIndex: number) => {
      if (draggedIndex === null || draggedIndex === targetIndex || !id) return;
      const newMilestones = [...milestones];
      const [dragged] = newMilestones.splice(draggedIndex, 1);
      newMilestones.splice(targetIndex, 0, dragged);
      const ordered = newMilestones.map((m, i) => ({ ...m, order_index: i }));
      setMilestones(ordered);
      setDraggedIndex(null);
      reorderMilestones(
        id,
        ordered.map((m) => ({ id: m.id, order_index: m.order_index })),
      ).catch(() => {});
    },
    [draggedIndex, milestones, id],
  );

  if (loading) {
    return (
      <div className="px-6 py-8">
        <Skeleton className="h-8 w-48 mb-4" />
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <p className="text-text-secondary">Project not found</p>
      </div>
    );
  }

  const TABS: { id: TabId; label: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "timeline", label: "Timeline" },
    { id: "team", label: "Team" },
    { id: "updates", label: "Updates" },
    { id: "summaries", label: "Summaries" },
  ];

  return (
    <TooltipProvider>
      <div className="flex flex-col animate-fade-in p-6">
        {/* ─── Breadcrumbs & Header ─── */}
        <div className="flex flex-col gap-4 mb-8">
          <nav className="flex items-center gap-2 text-xs font-medium text-text-tertiary">
            <Link
              to="/"
              className="hover:text-text transition-colors no-underline"
            >
              Projects
            </Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-text-secondary">{project.name}</span>
          </nav>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="relative w-16 h-16 shrink-0">
                <svg
                  width="64"
                  height="64"
                  viewBox="0 0 96 96"
                  className="-rotate-90"
                >
                  <circle
                    cx="48"
                    cy="48"
                    r="40"
                    fill="none"
                    stroke="var(--color-border)"
                    strokeWidth="8"
                  />
                  <circle
                    cx="48"
                    cy="48"
                    r="40"
                    fill="none"
                    stroke="var(--color-primary)"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 40}
                    strokeDashoffset={
                      2 * Math.PI * 40 -
                      (overallProgress / 100) * (2 * Math.PI * 40)
                    }
                    className="transition-all duration-700"
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-text">
                  {overallProgress}%
                </span>
              </div>
              <div>
                <h1 className="text-2xl font-heading font-bold text-text">
                  {project.name}
                </h1>
                <p className="text-sm text-text-secondary flex items-center gap-2 mt-1">
                  <Badge
                    variant="outline"
                    className="bg-primary/5 text-primary border-primary/10"
                  >
                    Active Project
                  </Badge>
                  <span>•</span>
                  <span>{milestones.length} Milestones</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="icon" className="h-10 w-10">
                    <Settings className="w-4 h-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  align="end"
                  className="w-56 bg-surface border-border p-3"
                >
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-2">
                        Project Status
                      </p>
                      <div className="space-y-1">
                        {(
                          ["active", "on_hold", "completed"] as ProjectStatus[]
                        ).map((status) => (
                          <Button
                            key={status}
                            variant="ghost"
                            size="sm"
                            disabled={updatingProject}
                            onClick={() => handleUpdateStatus(status)}
                            className={cn(
                              "w-full justify-start text-xs capitalize gap-2",
                              project.status === status
                                ? "bg-primary/10 text-primary"
                                : "text-text-secondary",
                            )}
                          >
                            <div
                              className={cn(
                                "w-2 h-2 rounded-full",
                                status === "active"
                                  ? "bg-status-in-progress"
                                  : status === "on_hold"
                                    ? "bg-status-blocked"
                                    : "bg-status-completed",
                              )}
                            />
                            {status.replace("_", " ")}
                            {project.status === status && (
                              <Check className="w-3 h-3 ml-auto" />
                            )}
                          </Button>
                        ))}
                      </div>
                    </div>
                    <Separator />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleDeleteProject}
                      className="w-full justify-start text-xs text-risk-high hover:text-risk-high hover:bg-risk-high/10 gap-2"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete Project
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>

              <Button
                onClick={() => setShowLogUpdate(true)}
                className="bg-primary hover:bg-primary-hover text-primary-foreground font-semibold gap-2"
              >
                <Plus className="w-4 h-4" />
                Log Update
              </Button>
            </div>
          </div>
        </div>

        {/* ─── Tabs Navigation ─── */}
        <div className="border-b border-border mb-6 overflow-x-auto">
          <nav className="flex gap-8 min-w-max">
            {TABS.map((tab) => {
              const Icon = {
                overview: Layout,
                timeline: Calendar,
                team: Users,
                updates: HistoryIcon,
                summaries: FileText,
              }[tab.id];

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 pb-4 text-sm font-medium transition-all relative no-underline
                    ${
                      activeTab === tab.id
                        ? "text-primary border-b-2 border-primary"
                        : "text-text-secondary hover:text-text"
                    }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                  {tab.id === "updates" && updates.length > 0 && (
                    <span className="bg-primary/10 text-primary text-[10px] px-1.5 py-0.5 rounded-full">
                      {updates.length}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* ─── Tab Content ─── */}
        <div className="min-w-0">
          {/* Overview Tab */}
          {activeTab === "overview" && (
            <div className="animate-slide-in-up">
              {/* Stat Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {[
                  {
                    label: "Total Milestones",
                    value: milestones.length,
                    color: "text-text",
                    description: "Total number of milestones in this project",
                  },
                  {
                    label: "Completed",
                    value: completedCount,
                    color: "text-status-completed",
                    description: "Milestones that have been fully delivered",
                  },
                  {
                    label: "In Progress",
                    value: inProgressCount,
                    color: "text-status-in-progress",
                    description: "Milestones currently being worked on",
                  },
                  {
                    label: "Blocked",
                    value: blockedCount,
                    color: "text-status-blocked",
                    description: "Milestones that are currently stalled",
                  },
                ].map((stat) => (
                  <Tooltip key={stat.label}>
                    <TooltipTrigger asChild>
                      <Card className="bg-surface border-border cursor-help">
                        <CardContent className="p-4">
                          <p className="text-xs text-text-tertiary font-medium uppercase tracking-wider">
                            {stat.label}
                          </p>
                          <p
                            className={`text-2xl font-heading font-bold mt-1 ${stat.color}`}
                          >
                            {stat.value}
                          </p>
                        </CardContent>
                      </Card>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{stat.description}</p>
                    </TooltipContent>
                  </Tooltip>
                ))}
              </div>

              {/* Milestone List */}
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider">
                  Milestones
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAddMilestone(true)}
                  className="text-primary hover:text-primary-hover gap-1.5 h-8 px-2"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Milestone
                </Button>
              </div>
              <div className="space-y-2">
                {milestones
                  .sort((a, b) => a.order_index - b.order_index)
                  .map((milestone, index) => {
                    const assignedMember = teamMembers.find(
                      (m) => m.id === milestone.assigned_to,
                    );
                    return (
                      <Card
                        key={milestone.id}
                        draggable
                        onDragStart={() => handleDragStart(index)}
                        onDragOver={handleDragOver}
                        onDrop={() => handleDrop(index)}
                        onClick={() => openMilestoneDrawer(milestone.id)}
                        className={`bg-surface border-border cursor-pointer hover:shadow-card hover:border-border-strong transition-all ${draggedIndex === index ? "opacity-50" : ""}`}
                      >
                        <CardContent className="p-4 flex items-center gap-4">
                          {/* Drag handle */}
                          <div className="cursor-grab text-text-tertiary hover:text-text-secondary">
                            <GripVertical className="w-4 h-4" />
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h4 className="text-sm font-semibold text-text truncate">
                                {milestone.name}
                              </h4>
                              <Badge
                                variant="outline"
                                className={`text-[10px] uppercase tracking-wider ${STATUS_BADGE_CLASSES[milestone.status]}`}
                              >
                                {STATUS_LABELS[milestone.status]}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-3 mt-1.5">
                              {assignedMember && (
                                <div className="flex items-center gap-1.5">
                                  <div
                                    className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold text-white"
                                    style={{
                                      backgroundColor:
                                        assignedMember.avatar_color,
                                    }}
                                  >
                                    {getInitials(assignedMember.name)}
                                  </div>
                                  <span className="text-xs text-text-secondary">
                                    {assignedMember.name}
                                  </span>
                                </div>
                              )}
                              <span className="text-xs text-text-tertiary">
                                Due {formatDate(milestone.due_date)}
                              </span>
                            </div>
                          </div>

                          {/* Progress bar */}
                          <div className="w-24 shrink-0">
                            <div className="flex items-center justify-between text-xs text-text-secondary mb-1">
                              <span>{milestone.progress_percent}%</span>
                            </div>
                            <div className="h-1.5 bg-border rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-500 ${STATUS_COLORS[milestone.status]}`}
                                style={{
                                  width: `${milestone.progress_percent}%`,
                                }}
                              />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
              </div>
            </div>
          )}

          {/* Timeline Tab */}
          {activeTab === "timeline" && (
            <div>
              <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-4">
                Project Timeline
              </h3>
              {milestones.length > 0 ? (
                <Card className="bg-surface border-border">
                  <CardContent className="p-6">
                    {(() => {
                      const allDates = milestones.flatMap((m) => [
                        new Date(m.start_date).getTime(),
                        new Date(m.due_date).getTime(),
                      ]);
                      const minDate = Math.min(...allDates);
                      const maxDate = Math.max(...allDates);
                      const range = maxDate - minDate || 1;

                      return (
                        <div className="space-y-3">
                          {milestones
                            .sort((a, b) => a.order_index - b.order_index)
                            .map((m) => {
                              const startPct =
                                ((new Date(m.start_date).getTime() - minDate) /
                                  range) *
                                100;
                              const widthPct = Math.max(
                                ((new Date(m.due_date).getTime() -
                                  new Date(m.start_date).getTime()) /
                                  range) *
                                  100,
                                3,
                              );
                              return (
                                <div
                                  key={m.id}
                                  className="flex items-center gap-3"
                                >
                                  <span className="w-32 text-xs text-text-secondary truncate shrink-0">
                                    {m.name}
                                  </span>
                                  <div className="flex-1 h-7 bg-surface-dim rounded relative">
                                    <div
                                      className={`absolute top-0 h-7 rounded flex items-center px-2 text-[10px] text-white font-semibold ${STATUS_COLORS[m.status]} transition-all`}
                                      style={{
                                        left: `${startPct}%`,
                                        width: `${widthPct}%`,
                                        minWidth: "2rem",
                                      }}
                                      title={`${formatDate(m.start_date)} → ${formatDate(m.due_date)}`}
                                    >
                                      {m.progress_percent}%
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                      );
                    })()}
                  </CardContent>
                </Card>
              ) : (
                <p className="text-sm text-text-tertiary">No milestones yet.</p>
              )}
            </div>
          )}

          {/* Team Tab */}
          {activeTab === "team" && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider">
                  Team Members
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAddMember(!showAddMember)}
                  className="text-primary hover:text-primary-hover gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  Add Member
                </Button>
              </div>

              <Card className="bg-surface border-border overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-surface-dim">
                      <th className="text-left px-4 py-3 text-xs font-semibold text-text-tertiary uppercase tracking-wider">
                        Name
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-text-tertiary uppercase tracking-wider">
                        Role
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-text-tertiary uppercase tracking-wider">
                        Milestones
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {teamMembers.map((member) => (
                      <tr
                        key={member.id}
                        className="border-b border-border last:border-b-0 hover:bg-surface-dim/50"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <div
                              className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                              style={{ backgroundColor: member.avatar_color }}
                            >
                              {getInitials(member.name)}
                            </div>
                            <span className="font-medium text-text">
                              {member.name}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-text-secondary">
                          {member.role}
                        </td>
                        <td className="px-4 py-3 text-text-secondary">
                          {
                            milestones.filter(
                              (m) => m.assigned_to === member.id,
                            ).length
                          }
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Add member form */}
                {showAddMember && (
                  <div className="p-4 border-t border-border bg-surface-dim">
                    <div className="flex gap-3">
                      <Input
                        type="text"
                        placeholder="Name"
                        value={newMemberName}
                        onChange={(e) => setNewMemberName(e.target.value)}
                        className="flex-1 bg-surface border-border focus-visible:ring-primary/30"
                      />
                      <Input
                        type="text"
                        placeholder="Role"
                        value={newMemberRole}
                        onChange={(e) => setNewMemberRole(e.target.value)}
                        className="flex-1 bg-surface border-border focus-visible:ring-primary/30"
                      />
                      <Button
                        onClick={handleAddMember}
                        className="bg-primary hover:bg-primary-hover text-primary-foreground font-semibold"
                      >
                        Add
                      </Button>
                    </div>
                  </div>
                )}
              </Card>

              {teamMembers.length === 0 && !showAddMember && (
                <div className="text-center py-12 text-sm text-text-tertiary">
                  No team members yet. Add your first team member to get
                  started.
                </div>
              )}
            </div>
          )}

          {/* Updates Tab */}
          {activeTab === "updates" && (
            <div>
              <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-4">
                Activity Feed
              </h3>
              {updates.length > 0 ? (
                <div className="space-y-2">
                  {updates.map((update) => (
                    <Card
                      key={update.id}
                      className={`bg-surface border-border border-l-4 ${UPDATE_BORDER[update.update_type]}`}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-1.5">
                          {update.milestone_name && (
                            <Badge
                              variant="outline"
                              className="text-xs text-primary bg-primary/5 border-primary/15"
                            >
                              {update.milestone_name}
                            </Badge>
                          )}
                          <Badge
                            variant="outline"
                            className={`text-[10px] uppercase tracking-wider ${UPDATE_BADGE[update.update_type]}`}
                          >
                            {update.update_type}
                          </Badge>
                          <span className="text-xs text-text-tertiary ml-auto">
                            {formatDate(update.logged_at)}
                          </span>
                        </div>
                        <p className="text-sm text-text">{update.content}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-sm text-text-tertiary">
                  No updates yet. Log your first update to start tracking
                  progress.
                </div>
              )}
            </div>
          )}

          {/* Summaries Tab */}
          {activeTab === "summaries" && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider">
                  AI Summaries
                </h3>
                <div className="flex items-center gap-3">
                  <div className="flex gap-1 bg-surface-dim rounded-lg p-0.5 border border-border">
                    {(["technical", "executive"] as const).map((tone) => (
                      <Button
                        key={tone}
                        variant="ghost"
                        size="sm"
                        onClick={() => setSummaryTone(tone)}
                        className={`text-xs capitalize h-8 ${summaryTone === tone ? "bg-surface shadow text-text" : "text-text-secondary"}`}
                      >
                        {tone}
                      </Button>
                    ))}
                  </div>
                  <Button
                    onClick={handleGenerateSummary}
                    disabled={generatingSummary}
                    className="bg-primary hover:bg-primary-hover text-primary-foreground font-semibold gap-2"
                  >
                    {generatingSummary ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Generating…
                      </>
                    ) : (
                      <>
                        <RotateCw className="w-4 h-4" />
                        Generate Weekly Summary
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Generated summary card */}
              {summaryContent && (
                <Card className="bg-surface border-border mb-6">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-heading font-semibold text-text">
                        Generated Summary
                      </h4>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            navigator.clipboard.writeText(summaryContent)
                          }
                          className="gap-2"
                        >
                          <Copy className="w-4 h-4" />
                          Copy
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const blob = new Blob([summaryContent], {
                              type: "text/plain",
                            });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement("a");
                            a.href = url;
                            a.download = `summary-${new Date().toISOString().split("T")[0]}.txt`;
                            a.click();
                            URL.revokeObjectURL(url);
                          }}
                          className="gap-2"
                        >
                          <Download className="w-4 h-4" />
                          Download
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSummaryContent(null)}
                        >
                          Close
                        </Button>
                      </div>
                    </div>
                    <Separator className="mb-4" />
                    <div className="prose prose-sm max-w-none text-text-secondary whitespace-pre-wrap">
                      {summaryContent}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Past summaries */}
              {summaries.length > 0 ? (
                <div className="space-y-2">
                  {summaries.map((summary) => (
                    <Card key={summary.id} className="bg-surface border-border">
                      <CardContent className="p-4 flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-text">
                            Week of {formatDate(summary.week_start)}
                          </p>
                          <p className="text-xs text-text-tertiary mt-0.5 capitalize">
                            {summary.tone} tone
                          </p>
                        </div>
                        <Button
                          variant="link"
                          size="sm"
                          onClick={() => setSummaryContent(summary.content)}
                          className="text-primary"
                        >
                          View
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-sm text-text-tertiary">
                  No summaries generated yet.
                </div>
              )}
            </div>
          )}
        </div>

        {/* ─── Add Milestone Dialog ─── */}
        <Dialog open={showAddMilestone} onOpenChange={setShowAddMilestone}>
          <DialogContent className="bg-surface border-border">
            <DialogHeader>
              <DialogTitle className="font-heading">Add Milestone</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text mb-1.5">
                  Milestone Name
                </label>
                <Input
                  value={newMilestoneName}
                  onChange={(e) => setNewMilestoneName(e.target.value)}
                  placeholder="e.g. Design Discovery"
                  className="bg-surface border-border focus-visible:ring-primary/30"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text mb-1.5">
                  Due Date
                </label>
                <Input
                  type="date"
                  value={newMilestoneDueDate}
                  onChange={(e) => setNewMilestoneDueDate(e.target.value)}
                  className="bg-surface border-border focus-visible:ring-primary/30"
                />
              </div>
            </div>
            <DialogFooter className="gap-3 sm:gap-3">
              <Button
                variant="outline"
                onClick={() => setShowAddMilestone(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddMilestone}
                disabled={
                  submittingMilestone ||
                  !newMilestoneName.trim() ||
                  !newMilestoneDueDate
                }
                className="flex-1 bg-primary hover:bg-primary-hover text-primary-foreground font-semibold"
              >
                {submittingMilestone ? "Adding…" : "Add Milestone"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ─── Log Update Dialog ─── */}
        <Dialog open={showLogUpdate} onOpenChange={setShowLogUpdate}>
          <DialogContent className="bg-surface border-border">
            <DialogHeader>
              <DialogTitle className="font-heading">Log Update</DialogTitle>
            </DialogHeader>

            <div>
              <label className="block text-sm font-medium text-text mb-1.5">
                Milestone
              </label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    className={cn(
                      "w-full justify-between font-normal bg-surface border-border",
                      !logUpdateMilestone && "text-text-tertiary",
                    )}
                  >
                    {logUpdateMilestone
                      ? milestones.find((m) => m.id === logUpdateMilestone)
                          ?.name
                      : "Select a milestone"}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0 bg-surface border-border">
                  <Command className="bg-surface">
                    <CommandInput
                      placeholder="Search milestone..."
                      className="h-9"
                    />
                    <CommandList>
                      <CommandEmpty>No milestone found.</CommandEmpty>
                      <CommandGroup>
                        {milestones.map((m) => (
                          <CommandItem
                            key={m.id}
                            value={m.name}
                            onSelect={() => {
                              setLogUpdateMilestone(m.id);
                            }}
                            className="text-text hover:bg-surface-dim cursor-pointer"
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                logUpdateMilestone === m.id
                                  ? "opacity-100"
                                  : "opacity-0",
                              )}
                            />
                            {m.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            {/* Update type */}
            <div>
              <label className="block text-sm font-medium text-text mb-1.5">
                Type
              </label>
              <div className="flex gap-2">
                {(["progress", "blocker", "completed", "note"] as const).map(
                  (type) => (
                    <Button
                      key={type}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setLogUpdateType(type)}
                      className={`flex-1 capitalize ${
                        logUpdateType === type
                          ? `${UPDATE_BADGE[type]} border-current`
                          : "bg-surface border-border text-text-secondary hover:border-border-strong"
                      }`}
                    >
                      {type}
                    </Button>
                  ),
                )}
              </div>
            </div>

            {/* Content */}
            <div>
              <label className="block text-sm font-medium text-text mb-1.5">
                Content
              </label>
              <Textarea
                value={logUpdateContent}
                onChange={(e) => setLogUpdateContent(e.target.value)}
                rows={3}
                placeholder="What's the update?"
                className="bg-surface border-border focus-visible:ring-primary/30 resize-none"
              />
            </div>

            <DialogFooter className="gap-3 sm:gap-3">
              <Button
                variant="outline"
                onClick={() => setShowLogUpdate(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleLogUpdate}
                disabled={
                  submittingUpdate ||
                  !logUpdateMilestone ||
                  !logUpdateContent.trim()
                }
                className="flex-1 bg-primary hover:bg-primary-hover text-primary-foreground font-semibold"
              >
                {submittingUpdate ? "Submitting…" : "Log Update"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ─── Milestone Detail Drawer ─── */}
        {activeMilestoneId && (
          <MilestoneDrawer
            milestoneId={activeMilestoneId}
            teamMembers={teamMembers}
            onClose={closeMilestoneDrawer}
            onUpdate={() => {
              // Refresh milestones and updates
              if (id) {
                fetchMilestones(id)
                  .then(setMilestones)
                  .catch(() => {});
                fetchProjectUpdates(id)
                  .then((r) => setUpdates(r.updates))
                  .catch(() => {});
              }
            }}
          />
        )}
      </div>
    </TooltipProvider>
  );
}
