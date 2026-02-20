import { useState, useEffect, useCallback } from "react";
import {
  fetchMilestone,
  updateMilestone,
  logUpdate,
  updateUserStory,
  deleteMilestone,
  createUserStory,
  deleteUserStory,
} from "@/api/client";
import type { Milestone, TeamMember, UpdateType } from "@/types";
import { formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Calendar,
  User,
  Activity,
  CheckCircle2,
  History,
  Loader2,
  Check,
  ChevronsUpDown,
  Plus,
  Trash2,
  X,
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

interface MilestoneDrawerProps {
  milestoneId: string;
  teamMembers: TeamMember[];
  onClose: () => void;
  onUpdate: () => void;
}

const STATUS_OPTIONS: { value: Milestone["status"]; label: string }[] = [
  { value: "not_started", label: "Not Started" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
  { value: "blocked", label: "Blocked" },
];

const PROGRESS_OPTIONS = [0, 25, 50, 75, 100];

const UPDATE_BADGE: Record<UpdateType, string> = {
  progress: "bg-update-progress/10 text-update-progress",
  blocker: "bg-update-blocker/10 text-update-blocker",
  completed: "bg-update-completed/10 text-update-completed",
  note: "bg-update-note/10 text-update-note",
};

export function MilestoneDrawer({
  milestoneId,
  teamMembers,
  onClose,
  onUpdate,
}: MilestoneDrawerProps) {
  const [milestone, setMilestone] = useState<Milestone | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState("");
  const [updateType, setUpdateType] = useState<UpdateType>("progress");
  const [updateContent, setUpdateContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);

  // User Story CRUD
  const [showAddStory, setShowAddStory] = useState(false);
  const [newStoryTitle, setNewStoryTitle] = useState("");
  const [submittingStory, setSubmittingStory] = useState(false);
  const [deletingStoryIds, setDeletingStoryIds] = useState<Set<string>>(
    new Set(),
  );

  // Milestone Deletion
  const [isDeletingMilestone, setIsDeletingMilestone] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetchMilestone(milestoneId)
      .then((m) => {
        setMilestone(m);
        setNameValue(m.name);
      })
      .catch(() => setMilestone(null))
      .finally(() => setLoading(false));
  }, [milestoneId]);

  const handleStatusChange = useCallback(
    async (status: Milestone["status"]) => {
      if (!milestone) return;
      setStatusUpdating(true);
      try {
        const u = await updateMilestone(milestone.id, { status });
        setMilestone(u);
        onUpdate();
      } catch {
        /* */
      } finally {
        setStatusUpdating(false);
      }
    },
    [milestone, onUpdate],
  );

  const handleProgressChange = useCallback(
    async (p: number) => {
      if (!milestone) return;
      try {
        const u = await updateMilestone(milestone.id, { progress_percent: p });
        setMilestone(u);
        onUpdate();
      } catch {
        /* */
      }
    },
    [milestone, onUpdate],
  );

  const handleAssignChange = useCallback(
    async (memberId: string) => {
      if (!milestone) return;
      try {
        const u = await updateMilestone(milestone.id, {
          assigned_to: memberId || null,
        });
        setMilestone(u);
        onUpdate();
      } catch {
        /* */
      }
    },
    [milestone, onUpdate],
  );

  const handleNameSave = useCallback(async () => {
    if (!milestone || !nameValue.trim()) return;
    setEditingName(false);
    try {
      const u = await updateMilestone(milestone.id, { name: nameValue.trim() });
      setMilestone(u);
      onUpdate();
    } catch {
      /* */
    }
  }, [milestone, nameValue, onUpdate]);

  const handleDeleteMilestone = async () => {
    if (
      !confirm(
        "Are you sure you want to delete this milestone? This action cannot be undone.",
      )
    )
      return;
    setIsDeletingMilestone(true);
    try {
      await deleteMilestone(milestoneId);
      onClose();
      onUpdate();
    } catch (err) {
      console.error("Failed to delete milestone:", err);
    } finally {
      setIsDeletingMilestone(false);
    }
  };

  const handleCreateStory = async () => {
    if (!newStoryTitle.trim()) return;
    setSubmittingStory(true);
    try {
      const story = await createUserStory(milestoneId, {
        title: newStoryTitle,
      });
      if (milestone) {
        setMilestone({
          ...milestone,
          user_stories: [...(milestone.user_stories || []), story],
        });
      }
      setNewStoryTitle("");
      setShowAddStory(false);
      onUpdate();
    } catch (err) {
      console.error("Failed to create story:", err);
    } finally {
      setSubmittingStory(false);
    }
  };

  const handleDeleteStory = async (storyId: string) => {
    if (!confirm("Delete this user story?")) return;
    setDeletingStoryIds((prev) => new Set(prev).add(storyId));
    try {
      await deleteUserStory(storyId);
      if (milestone) {
        setMilestone({
          ...milestone,
          user_stories: milestone.user_stories?.filter((s) => s.id !== storyId),
        });
      }
      onUpdate();
    } catch (err) {
      console.error("Failed to delete story:", err);
    } finally {
      setDeletingStoryIds((prev) => {
        const next = new Set(prev);
        next.delete(storyId);
        return next;
      });
    }
  };

  const handleToggleStory = useCallback(
    async (storyId: string, completed: boolean) => {
      try {
        await updateUserStory(storyId, { is_completed: completed });
        setMilestone((prev) =>
          prev
            ? {
                ...prev,
                user_stories: prev.user_stories?.map((s) =>
                  s.id === storyId ? { ...s, is_completed: completed } : s,
                ),
              }
            : prev,
        );
      } catch {
        /* */
      }
    },
    [],
  );

  const handleLogUpdate = useCallback(async () => {
    if (!milestone || !updateContent.trim()) return;
    setSubmitting(true);
    try {
      const upd = await logUpdate(milestone.id, {
        update_type: updateType,
        content: updateContent,
      });
      setMilestone((prev) =>
        prev ? { ...prev, updates: [upd, ...(prev.updates ?? [])] } : prev,
      );
      setUpdateContent("");
      onUpdate();
    } catch {
      /* */
    } finally {
      setSubmitting(false);
    }
  }, [milestone, updateType, updateContent, onUpdate]);

  return (
    <Sheet open onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full sm:max-w-md bg-surface border-l border-border p-0 flex flex-col">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : !milestone ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-text-secondary">Milestone not found</p>
          </div>
        ) : (
          <>
            {/* Header */}
            <SheetHeader className="px-4 sm:px-6 py-4 border-b border-border space-y-0 relative">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pr-8">
                <div className="flex-1 min-w-0">
                  {editingName ? (
                    <input
                      type="text"
                      value={nameValue}
                      onChange={(e) => setNameValue(e.target.value)}
                      onBlur={handleNameSave}
                      onKeyDown={(e) => e.key === "Enter" && handleNameSave()}
                      className="w-full text-base sm:text-lg font-heading font-bold text-text bg-transparent border-b-2 border-primary focus:outline-none"
                      autoFocus
                    />
                  ) : (
                    <SheetTitle
                      className="text-base sm:text-lg font-heading font-bold text-text truncate cursor-pointer hover:text-primary transition-colors text-left"
                      onClick={() => setEditingName(true)}
                    >
                      {milestone.name}
                    </SheetTitle>
                  )}
                </div>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      role="combobox"
                      className="h-8 px-2 text-[11px] sm:text-xs font-semibold bg-surface border-border gap-2 w-full sm:w-auto justify-between sm:justify-center"
                      disabled={statusUpdating}
                    >
                      <span className="truncate">
                        {
                          STATUS_OPTIONS.find(
                            (opt) => opt.value === milestone.status,
                          )?.label
                        }
                      </span>
                      {statusUpdating ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <ChevronsUpDown className="h-3 w-3 opacity-50 shrink-0" />
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[150px] p-0 bg-surface border-border">
                    <Command className="bg-surface">
                      <CommandList>
                        <CommandGroup>
                          {STATUS_OPTIONS.map((opt) => (
                            <CommandItem
                              key={opt.value}
                              value={opt.value}
                              onSelect={() =>
                                handleStatusChange(
                                  opt.value as Milestone["status"],
                                )
                              }
                              className="text-xs text-text hover:bg-surface-dim cursor-pointer"
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-3 w-3",
                                  milestone.status === opt.value
                                    ? "opacity-100"
                                    : "opacity-0",
                                )}
                              />
                              {opt.label}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
              <div className="absolute top-4 right-4 flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  disabled={isDeletingMilestone}
                  onClick={handleDeleteMilestone}
                  className="w-8 h-8 text-text-tertiary hover:text-risk-high hover:bg-risk-high/10"
                >
                  {isDeletingMilestone ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-8 h-8 text-text-tertiary hover:text-text hover:bg-surface-dim"
                  onClick={onClose}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </SheetHeader>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto no-scrollbar">
              {/* Info row */}
              <div className="px-4 sm:px-6 py-4 border-b border-border grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-4">
                <div className="flex sm:block items-center justify-between gap-4">
                  <div className="flex items-center gap-1.5 sm:mb-1.5">
                    <Calendar className="w-3.5 h-3.5 text-text-tertiary" />
                    <p className="text-[10px] uppercase tracking-wider text-text-tertiary font-bold">
                      Due Date
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-text">
                    {formatDate(milestone.due_date)}
                  </p>
                </div>
                <div className="flex sm:block items-center justify-between gap-4">
                  <div className="flex items-center gap-1.5 sm:mb-1.5">
                    <User className="w-3.5 h-3.5 text-text-tertiary" />
                    <p className="text-[10px] uppercase tracking-wider text-text-tertiary font-bold">
                      Assigned To
                    </p>
                  </div>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="p-0 h-auto text-sm font-semibold text-text hover:bg-transparent justify-end sm:justify-start"
                      >
                        {milestone.assigned_to
                          ? teamMembers.find(
                              (m) => m.id === milestone.assigned_to,
                            )?.name
                          : "Unassigned"}
                        <ChevronsUpDown className="ml-1.5 h-3 w-3 opacity-50 shrink-0" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[200px] p-0 bg-surface border-border">
                      <Command className="bg-surface">
                        <CommandInput
                          placeholder="Search member..."
                          className="h-9"
                        />
                        <CommandList>
                          <CommandEmpty>No member found.</CommandEmpty>
                          <CommandGroup>
                            <CommandItem
                              onSelect={() => handleAssignChange("")}
                              className="text-sm text-text hover:bg-surface-dim cursor-pointer"
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  !milestone.assigned_to
                                    ? "opacity-100"
                                    : "opacity-0",
                                )}
                              />
                              Unassigned
                            </CommandItem>
                            {teamMembers.map((m) => (
                              <CommandItem
                                key={m.id}
                                value={m.name}
                                onSelect={() => handleAssignChange(m.id)}
                                className="text-sm text-text hover:bg-surface-dim cursor-pointer"
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    milestone.assigned_to === m.id
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
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-text-tertiary" />
                    <p className="text-[10px] uppercase tracking-wider text-text-tertiary font-bold">
                      Progress
                    </p>
                  </div>
                  <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
                    {PROGRESS_OPTIONS.map((p) => (
                      <Button
                        key={p}
                        variant="ghost"
                        size="sm"
                        onClick={() => handleProgressChange(p)}
                        className={`min-w-[40px] flex-1 h-7 px-0 text-[10px] font-bold rounded-md transition-all ${milestone.progress_percent === p ? "bg-primary text-primary-foreground shadow-sm" : "bg-surface-dim text-text-secondary hover:bg-border"}`}
                      >
                        {p}%
                      </Button>
                    ))}
                  </div>
                </div>
              </div>

              {/* User Stories */}
              <div className="px-6 py-4 border-b border-border">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-text-tertiary" />
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-text-tertiary">
                      User Stories (
                      {
                        milestone.user_stories?.filter((s) => s.is_completed)
                          .length
                      }
                      /{milestone.user_stories?.length || 0})
                    </h3>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-7 h-7 text-text-tertiary hover:text-text hover:bg-surface-dim"
                    onClick={() => setShowAddStory(!showAddStory)}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                {showAddStory && (
                  <div className="flex gap-2 mb-4">
                    <Textarea
                      value={newStoryTitle}
                      onChange={(e) => setNewStoryTitle(e.target.value)}
                      placeholder="Add a new user story…"
                      rows={1}
                      className="flex-1 bg-surface border-border focus-visible:ring-primary/30 resize-none"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleCreateStory();
                        }
                      }}
                    />
                    <Button
                      onClick={handleCreateStory}
                      disabled={submittingStory || !newStoryTitle.trim()}
                      className="bg-primary hover:bg-primary-hover text-primary-foreground font-semibold"
                    >
                      {submittingStory ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        "Add"
                      )}
                    </Button>
                  </div>
                )}
                {milestone.user_stories && milestone.user_stories.length > 0 ? (
                  <div className="space-y-3">
                    {milestone.user_stories
                      .sort((a, b) => a.order_index - b.order_index)
                      .map((story) => (
                        <div
                          key={story.id}
                          className="flex items-start justify-between gap-3 group"
                        >
                          <div className="flex items-start gap-3">
                            <Checkbox
                              id={`story-${story.id}`}
                              checked={story.is_completed}
                              onCheckedChange={(checked) =>
                                handleToggleStory(story.id, !!checked)
                              }
                              className="mt-0.5"
                            />
                            <label
                              htmlFor={`story-${story.id}`}
                              className={`text-sm cursor-pointer ${story.is_completed ? "line-through text-text-tertiary" : "text-text"}`}
                            >
                              {story.title}
                            </label>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="w-7 h-7 text-text-tertiary opacity-0 group-hover:opacity-100 transition-opacity hover:text-risk-high hover:bg-risk-high/10"
                            onClick={() => handleDeleteStory(story.id)}
                            disabled={deletingStoryIds.has(story.id)}
                          >
                            {deletingStoryIds.has(story.id) ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      ))}
                  </div>
                ) : (
                  <p className="text-sm text-text-tertiary">
                    No user stories yet.
                  </p>
                )}
              </div>

              {/* Updates */}
              <div className="px-6 py-4">
                <div className="flex items-center gap-2 mb-3">
                  <History className="w-4 h-4 text-text-tertiary" />
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-text-tertiary">
                    Updates
                  </h3>
                </div>
                {milestone.updates && milestone.updates.length > 0 ? (
                  <div className="space-y-3">
                    {milestone.updates.map((upd) => (
                      <div
                        key={upd.id}
                        className="bg-surface-dim rounded-lg p-3 border border-border/50"
                      >
                        <div className="flex items-center gap-2 mb-1.5">
                          <Badge
                            variant="outline"
                            className={`text-[10px] uppercase tracking-wider px-1.5 py-0.5 ${UPDATE_BADGE[upd.update_type]}`}
                          >
                            {upd.update_type}
                          </Badge>
                          <span className="text-[10px] text-text-tertiary">
                            {formatDate(upd.logged_at)}
                          </span>
                        </div>
                        <p className="text-sm text-text leading-relaxed">
                          {upd.content}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-text-tertiary">No updates yet</p>
                )}
              </div>
            </div>

            {/* Bottom: Quick Log Update */}
            <div className="border-t border-border px-6 py-4 bg-surface-dim">
              <div className="flex gap-2 mb-2">
                {(["progress", "blocker", "completed", "note"] as const).map(
                  (t) => (
                    <Button
                      key={t}
                      variant="ghost"
                      size="sm"
                      onClick={() => setUpdateType(t)}
                      className={`h-7 px-2 text-[10px] font-semibold capitalize ${updateType === t ? UPDATE_BADGE[t] : "text-text-tertiary hover:text-text-secondary"}`}
                    >
                      {t}
                    </Button>
                  ),
                )}
              </div>
              <div className="flex gap-2">
                <Textarea
                  value={updateContent}
                  onChange={(e) => setUpdateContent(e.target.value)}
                  placeholder="Log an update…"
                  rows={1}
                  className="flex-1 bg-surface border-border focus-visible:ring-primary/30 resize-none"
                />
                <Button
                  onClick={handleLogUpdate}
                  disabled={submitting || !updateContent.trim()}
                  className="bg-primary hover:bg-primary-hover text-primary-foreground font-semibold"
                >
                  Post
                </Button>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
