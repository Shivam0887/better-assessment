import { useState, useEffect } from "react";
import { Link } from "react-router";
import { fetchScopes, deleteScope } from "@/api/client";
import type { ScopeListItem, ScopeStatus } from "@/types";
import { formatDate, truncate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Plus, Eye, Archive } from "lucide-react";

const STATUS_BADGES: Record<ScopeStatus, string> = {
  draft: "bg-risk-medium/10 text-risk-medium border-risk-medium/20",
  converted:
    "bg-status-completed/10 text-status-completed border-status-completed/20",
  archived: "bg-surface-dim text-text-tertiary border-border",
};

const STATUS_LABELS: Record<ScopeStatus, string> = {
  draft: "Draft",
  converted: "Converted",
  archived: "Archived",
};

export function ScopesLibraryPage() {
  const [scopes, setScopes] = useState<ScopeListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<ScopeStatus | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchScopes()
      .then(setScopes)
      .catch(() => setScopes([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = scopes.filter((s) => {
    if (filterStatus !== "all" && s.status !== filterStatus) return false;
    if (
      searchQuery &&
      !s.product_name.toLowerCase().includes(searchQuery.toLowerCase())
    )
      return false;
    return true;
  });

  const handleArchive = async (id: string) => {
    if (!confirm("Are you sure you want to archive this scope?")) return;
    try {
      await deleteScope(id);
      setScopes((prev) =>
        prev.map((s) =>
          s.id === id ? { ...s, status: "archived" as ScopeStatus } : s,
        ),
      );
    } catch (err) {
      console.error("Failed to archive scope:", err);
    }
  };

  return (
    <div className="px-4 sm:px-6 py-6 sm:py-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-text">
            Scopes Library
          </h1>
          <p className="text-xs sm:text-sm text-text-secondary mt-1">
            All your generated scopes in one place
          </p>
        </div>
        <Button
          asChild
          className="bg-primary hover:bg-primary-hover text-primary-foreground font-semibold gap-2 w-full sm:w-auto overflow-hidden text-ellipsis whitespace-nowrap"
        >
          <Link to="/scopes/new">
            <Plus className="w-4 h-4 shrink-0" />
            New Scope
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row md:items-center gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary w-4 h-4" />
          <Input
            type="text"
            placeholder="Search by product…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-surface border-border focus-visible:ring-primary/30"
          />
        </div>
        <div className="flex gap-1 bg-surface border border-border rounded-lg p-0.5 overflow-x-auto no-scrollbar">
          {(["all", "draft", "converted", "archived"] as const).map(
            (status) => (
              <Button
                key={status}
                variant="ghost"
                size="sm"
                onClick={() => setFilterStatus(status)}
                className={`text-xs capitalize h-8 px-3 shrink-0 ${filterStatus === status ? "bg-primary/10 text-primary" : "text-text-secondary hover:text-text"}`}
              >
                {status}
              </Button>
            ),
          )}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      ) : filtered.length > 0 ? (
        <>
          {/* Desktop Table View */}
          <div className="hidden lg:block overflow-hidden">
            <Card className="bg-surface border-border overflow-hidden rounded-xl">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-surface-dim">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-text-tertiary uppercase tracking-wider">
                      Product Name
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-text-tertiary uppercase tracking-wider">
                      Idea Summary
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-text-tertiary uppercase tracking-wider">
                      Status
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-text-tertiary uppercase tracking-wider">
                      Created
                    </th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-text-tertiary uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((scope) => (
                    <tr
                      key={scope.id}
                      className="border-b border-border last:border-b-0 hover:bg-surface-dim/50 transition-colors"
                    >
                      <td className="px-4 py-3 font-medium text-text">
                        {scope.product_name}
                      </td>
                      <td className="px-4 py-3 text-text-secondary">
                        {truncate(scope.idea_text, 80)}
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant="outline"
                          className={`text-[10px] uppercase tracking-wider ${STATUS_BADGES[scope.status]}`}
                        >
                          {STATUS_LABELS[scope.status]}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-text-secondary whitespace-nowrap">
                        {formatDate(scope.created_at)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-3">
                          <Button
                            variant="link"
                            size="sm"
                            asChild
                            className="h-auto p-0 text-xs text-primary gap-1 no-underline"
                          >
                            <Link to={`/scopes/${scope.id}`}>
                              <Eye className="w-3.5 h-3.5" />
                              View
                            </Link>
                          </Button>
                          {scope.status === "draft" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleArchive(scope.id)}
                              className="h-auto p-0 text-xs text-text-tertiary hover:text-risk-high gap-1"
                            >
                              <Archive className="w-3.5 h-3.5" />
                              Archive
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          </div>

          {/* Mobile Card View */}
          <div className="lg:hidden space-y-3">
            {filtered.map((scope) => (
              <Card
                key={scope.id}
                className="bg-surface border-border p-4 hover:border-border-strong transition-all"
              >
                <div className="flex justify-between items-start gap-4 mb-2">
                  <h3 className="font-semibold text-text truncate">
                    {scope.product_name}
                  </h3>
                  <Badge
                    variant="outline"
                    className={`text-[9px] uppercase tracking-wider shrink-0 ${STATUS_BADGES[scope.status]}`}
                  >
                    {STATUS_LABELS[scope.status]}
                  </Badge>
                </div>
                <p className="text-sm text-text-secondary line-clamp-2 mb-4">
                  {scope.idea_text}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-text-tertiary font-medium">
                    {formatDate(scope.created_at)}
                  </span>
                  <div className="flex items-center gap-4">
                    <Link
                      to={`/scopes/${scope.id}`}
                      className="text-xs font-semibold text-primary no-underline flex items-center gap-1.5"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      View
                    </Link>
                    {scope.status === "draft" && (
                      <button
                        onClick={() => handleArchive(scope.id)}
                        className="text-xs font-semibold text-text-tertiary hover:text-risk-high transition-colors flex items-center gap-1.5"
                      >
                        <Archive className="w-3.5 h-3.5" />
                        Archive
                      </button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </>
      ) : (
        <Card className="bg-surface border-border border-dashed p-12 flex flex-col items-center justify-center text-center">
          <div className="w-12 h-12 rounded-full bg-surface-dim flex items-center justify-center mb-4">
            <Search className="w-6 h-6 text-text-tertiary" />
          </div>
          <p className="text-sm text-text-secondary font-medium">
            {searchQuery || filterStatus !== "all"
              ? "No matching scopes found"
              : "No scopes in your library yet"}
          </p>
          <Button asChild variant="link" className="mt-2 text-primary">
            <Link to="/scopes/new">
              {searchQuery || filterStatus !== "all"
                ? "Clear filters"
                : "Generate your first scope"}
            </Link>
          </Button>
        </Card>
      )}
    </div>
  );
}
