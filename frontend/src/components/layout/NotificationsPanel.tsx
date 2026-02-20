import { useAppStore } from "@/store";
import { Bell, X } from "lucide-react";

export function NotificationsPanel() {
  const { closeNotifications } = useAppStore();

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/20 z-40"
        onClick={closeNotifications}
      />

      {/* Panel */}
      <div className="fixed top-0 right-0 h-full w-full max-w-sm bg-surface border-l border-border shadow-drawer z-50 animate-slide-in-right">
        <div className="flex items-center justify-between px-6 h-16 border-b border-border">
          <h2 className="font-heading text-lg font-semibold text-text">
            Notifications
          </h2>
          <button
            onClick={closeNotifications}
            className="p-2 rounded-lg hover:bg-surface-dim transition-colors text-text-secondary"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {/* Empty state */}
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-12 h-12 rounded-full bg-surface-dim flex items-center justify-center mb-4">
              <Bell className="w-6 h-6 text-text-tertiary" />
            </div>
            <p className="text-sm text-text-secondary font-medium">
              All caught up
            </p>
            <p className="text-xs text-text-tertiary mt-1">
              No overdue milestones or active blockers
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
