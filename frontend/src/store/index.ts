import { create } from "zustand";
import type {
  ProjectCardData,
  Scope,
  Project,
  Milestone,
  ScopeListItem,
} from "@/types";
import {
  fetchProjects,
  fetchScope,
  fetchProject,
  fetchScopes,
} from "@/api/client";

interface AppStore {
  /* ─── Notifications Panel ─── */
  isNotificationsOpen: boolean;
  toggleNotifications: () => void;
  closeNotifications: () => void;

  /* ─── Milestone Drawer ─── */
  activeMilestoneId: string | null;
  openMilestoneDrawer: (id: string) => void;
  closeMilestoneDrawer: () => void;

  /* ─── Data promise caches (for React 19 `use` hook) ─── */
  projectsPromise: Promise<ProjectCardData[]> | null;
  invalidateProjects: () => void;

  scopesPromise: Promise<ScopeListItem[]> | null;
  invalidateScopes: () => void;

  activeScopePromise: Promise<Scope> | null;
  loadScope: (id: string) => void;

  activeProjectPromise: Promise<Project> | null;
  loadProject: (id: string) => void;

  activeMilestonePromise: Promise<Milestone> | null;

  /* ─── Search ─── */
  searchQuery: string;
  setSearchQuery: (q: string) => void;

  /* ─── Log Update Modal ─── */
  isLogUpdateOpen: boolean;
  logUpdateMilestoneId: string | null;
  openLogUpdate: (milestoneId?: string) => void;
  closeLogUpdate: () => void;

  /* ─── Weekly Summary Modal ─── */
  isSummaryModalOpen: boolean;
  summaryContent: string | null;
  openSummaryModal: (content: string) => void;
  closeSummaryModal: () => void;
}

export const useAppStore = create<AppStore>((set) => ({
  /* Notifications */
  isNotificationsOpen: false,
  toggleNotifications: () =>
    set((s) => ({ isNotificationsOpen: !s.isNotificationsOpen })),
  closeNotifications: () => set({ isNotificationsOpen: false }),

  /* Milestone Drawer */
  activeMilestoneId: null,
  openMilestoneDrawer: (id) => set({ activeMilestoneId: id }),
  closeMilestoneDrawer: () => set({ activeMilestoneId: null }),

  /* Projects promise cache */
  projectsPromise: null,
  invalidateProjects: () => set({ projectsPromise: fetchProjects() }),

  /* Scopes promise cache */
  scopesPromise: null,
  invalidateScopes: () => set({ scopesPromise: fetchScopes() }),

  /* Active scope */
  activeScopePromise: null,
  loadScope: (id) => set({ activeScopePromise: fetchScope(id) }),

  /* Active project */
  activeProjectPromise: null,
  loadProject: (id) => set({ activeProjectPromise: fetchProject(id) }),

  /* Active milestone */
  activeMilestonePromise: null,

  /* Search */
  searchQuery: "",
  setSearchQuery: (q) => set({ searchQuery: q }),

  /* Log Update */
  isLogUpdateOpen: false,
  logUpdateMilestoneId: null,
  openLogUpdate: (milestoneId) =>
    set({ isLogUpdateOpen: true, logUpdateMilestoneId: milestoneId ?? null }),
  closeLogUpdate: () =>
    set({ isLogUpdateOpen: false, logUpdateMilestoneId: null }),

  /* Summary Modal */
  isSummaryModalOpen: false,
  summaryContent: null,
  openSummaryModal: (content) =>
    set({ isSummaryModalOpen: true, summaryContent: content }),
  closeSummaryModal: () =>
    set({ isSummaryModalOpen: false, summaryContent: null }),
}));
