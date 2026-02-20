/* ─── Enums ─── */

export type ScopeStatus = "draft" | "converted" | "archived";
export type ProjectStatus = "active" | "on_hold" | "completed" | "archived";
export type MilestoneStatus =
  | "not_started"
  | "in_progress"
  | "completed"
  | "blocked";
export type UpdateType = "progress" | "blocker" | "completed" | "note";
export type SummaryTone = "technical" | "executive";
export type BudgetRange = "low" | "medium" | "high";
export type TimelinePressure =
  | "asap"
  | "1_3_months"
  | "3_6_months"
  | "flexible";
export type RiskSeverity = "high" | "medium" | "low";

/* ─── Data Entities ─── */

export interface Risk {
  description: string;
  severity: RiskSeverity;
}

export interface UserStory {
  id: string;
  epic_id: string;
  milestone_id: string | null;
  title: string;
  description: string;
  is_completed: boolean;
  order_index: number;
}

export interface Epic {
  id: string;
  scope_id: string;
  name: string;
  description: string;
  effort_days: number;
  order_index: number;
  user_stories: UserStory[];
}

export interface Scope {
  id: string;
  product_name: string;
  idea_text: string;
  target_audience: string | null;
  budget_range: BudgetRange | null;
  timeline_pressure: TimelinePressure | null;
  suggested_stack: string[];
  timeline_weeks: number;
  risks: Risk[];
  status: ScopeStatus;
  epics: Epic[];
  created_at: string;
  updated_at: string;
}

export interface TeamMember {
  id: string;
  project_id: string;
  name: string;
  role: string;
  avatar_color: string;
  created_at: string;
}

export interface Update {
  id: string;
  milestone_id: string;
  update_type: UpdateType;
  content: string;
  logged_at: string;
  created_at: string;
  milestone_name?: string;
}

export interface Milestone {
  id: string;
  project_id: string;
  epic_id: string | null;
  assigned_to: string | null;
  name: string;
  description: string;
  status: MilestoneStatus;
  progress_percent: number;
  start_date: string;
  due_date: string;
  order_index: number;
  created_at: string;
  updated_at: string;
  user_stories?: UserStory[];
  updates?: Update[];
  assigned_member?: TeamMember;
}

export interface Project {
  id: string;
  scope_id: string;
  name: string;
  description: string;
  start_date: string;
  status: ProjectStatus;
  created_at: string;
  updated_at: string;
  milestones?: Milestone[];
  team_members?: TeamMember[];
}

export interface Summary {
  id: string;
  project_id: string;
  content: string;
  tone: SummaryTone;
  week_start: string;
  generated_at: string;
}

export interface Notification {
  id: string;
  type: "due_soon" | "overdue" | "blocker";
  message: string;
  milestone_id: string;
  project_id: string;
  project_name: string;
  milestone_name: string;
}

/* ─── API Contracts ─── */

export interface ScopeListItem {
  id: string;
  product_name: string;
  idea_text: string;
  status: ScopeStatus;
  created_at: string;
}

export interface ProjectCardData {
  id: string;
  name: string;
  status: ProjectStatus;
  progress_percent: number;
  milestone_count: number;
  completed_milestones: number;
  next_due_date: string | null;
  health: "green" | "amber" | "red";
  team_members: Pick<TeamMember, "id" | "name" | "avatar_color">[];
}

export interface GenerateScopePayload {
  product_name: string;
  idea_text: string;
  target_audience?: string;
  budget_range?: BudgetRange;
  timeline_pressure?: TimelinePressure;
}

export interface ConvertToProjectPayload {
  start_date: string;
}

export interface LogUpdatePayload {
  update_type: UpdateType;
  content: string;
  logged_at?: string;
}

export interface GenerateSummaryPayload {
  tone: SummaryTone;
}

export interface AddTeamMemberPayload {
  name: string;
  role: string;
  avatar_color: string;
}

export interface CreateMilestonePayload {
  name: string;
  due_date: string;
  description?: string;
}

export interface CreateUserStoryPayload {
  title: string;
  description?: string;
}

export interface SearchResult {
  type: "project" | "milestone" | "update";
  id: string;
  title: string;
  subtitle: string;
  project_id?: string;
}

export interface UpdateProjectPayload {
  status: ProjectStatus;
}
