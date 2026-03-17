import { useState, useCallback, useEffect } from "react";
import { ThemeProvider } from "./data/theme";
import Sidebar from "./components/Sidebar";
import DashboardPage from "./components/DashboardPage";
import ChatPage from "./components/ChatPage";
import ReportsPage from "./components/ReportsPage";
import AdminPage from "./components/AdminPage";
import FullReport from "./components/FullReport";
import OnboardingWizard from "./components/onboarding/OnboardingWizard";
import { getOnboardingStatus, getReports, updateReport, resetOnboarding } from "./lib/api";

export default function App() {
  const [page, setPage] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [viewingReport, setViewingReport] = useState(null);

  // Onboarding state
  const [onboarded, setOnboarded] = useState(null); // null=loading, false=needs onboarding, true=done
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Dynamic reports from backend
  const [reports, setReports] = useState({ shared: [], private: [] });
  const [reportsLoading, setReportsLoading] = useState(true);

  // Check onboarding status on mount
  useEffect(() => {
    checkOnboarding();
  }, []);

  const checkOnboarding = async () => {
    try {
      const status = await getOnboardingStatus();
      if (status.step === "complete") {
        setOnboarded(true);
        setShowOnboarding(false);
        loadReports();
      } else {
        setOnboarded(false);
        setShowOnboarding(true);
      }
    } catch {
      // Server not running — show onboarding
      setOnboarded(false);
      setShowOnboarding(true);
    }
  };

  const loadReports = async () => {
    setReportsLoading(true);
    try {
      const data = await getReports();
      setReports(data);
    } catch {
      setReports({ shared: [], private: [] });
    }
    setReportsLoading(false);
  };

  const handleOnboardingComplete = (generatedReports) => {
    setOnboarded(true);
    setShowOnboarding(false);
    loadReports();
    setPage("dashboard");
  };

  const toggleStar = async (reportId) => {
    const allReports = [...reports.shared, ...reports.private];
    const report = allReports.find(r => r.id === reportId);
    if (!report) return;

    try {
      await updateReport(reportId, { starred: report.starred ? 0 : 1 });
      loadReports();
    } catch (e) {
      console.error("Failed to toggle star", e);
    }
  };

  const openReport = (reportId) => {
    const allReports = [...reports.shared, ...reports.private];
    const report = allReports.find(r => r.id === reportId);
    if (report) {
      setViewingReport(report);
      setPage("view_report");
    }
  };

  const goToChat = () => setPage("chat");

  const handleSetPage = (p) => {
    setPage(p);
    if (p !== "view_report") setViewingReport(null);
    if (p === "dashboard" || p === "reports") loadReports();
  };

  // Show onboarding wizard
  if (showOnboarding) {
    return (
      <ThemeProvider>
        <div style={{
          height: "100vh", width: "100%",
          background: "var(--mp-bg)",
          fontFamily: "var(--font-body)",
          color: "var(--mp-text)",
          overflow: "auto",
          transition: "background 0.3s, color 0.3s",
        }}>
          <OnboardingWizard onComplete={handleOnboardingComplete} />
        </div>
      </ThemeProvider>
    );
  }

  // Loading state
  if (onboarded === null) {
    return (
      <ThemeProvider>
        <div style={{
          height: "100vh", width: "100%",
          background: "var(--mp-bg)",
          fontFamily: "var(--font-body)",
          color: "var(--mp-text)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <div style={{ textAlign: "center" }}>
            <div style={{
              width: 48, height: 48, borderRadius: "var(--radius-md)",
              background: "var(--mp-accent-dim)",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 16px",
            }}>
              <span style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 600 }}>m</span>
            </div>
            <p style={{ color: "var(--mp-text-muted)", fontSize: 14 }}>Chargement...</p>
          </div>
        </div>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
    <div style={{
      display: "flex", height: "100vh", width: "100%",
      background: "var(--mp-bg)",
      fontFamily: "var(--font-body)",
      color: "var(--mp-text)",
      overflow: "hidden",
      transition: "background 0.3s, color 0.3s",
    }}>
      <Sidebar
        page={page}
        setPage={handleSetPage}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        onStartOnboarding={async () => {
          try { await resetOnboarding(); } catch {}
          setOnboarded(false);
          setShowOnboarding(true);
          setReports({ shared: [], private: [] });
        }}
      />

      <div style={{ flex: 1, overflow: "auto", display: "flex", flexDirection: "column" }}>
        {page === "dashboard" && (
          <DashboardPage
            reports={reports}
            reportsLoading={reportsLoading}
            toggleStar={toggleStar}
            openReport={openReport}
            goToChat={goToChat}
          />
        )}

        {page === "view_report" && viewingReport && (
          <div style={{ padding: 32, overflow: "auto" }}>
            <button
              onClick={() => setPage("reports")}
              style={{
                background: "none", border: "none", cursor: "pointer",
                color: "var(--mp-text-muted)", fontSize: 13,
                display: "flex", alignItems: "center", gap: 6,
                marginBottom: 16, fontFamily: "var(--font-body)", padding: 0,
              }}
            >← Retour aux rapports</button>
            <FullReport
              report={viewingReport}
              isFav={!!viewingReport.starred}
              onToggleFav={() => toggleStar(viewingReport.id)}
            />
          </div>
        )}

        {page === "chat" && (
          <ChatPage
            reports={reports}
            toggleStar={toggleStar}
            openReport={openReport}
            onReportGenerated={loadReports}
          />
        )}

        {page === "reports" && (
          <ReportsPage
            reports={reports}
            reportsLoading={reportsLoading}
            toggleStar={toggleStar}
            openReport={openReport}
            goToChat={goToChat}
          />
        )}

        {page === "admin" && <AdminPage />}
      </div>
    </div>
    </ThemeProvider>
  );
}
