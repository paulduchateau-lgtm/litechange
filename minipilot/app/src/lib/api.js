const API_BASE = "/api";

// ── Global (non-workspace) API functions ──────────────────────────────────

export async function listWorkspaces() {
  const res = await fetch(`${API_BASE}/workspaces`);
  return res.json();
}

export async function createWorkspace(name, industry) {
  const res = await fetch(`${API_BASE}/workspaces`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, industry }),
  });
  return res.json();
}

export async function getWorkspace(slug) {
  const res = await fetch(`${API_BASE}/workspaces/${slug}`);
  return res.json();
}

export async function deleteWorkspace(slug) {
  const res = await fetch(`${API_BASE}/workspaces/${slug}`, { method: "DELETE" });
  return res.json();
}

export async function getAiMode() {
  const res = await fetch(`${API_BASE}/ai/mode`);
  return res.json();
}

export async function setAiMode(mode) {
  const res = await fetch(`${API_BASE}/ai/mode`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mode }),
  });
  return res.json();
}

// ── Workspace-scoped API factory ──────────────────────────────────────────

export function createWorkspaceApi(slug) {
  const BASE = `${API_BASE}/w/${slug}`;

  return {
    uploadFiles: async (files) => {
      const formData = new FormData();
      files.forEach(f => formData.append("files", f));
      const res = await fetch(`${BASE}/upload`, { method: "POST", body: formData });
      return res.json();
    },

    saveContext: async (context) => {
      const payload = {
        projectName: context.projectName || "",
        industry: context.secteur || context.industry || "",
        objectives: context.objectif || context.objectives || "",
        questionnaire: {
          perimetre: context.perimetre || "",
          periode: context.periode || "",
          indicateurs: context.indicateurs || [],
          mode: context.mode || "form",
        },
        freeText: context.freeText || context.free_text || "",
      };
      const res = await fetch(`${BASE}/context`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      return res.json();
    },

    getContext: async () => {
      const res = await fetch(`${BASE}/context`);
      const data = await res.json();
      const ctx = data.context || data;
      return {
        project_name: ctx.projectName || ctx.project_name || "",
        industry: ctx.industry || "",
        objectives: ctx.objectives || "",
        free_text: ctx.freeText || ctx.free_text || "",
        questionnaire: ctx.questionnaire || null,
      };
    },

    updateContext: async (context) => {
      const payload = {
        projectName: context.project_name || context.projectName || "",
        industry: context.industry || "",
        objectives: context.objectives || "",
        freeText: context.free_text || context.freeText || "",
      };
      const res = await fetch(`${BASE}/context`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      return res.json();
    },

    transformData: async () => {
      const res = await fetch(`${BASE}/transform`, { method: "POST" });
      return res.json();
    },

    getDataPreview: async () => {
      const res = await fetch(`${BASE}/data/preview`);
      return res.json();
    },

    getDataStats: async () => {
      const res = await fetch(`${BASE}/data/stats`);
      return res.json();
    },

    suggestReports: async () => {
      const res = await fetch(`${BASE}/ai/suggest-reports`, { method: "POST" });
      return res.json();
    },

    generateReport: async (suggestion) => {
      const res = await fetch(`${BASE}/ai/generate-report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ suggestion }),
      });
      return res.json();
    },

    chatMessage: async (message, history) => {
      const res = await fetch(`${BASE}/ai/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, history }),
      });
      return res.json();
    },

    getReports: async () => {
      const res = await fetch(`${BASE}/reports`);
      return res.json();
    },

    getReport: async (id) => {
      const res = await fetch(`${BASE}/reports/${id}`);
      if (!res.ok) return null;
      return res.json();
    },

    saveReport: async (report) => {
      const res = await fetch(`${BASE}/reports`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(report),
      });
      return res.json();
    },

    updateReport: async (id, updates) => {
      const res = await fetch(`${BASE}/reports/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      return res.json();
    },

    deleteReport: async (id) => {
      const res = await fetch(`${BASE}/reports/${id}`, { method: "DELETE" });
      return res.json();
    },

    getTrashedReports: async () => {
      const res = await fetch(`${BASE}/reports-trash`);
      return res.json();
    },

    restoreReport: async (id) => {
      const res = await fetch(`${BASE}/reports/${id}/restore`, { method: "POST" });
      return res.json();
    },

    getOnboardingStatus: async () => {
      const res = await fetch(`${BASE}/onboarding/status`);
      return res.json();
    },

    resetOnboarding: async () => {
      const res = await fetch(`${BASE}/onboarding/reset`, { method: "POST" });
      return res.json();
    },

    getLogs: async (page = 1) => {
      const res = await fetch(`${BASE}/logs?page=${page}`);
      return res.json();
    },

    getThemeStats: async () => {
      const res = await fetch(`${BASE}/stats/themes`);
      return res.json();
    },

    getUsageStats: async () => {
      const res = await fetch(`${BASE}/stats/usage`);
      return res.json();
    },
  };
}
