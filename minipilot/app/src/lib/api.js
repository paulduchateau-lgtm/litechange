const API_BASE = "/api";

export async function uploadFiles(files) {
  const formData = new FormData();
  files.forEach(f => formData.append("files", f));
  const res = await fetch(`${API_BASE}/upload`, { method: "POST", body: formData });
  return res.json();
}

export async function saveContext(context) {
  // Map onboarding form fields to server-expected format
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
  const res = await fetch(`${API_BASE}/context`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return res.json();
}

export async function getContext() {
  const res = await fetch(`${API_BASE}/context`);
  const data = await res.json();
  // Normalize: server returns { context: {...} }, flatten for AdminPage
  const ctx = data.context || data;
  return {
    project_name: ctx.projectName || ctx.project_name || "",
    industry: ctx.industry || "",
    objectives: ctx.objectives || "",
    free_text: ctx.freeText || ctx.free_text || "",
    questionnaire: ctx.questionnaire || null,
  };
}

export async function updateContext(context) {
  const payload = {
    projectName: context.project_name || context.projectName || "",
    industry: context.industry || "",
    objectives: context.objectives || "",
    freeText: context.free_text || context.freeText || "",
  };
  const res = await fetch(`${API_BASE}/context`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return res.json();
}

export async function transformData() {
  const res = await fetch(`${API_BASE}/transform`, { method: "POST" });
  return res.json();
}

export async function getDataPreview() {
  const res = await fetch(`${API_BASE}/data/preview`);
  return res.json();
}

export async function getDataStats() {
  const res = await fetch(`${API_BASE}/data/stats`);
  return res.json();
}

export async function suggestReports() {
  const res = await fetch(`${API_BASE}/ai/suggest-reports`, { method: "POST" });
  return res.json();
}

export async function generateReport(suggestion) {
  const res = await fetch(`${API_BASE}/ai/generate-report`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ suggestion }),
  });
  return res.json();
}

export async function chatMessage(message, history) {
  const res = await fetch(`${API_BASE}/ai/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, history }),
  });
  return res.json();
}

export async function getReports() {
  const res = await fetch(`${API_BASE}/reports`);
  return res.json();
}

export async function saveReport(report) {
  const res = await fetch(`${API_BASE}/reports`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(report),
  });
  return res.json();
}

export async function updateReport(id, updates) {
  const res = await fetch(`${API_BASE}/reports/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updates),
  });
  return res.json();
}

export async function deleteReport(id) {
  const res = await fetch(`${API_BASE}/reports/${id}`, { method: "DELETE" });
  return res.json();
}

export async function getOnboardingStatus() {
  const res = await fetch(`${API_BASE}/onboarding/status`);
  return res.json();
}

export async function resetOnboarding() {
  const res = await fetch(`${API_BASE}/onboarding/reset`, { method: "POST" });
  return res.json();
}

export async function getLogs(page = 1) {
  const res = await fetch(`${API_BASE}/logs?page=${page}`);
  return res.json();
}

export async function getThemeStats() {
  const res = await fetch(`${API_BASE}/stats/themes`);
  return res.json();
}

export async function getUsageStats() {
  const res = await fetch(`${API_BASE}/stats/usage`);
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
