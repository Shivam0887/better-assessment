import type {
  Scope,
  ScopeListItem,
  Project,
  ProjectCardData,
  Milestone,
  Update,
  Summary,
  TeamMember,
  Notification,
  SearchResult,
  GenerateScopePayload,
  ConvertToProjectPayload,
  LogUpdatePayload,
  GenerateSummaryPayload,
  AddTeamMemberPayload,
  UserStory,
  CreateMilestonePayload,
  CreateUserStoryPayload,
  UpdateProjectPayload,
} from "@/types";

const API_BASE = "/api/v1";

/* ─── Helpers ─── */

async function api<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Request failed" }));
    throw new Error(err.error ?? `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

/* ─── Scopes ─── */

export function fetchScopes(): Promise<ScopeListItem[]> {
  return api<{ scopes: ScopeListItem[] }>("/scopes").then((r) => r.scopes);
}

export function fetchScope(id: string): Promise<Scope> {
  return api<{ scope: Scope }>(`/scopes/${id}`).then((r) => r.scope);
}

export function generateScope(payload: GenerateScopePayload): Promise<Scope> {
  return api<{ scope: Scope }>("/scopes/generate", {
    method: "POST",
    body: JSON.stringify(payload),
  }).then((r) => r.scope);
}

export function updateScope(id: string, data: Partial<Scope>): Promise<Scope> {
  return api<{ scope: Scope }>(`/scopes/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  }).then((r) => r.scope);
}

export function convertScopeToProject(
  scopeId: string,
  payload: ConvertToProjectPayload,
): Promise<Project> {
  return api<{ project: Project }>(`/scopes/${scopeId}/convert`, {
    method: "POST",
    body: JSON.stringify(payload),
  }).then((r) => r.project);
}

export function deleteScope(id: string): Promise<void> {
  return api(`/scopes/${id}`, { method: "DELETE" });
}

/* ─── Projects ─── */

export function fetchProjects(): Promise<ProjectCardData[]> {
  return api<{ projects: ProjectCardData[] }>("/projects").then(
    (r) => r.projects,
  );
}

export function fetchProject(id: string): Promise<Project> {
  return api<{ project: Project }>(`/projects/${id}`).then((r) => r.project);
}

export function updateProject(
  id: string,
  payload: UpdateProjectPayload,
): Promise<Project> {
  return api<{ project: Project }>(`/projects/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  }).then((r) => r.project);
}

/* ─── Milestones ─── */

export function fetchMilestones(projectId: string): Promise<Milestone[]> {
  return api<{ milestones: Milestone[] }>(
    `/projects/${projectId}/milestones`,
  ).then((r) => r.milestones);
}

export function fetchMilestone(id: string): Promise<Milestone> {
  return api<{ milestone: Milestone }>(`/milestones/${id}`).then(
    (r) => r.milestone,
  );
}

export function updateMilestone(
  id: string,
  data: Partial<Milestone>,
): Promise<Milestone> {
  return api<{ milestone: Milestone }>(`/milestones/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  }).then((r) => r.milestone);
}

export function reorderMilestones(
  projectId: string,
  order: { id: string; order_index: number }[],
): Promise<void> {
  return api(`/projects/${projectId}/milestones/reorder`, {
    method: "PATCH",
    body: JSON.stringify({ order }),
  });
}

/* ─── Updates ─── */

export function fetchProjectUpdates(
  projectId: string,
  page = 1,
): Promise<{ updates: Update[]; total: number }> {
  return api(`/projects/${projectId}/updates?page=${page}`);
}

export function logUpdate(
  milestoneId: string,
  payload: LogUpdatePayload,
): Promise<Update> {
  return api<{ update: Update }>(`/milestones/${milestoneId}/updates`, {
    method: "POST",
    body: JSON.stringify(payload),
  }).then((r) => r.update);
}

/* ─── Team ─── */

export function fetchTeamMembers(projectId: string): Promise<TeamMember[]> {
  return api<{ team_members: TeamMember[] }>(
    `/projects/${projectId}/team`,
  ).then((r) => r.team_members);
}

export function addTeamMember(
  projectId: string,
  payload: AddTeamMemberPayload,
): Promise<TeamMember> {
  return api<{ team_member: TeamMember }>(`/projects/${projectId}/team`, {
    method: "POST",
    body: JSON.stringify(payload),
  }).then((r) => r.team_member);
}

export function updateTeamMember(
  id: string,
  data: Partial<TeamMember>,
): Promise<TeamMember> {
  return api<{ team_member: TeamMember }>(`/team-members/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  }).then((r) => r.team_member);
}

export function deleteTeamMember(id: string): Promise<void> {
  return api(`/team-members/${id}`, { method: "DELETE" });
}

/* ─── Summaries ─── */

export function generateSummary(
  projectId: string,
  payload: GenerateSummaryPayload,
): Promise<Summary> {
  return api<{ summary: Summary }>(`/projects/${projectId}/summary`, {
    method: "POST",
    body: JSON.stringify(payload),
  }).then((r) => r.summary);
}

export function fetchSummaries(projectId: string): Promise<Summary[]> {
  return api<{ summaries: Summary[] }>(`/projects/${projectId}/summaries`).then(
    (r) => r.summaries,
  );
}

/* ─── Notifications ─── */

export function fetchNotifications(projectId: string): Promise<Notification[]> {
  return api<{ notifications: Notification[] }>(
    `/projects/${projectId}/notifications`,
  ).then((r) => r.notifications);
}

/* ─── Search ─── */

export function search(query: string): Promise<SearchResult[]> {
  return api<{ results: SearchResult[] }>(
    `/search?q=${encodeURIComponent(query)}`,
  ).then((r) => r.results);
}

/* ─── User Stories ─── */

export function updateUserStory(
  id: string,
  data: { is_completed?: boolean; title?: string; description?: string },
): Promise<void> {
  return api(`/user-stories/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export function deleteProject(id: string): Promise<void> {
  return api(`/projects/${id}`, { method: "DELETE" });
}

export function createMilestone(
  projectId: string,
  payload: CreateMilestonePayload,
): Promise<Milestone> {
  return api<{ milestone: Milestone }>(`/projects/${projectId}/milestones`, {
    method: "POST",
    body: JSON.stringify(payload),
  }).then((r) => r.milestone);
}

export function deleteMilestone(id: string): Promise<void> {
  return api(`/milestones/${id}`, { method: "DELETE" });
}

export function createUserStory(
  milestoneId: string,
  payload: CreateUserStoryPayload,
): Promise<UserStory> {
  return api<{ user_story: UserStory }>(
    `/milestones/${milestoneId}/user-stories`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  ).then((r) => r.user_story);
}

export function deleteUserStory(id: string): Promise<void> {
  return api(`/user-stories/${id}`, { method: "DELETE" });
}
