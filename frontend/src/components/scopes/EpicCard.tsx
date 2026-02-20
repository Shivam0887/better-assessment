import { useState } from "react";
import type { Epic } from "@/types";
import { ChevronRight } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

interface EpicCardProps {
  epic: Epic;
  color: string;
  editedFields?: Partial<Epic>;
  onEdit: (epicId: string, field: string, value: string) => void;
}

export function EpicCard({ epic, color, editedFields, onEdit }: EpicCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [editingField, setEditingField] = useState<string | null>(null);

  const displayName = editedFields?.name ?? epic.name;
  const displayDesc = editedFields?.description ?? epic.description;

  return (
    <div
      className="bg-surface rounded-xl border border-border overflow-hidden transition-shadow hover:shadow-card"
      style={{ borderLeftWidth: "4px", borderLeftColor: color }}
    >
      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            {editingField === "name" ? (
              <input
                type="text"
                value={displayName}
                onChange={(e) => onEdit(epic.id, "name", e.target.value)}
                onBlur={() => setEditingField(null)}
                onKeyDown={(e) => e.key === "Enter" && setEditingField(null)}
                className="w-full text-base font-heading font-semibold text-text bg-transparent
                  border-b-2 border-primary focus:outline-none py-0.5"
                autoFocus
              />
            ) : (
              <h3
                className="text-base font-heading font-semibold text-text cursor-pointer
                  hover:text-primary transition-colors"
                onClick={() => setEditingField("name")}
              >
                {displayName}
              </h3>
            )}

            {editingField === "description" ? (
              <textarea
                value={displayDesc}
                onChange={(e) => onEdit(epic.id, "description", e.target.value)}
                onBlur={() => setEditingField(null)}
                className="w-full mt-1 text-sm text-text-secondary bg-transparent
                  border-b-2 border-primary focus:outline-none resize-none"
                rows={2}
                autoFocus
              />
            ) : (
              <p
                className="text-sm text-text-secondary mt-1 cursor-pointer hover:text-text transition-colors"
                onClick={() => setEditingField("description")}
              >
                {displayDesc}
              </p>
            )}
          </div>

          {/* Effort badge */}
          <span className="shrink-0 px-2.5 py-1 bg-surface-dim text-xs font-semibold text-text-secondary rounded-md border border-border">
            {epic.effort_days}d
          </span>
        </div>

        {/* Toggle stories */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="mt-3 flex items-center gap-1.5 text-xs font-medium text-text-tertiary
            hover:text-primary transition-colors"
        >
          <ChevronRight
            className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? "rotate-90" : ""}`}
          />
          {epic.user_stories.length} user{" "}
          {epic.user_stories.length === 1 ? "story" : "stories"}
        </button>
      </div>

      {/* Expanded: User Stories */}
      {isExpanded && (
        <div className="border-t border-border bg-surface-dim/50 px-5 py-3 space-y-2 animate-slide-in-up">
          {epic.user_stories
            .sort((a, b) => a.order_index - b.order_index)
            .map((story) => (
              <div key={story.id} className="flex items-start gap-3 py-1.5">
                <Checkbox id={story.id} disabled className="mt-0.5" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-text">{story.title}</p>
                  <p className="text-xs text-text-secondary mt-0.5">
                    {story.description}
                  </p>
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
