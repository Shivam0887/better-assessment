import { BrowserRouter, Routes, Route } from "react-router";
import { AppLayout } from "@/components/layout/AppLayout";
import { HomePage } from "@/pages/HomePage";
import { NewScopePage } from "@/pages/NewScopePage";
import { ScopeResultPage } from "@/pages/ScopeResultPage";
import { ScopesLibraryPage } from "@/pages/ScopesLibraryPage";
import { ProjectPage } from "@/pages/ProjectPage";

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<HomePage />} />
          <Route path="scopes/new" element={<NewScopePage />} />
          <Route path="scopes/:id" element={<ScopeResultPage />} />
          <Route path="scopes" element={<ScopesLibraryPage />} />
          <Route path="projects/:id" element={<ProjectPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
