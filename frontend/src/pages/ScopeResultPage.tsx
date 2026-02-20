import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router";
import { fetchScope, updateScope, convertScopeToProject } from "@/api/client";
import type { Scope, Epic } from "@/types";
import { EpicCard } from "@/components/scopes/EpicCard";
import { getEpicColor, formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
  RotateCw,
  ArrowRight,
  FileDown,
  Save,
  Loader2,
  Info,
} from "lucide-react";

const RISK_COLORS: Record<string, string> = {
  high: "bg-risk-high/10 text-risk-high border-risk-high/20",
  medium: "bg-risk-medium/10 text-risk-medium border-risk-medium/20",
  low: "bg-surface-dim text-text-secondary border-border",
};

export function ScopeResultPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [scope, setScope] = useState<Scope | null>(null);
  const [loading, setLoading] = useState(true);
  const [editedEpics, setEditedEpics] = useState<Map<string, Partial<Epic>>>(
    new Map(),
  );
  const [hasEdits, setHasEdits] = useState(false);
  const [converting, setConverting] = useState(false);
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetchScope(id)
      .then(setScope)
      .catch(() => setScope(null))
      .finally(() => setLoading(false));
  }, [id]);

  const handleEpicEdit = useCallback(
    (epicId: string, field: string, value: string) => {
      setEditedEpics((prev) => {
        const next = new Map(prev);
        const existing = next.get(epicId) ?? {};
        next.set(epicId, { ...existing, [field]: value });
        return next;
      });
      setHasEdits(true);
    },
    [],
  );

  const handleSaveEdits = useCallback(async () => {
    if (!scope) return;
    setSaving(true);
    try {
      await updateScope(scope.id, { epics: scope.epics } as Partial<Scope>);
      setHasEdits(false);
      setEditedEpics(new Map());
    } catch {
      // silently fail for now
    } finally {
      setSaving(false);
    }
  }, [scope]);

  const handleSaveDraft = useCallback(async () => {
    if (!scope) return;
    try {
      await updateScope(scope.id, { status: "draft" });
    } catch {
      // silently fail
    }
  }, [scope]);

  const handleConvert = useCallback(async () => {
    if (!scope) return;
    setConverting(true);
    try {
      const project = await convertScopeToProject(scope.id, {
        start_date: new Date().toISOString().split("T")[0],
      });
      navigate(`/projects/${project.id}`);
    } catch {
      setConverting(false);
      setShowConvertModal(false);
    }
  }, [scope, navigate]);

  if (loading) {
    return (
      <div className="px-6 py-8">
        <Skeleton className="h-8 w-64 mb-4" />
        <div className="grid grid-cols-1 lg:grid-cols-10 gap-8">
          <div className="lg:col-span-7 space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-32 w-full rounded-xl" />
            ))}
          </div>
          <div className="lg:col-span-3">
            <Skeleton className="h-80 w-full rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!scope) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <p className="text-text-secondary">Scope not found</p>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="px-6 py-8 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-text">
              {scope.product_name}
            </h1>
            <p className="text-sm text-text-secondary mt-1">
              Generated on {formatDate(scope.created_at)}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {hasEdits && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleSaveEdits}
                disabled={saving}
                className="text-primary border-primary/30 hover:bg-primary/5 gap-2"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {saving ? "Saving…" : "Save Edits"}
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleSaveDraft}
              className="gap-2"
            >
              <FileDown className="w-4 h-4" />
              Save as Draft
            </Button>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" title="Regenerate">
                  <RotateCw className="w-4 h-4 text-text-secondary" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Regenerate Scope</p>
              </TooltipContent>
            </Tooltip>
            <Button
              onClick={() => setShowConvertModal(true)}
              className="bg-primary hover:bg-primary-hover text-primary-foreground font-semibold gap-2"
            >
              Convert to Project
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Main content: Epics + Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-10 gap-8">
          {/* Left: Epic Cards */}
          <div className="lg:col-span-7 space-y-4">
            {scope.epics
              .sort((a, b) => a.order_index - b.order_index)
              .map((epic, index) => (
                <EpicCard
                  key={epic.id}
                  epic={epic}
                  color={getEpicColor(index)}
                  editedFields={editedEpics.get(epic.id)}
                  onEdit={handleEpicEdit}
                />
              ))}
          </div>

          {/* Right: Sidebar */}
          <aside className="lg:col-span-3">
            <div className="sticky top-24 space-y-5">
              {/* Tech Stack */}
              <Card className="bg-surface border-border">
                <CardContent className="p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-text-tertiary">
                      Suggested Stack
                    </h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(scope.suggested_stack ?? []).map((tech) => (
                      <Badge
                        key={tech}
                        variant="outline"
                        className="bg-primary/8 text-primary border-primary/15"
                      >
                        {tech}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Timeline */}
              <Card className="bg-surface border-border">
                <CardContent className="p-5">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-text-tertiary mb-2">
                    Estimated Timeline
                  </h3>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-heading font-bold text-text">
                      {scope.timeline_weeks}
                    </span>
                    <span className="text-sm text-text-secondary">weeks</span>
                  </div>
                  <p className="text-xs text-text-tertiary mt-1">
                    {scope.epics.reduce((sum, e) => sum + e.effort_days, 0)}{" "}
                    total effort days across {scope.epics.length} epics
                  </p>
                </CardContent>
              </Card>

              {/* Risks */}
              <Card className="bg-surface border-border">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-text-tertiary">
                      Identified Risks
                    </h3>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="w-3.5 h-3.5 text-text-tertiary cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs text-[10px] leading-tight">
                          These risks are automatically identified by AI based
                          on your product features and complexity.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <div className="space-y-2">
                    {(scope.risks ?? []).map((risk, i) => (
                      <div
                        key={i}
                        className={`px-3 py-2 rounded-lg text-xs font-medium border ${RISK_COLORS[risk.severity]}`}
                        title={risk.description}
                      >
                        <span className="uppercase text-[10px] tracking-wider font-bold">
                          {risk.severity}
                        </span>
                        <p className="mt-0.5 font-normal opacity-90">
                          {risk.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </aside>
        </div>

        {/* Convert to Project Dialog */}
        <Dialog open={showConvertModal} onOpenChange={setShowConvertModal}>
          <DialogContent className="bg-surface border-border">
            <DialogHeader>
              <DialogTitle className="font-heading">
                Convert to Project
              </DialogTitle>
              <DialogDescription>
                This will create a new project with the following:
              </DialogDescription>
            </DialogHeader>
            <div className="bg-surface-dim rounded-lg p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-text-secondary">Milestones</span>
                <span className="font-semibold text-text">
                  {scope.epics.length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">User Stories</span>
                <span className="font-semibold text-text">
                  {scope.epics.reduce(
                    (sum, e) => sum + e.user_stories.length,
                    0,
                  )}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Est. Duration</span>
                <span className="font-semibold text-text">
                  {scope.timeline_weeks} weeks
                </span>
              </div>
            </div>
            <DialogFooter className="gap-3 sm:gap-3">
              <Button
                variant="outline"
                onClick={() => setShowConvertModal(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleConvert}
                disabled={converting}
                className="flex-1 bg-primary hover:bg-primary-hover text-primary-foreground font-semibold"
              >
                {converting ? "Creating…" : "Confirm & Create"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}
