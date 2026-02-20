import { Outlet, Link, useNavigate } from "react-router";
import { useState, useCallback } from "react";
import { useAppStore } from "@/store";
import { search } from "@/api/client";
import type { SearchResult } from "@/types";
import { NotificationsPanel } from "./NotificationsPanel";
import {
  Activity,
  Search as SearchIcon,
  Bell,
  Plus,
  Loader2,
  Layout,
  FileText,
  Menu,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function AppLayout() {
  const navigate = useNavigate();
  const { isNotificationsOpen, toggleNotifications } = useAppStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = useCallback(async (query: string) => {
    setSearchQuery(query);
    if (query.length < 2) {
      setShowResults(false);
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    try {
      const results = await search(query);
      setSearchResults(results);
      setShowResults(true);
    } catch {
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const handleResultClick = useCallback(
    (result: SearchResult) => {
      setShowResults(false);
      setSearchQuery("");
      if (result.type === "project") {
        navigate(`/projects/${result.id}`);
      } else if (result.type === "milestone" && result.project_id) {
        navigate(`/projects/${result.project_id}`);
      }
    },
    [navigate],
  );

  return (
    <TooltipProvider>
      <div className="h-screen bg-surface-dim flex flex-col overflow-hidden">
        {/* ─── Top Navigation ─── */}
        <header className="sticky top-0 z-50 bg-surface border-b border-border h-16 shrink-0">
          <div className="mx-auto flex items-center justify-between px-6 h-full">
            <div className="h-full flex items-center gap-2">
              {/* Sidebar Trigger (Mobile Only) */}
              <div className="lg:hidden">
                <Sheet>
                  <SheetTrigger asChild>
                    <button className="p-2 -ml-2 hover:bg-surface-dim rounded-lg transition-colors">
                      <Menu className="w-5 h-5 text-text-secondary" />
                    </button>
                  </SheetTrigger>
                  <SheetContent
                    side="left"
                    className="p-0 w-72 bg-surface border-r border-border"
                  >
                    <SheetHeader className="p-6 border-b border-border">
                      <SheetTitle className="flex items-center gap-2">
                        <Activity className="w-5 h-5 text-primary" />
                        <span>Runway</span>
                      </SheetTitle>
                    </SheetHeader>
                    <div className="flex-1 overflow-y-auto">
                      <SidebarContent />
                    </div>
                  </SheetContent>
                </Sheet>
              </div>

              {/* Logo (Desktop & Mobile) */}
              <Link
                to="/"
                className="flex items-center gap-2 no-underline shrink-0"
              >
                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                  <Activity className="w-5 h-5 text-white" />
                </div>
                <span className="font-heading text-lg sm:text-xl font-bold tracking-tight text-text hidden sm:block">
                  Runway
                </span>
              </Link>
            </div>

            {/* Search Bar - Hidden on very small screens, responsive width */}
            <div className="relative flex-1 max-w-md mx-2 sm:mx-8 hidden sm:block">
              <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search projects, milestones, updates…"
                  className="w-full pl-10 pr-4 py-2 text-sm bg-surface-dim border border-border rounded-lg
                    focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary
                    placeholder:text-text-tertiary transition-all"
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  onFocus={() =>
                    searchQuery.length >= 2 && setShowResults(true)
                  }
                  onBlur={() => setTimeout(() => setShowResults(false), 200)}
                />
                {isSearching && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <Loader2 className="w-4 h-4 text-primary animate-spin" />
                  </div>
                )}
              </div>

              {/* Search Results Dropdown */}
              {showResults && searchResults && searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-surface border border-border rounded-lg shadow-dropdown overflow-hidden animate-slide-in-up z-50">
                  {searchResults.map((result) => (
                    <button
                      key={`${result.type}-${result.id}`}
                      className="w-full text-left px-4 py-3 hover:bg-surface-dim transition-colors flex items-center gap-3"
                      onMouseDown={() => handleResultClick(result)}
                    >
                      <span className="text-[10px] uppercase tracking-wider font-semibold text-text-tertiary bg-surface-dim px-2 py-0.5 rounded">
                        {result.type}
                      </span>
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-text truncate">
                          {result.title}
                        </div>
                        <div className="text-xs text-text-secondary truncate">
                          {result.subtitle}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Right actions */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              {/* Notifications Bell */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={toggleNotifications}
                    className="relative p-2 rounded-lg hover:bg-surface-dim transition-colors"
                    aria-label="Notifications"
                  >
                    <Bell className="w-5 h-5 text-text-secondary" />
                    {/* Unread badge */}
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-risk-high rounded-full border-2 border-surface" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Notifications</p>
                </TooltipContent>
              </Tooltip>

              {/* New Scope CTA - Text hidden on small screens */}
              <Link
                to="/scopes/new"
                className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 bg-primary hover:bg-primary-hover
                  text-primary-foreground text-sm font-semibold rounded-lg transition-colors no-underline"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">New Scope</span>
              </Link>
            </div>
          </div>
        </header>

        <div className="flex flex-1 overflow-hidden">
          {/* Desktop Sidebar */}
          <aside className="w-64 shrink-0 bg-surface border-r border-border flex-col hidden lg:flex">
            <div className="flex-1 overflow-y-auto">
              <SidebarContent />
            </div>
          </aside>

          {/* ─── Content Area ─── */}
          <div className="flex-1 overflow-y-auto">
            <main className="w-full">
              <Outlet />
            </main>
          </div>
        </div>

        {/* ─── Notifications Panel ─── */}
        {isNotificationsOpen && <NotificationsPanel />}
      </div>
    </TooltipProvider>
  );
}

function SidebarContent() {
  return (
    <nav className="p-4 space-y-6">
      <div>
        <h3 className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-2 px-2">
          Main
        </h3>
        <div className="space-y-1">
          <Link
            to="/"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-text hover:bg-surface-dim group no-underline"
          >
            <Layout className="w-4 h-4 text-text-secondary group-hover:text-primary transition-colors" />
            Projects
          </Link>
          <Link
            to="/scopes"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-text hover:bg-surface-dim group no-underline"
          >
            <FileText className="w-4 h-4 text-text-secondary group-hover:text-primary transition-colors" />
            Scopes
          </Link>
        </div>
      </div>

      <div>
        <h3 className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-2 px-2">
          Shortcuts
        </h3>
        <div className="space-y-1">
          <Link
            to="/scopes/new"
            className="flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium text-text hover:bg-surface-dim group no-underline"
          >
            <div className="flex items-center gap-3">
              <Plus className="w-4 h-4 text-text-secondary group-hover:text-primary transition-colors" />
              New Scope
            </div>
          </Link>
        </div>
      </div>

      <div className="pt-6 border-t border-border">
        <div className="bg-primary/5 rounded-xl p-4 border border-primary/10">
          <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-1">
            Pro Tip
          </p>
          <p className="text-[11px] text-text-secondary leading-relaxed">
            Use keywords to search through all your projects and milestones
            instantly.
          </p>
        </div>
      </div>
    </nav>
  );
}
