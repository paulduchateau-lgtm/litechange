import { useState } from "react";
import { Star, StarOff, Download, Loader2, ArrowUpRight, ArrowDownRight, BarChart3, Activity, TrendingUp, Heart, AlertTriangle, Users, FileText, Calendar, Clock, Eye, Stethoscope, Building2, MessageSquare } from "lucide-react";
import RenderSection from "./RenderSection";
import ReportFeedbackPanel from "./ReportFeedbackPanel";

// Map icon names to components for dynamic reports
const ICON_MAP = {
  BarChart3, Activity, TrendingUp, Heart, AlertTriangle, Users, FileText,
  Calendar, Clock, Eye, Stethoscope, Building2,
};

function getIcon(iconName) {
  if (typeof iconName === "function") return iconName; // Already a component
  return ICON_MAP[iconName] || BarChart3;
}

export default function FullReport({ report, isFav, onToggleFav, api, onReportUpdated }) {
  const [pdfLoading, setPdfLoading] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [iterateLoading, setIterateLoading] = useState(false);
  const [iterateError, setIterateError] = useState(null);
  const [sectionFeedbacks, setSectionFeedbacks] = useState({});

  const prefersReducedMotion = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const handleIterate = async (globalFeedback, sectionFeedback) => {
    setIterateLoading(true);
    setIterateError(null);
    try {
      const result = await api.iterateReport(report.id, globalFeedback, sectionFeedback);
      if (result.error) {
        setIterateError(result.error);
      } else {
        // Clear feedback state and sessionStorage after successful iterate
        sessionStorage.removeItem("feedback-global-" + report.id);
        sessionStorage.removeItem("feedback-sections-" + report.id);
        setSectionFeedbacks({});
        setFeedbackOpen(false);
        if (onReportUpdated) onReportUpdated(result.report);
      }
    } catch {
      setIterateError("La génération a échoué. Vérifiez votre connexion et réessayez.");
    } finally {
      setIterateLoading(false);
    }
  };

  const Icon = getIcon(report.icon);
  const kpis = typeof report.kpis === "string" ? JSON.parse(report.kpis) : (report.kpis || []);
  const sections = typeof report.sections === "string" ? JSON.parse(report.sections) : (report.sections || []);
  const color = report.color || "#4A90B8";

  return (
    <div style={{ maxWidth: 960, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
            <div style={{
              width: 36, height: 36, borderRadius: "var(--radius-md)",
              background: color + "18",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Icon size={18} color={color} />
            </div>
            <h2 style={{
              fontSize: 22, fontWeight: 400, margin: 0,
              fontFamily: "var(--font-display)", letterSpacing: "-0.02em",
            }}>{report.title}</h2>
          </div>
          <p style={{ fontSize: 13, color: "var(--mp-text-muted)", margin: 0, marginLeft: 46 }}>{report.subtitle}</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => setFeedbackOpen(!feedbackOpen)}
            style={{
              background: "transparent",
              border: feedbackOpen ? "1px solid var(--mp-accent)" : "1px solid var(--mp-border)",
              borderRadius: "var(--radius-sm)", padding: "8px 14px", cursor: "pointer",
              display: "flex", alignItems: "center", gap: 6,
              color: feedbackOpen ? "var(--mp-accent)" : "var(--mp-text-muted)",
              fontSize: 12, fontFamily: "var(--font-body)",
              transition: "color 150ms ease, border-color 150ms ease",
            }}
          >
            <MessageSquare size={14} />
            Améliorer
          </button>
          <button onClick={onToggleFav} style={{
            background: "var(--mp-bg-card)", border: "1px solid var(--mp-border)",
            borderRadius: "var(--radius-sm)", padding: "8px 14px", cursor: "pointer",
            display: "flex", alignItems: "center", gap: 6,
            color: isFav ? "#D4A03A" : "var(--mp-text-muted)",
            fontSize: 12, fontFamily: "var(--font-body)",
          }}>
            {isFav ? <Star size={14} fill="#D4A03A" /> : <StarOff size={14} />}
            {isFav ? "Favori" : "Ajouter"}
          </button>
          <button
            onClick={async () => {
              if (pdfLoading) return;
              setPdfLoading(true);
              try {
                const { generatePdf } = await import("../lib/generatePdf.js");
                await generatePdf(report);
              } catch (err) {
                console.error("[PDF] generation failed:", err);
              } finally {
                setPdfLoading(false);
              }
            }}
            style={{
              background: "var(--mp-bg-card)", border: "1px solid var(--mp-border)",
              borderRadius: "var(--radius-sm)", padding: "8px 14px", cursor: pdfLoading ? "wait" : "pointer",
              display: "flex", alignItems: "center", gap: 6,
              color: "var(--mp-text-muted)", fontSize: 12, fontFamily: "var(--font-body)",
              opacity: pdfLoading ? 0.6 : 1, transition: "opacity 0.2s",
            }}
            disabled={pdfLoading}
          >
            {pdfLoading ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> : <Download size={14} />}
            {pdfLoading ? "Génération…" : "PDF"}
          </button>
        </div>
      </div>

      {/* Objective */}
      {report.objective && (
        <div style={{
          background: "linear-gradient(135deg, var(--mp-accent-dim), transparent)",
          border: "1px solid var(--mp-border)",
          borderRadius: "var(--radius-md)",
          padding: "14px 18px", marginBottom: 20,
        }}>
          <span className="data-label" style={{ color: "var(--mp-accent)" }}>Objectif du rapport</span>
          <p style={{ fontSize: 13, color: "var(--mp-text-secondary)", margin: "6px 0 0", lineHeight: 1.6 }}>{report.objective}</p>
        </div>
      )}

      {/* KPIs */}
      {kpis.length > 0 && (
        <div style={{
          display: "grid", gridTemplateColumns: `repeat(${Math.min(kpis.length, 4)}, 1fr)`,
          gap: 12, marginBottom: 24,
        }}>
          {kpis.map((kpi, i) => {
            const K = getIcon(kpi.icon);
            return (
              <div key={i} className="animate-fade-up" style={{
                background: "var(--mp-bg-card)", border: "1px solid var(--mp-border)",
                borderRadius: "var(--radius-md)", padding: "14px 16px",
                animationDelay: `${i * 0.1}s`,
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <span className="data-label">{kpi.label}</span>
                  <K size={13} color="var(--mp-text-muted)" />
                </div>
                <span style={{
                  fontSize: 22, fontWeight: 600, letterSpacing: "-0.02em",
                  display: "block", fontFamily: "var(--font-body)",
                }}>{kpi.value}</span>
                <span className="data-value" style={{
                  fontSize: 11,
                  color: kpi.bad ? "var(--mp-warm)" : "var(--mp-success)",
                  display: "flex", alignItems: "center", gap: 3, marginTop: 3,
                }}>
                  {kpi.bad ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}
                  {kpi.trend}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Feedback panel */}
      <div style={{
        maxHeight: feedbackOpen ? 2000 : 0,
        overflow: "hidden",
        transition: prefersReducedMotion ? "none" : "max-height 200ms ease, opacity 200ms ease",
        opacity: feedbackOpen ? 1 : 0,
        marginBottom: feedbackOpen ? 20 : 0,
      }}>
        {feedbackOpen && (
          <ReportFeedbackPanel
            report={report}
            onSubmit={handleIterate}
            loading={iterateLoading}
            error={iterateError}
          />
        )}
      </div>

      {/* Sections */}
      {sections.map((s, i) => (
        <RenderSection
          key={i}
          section={s}
          feedbackMode={feedbackOpen}
          sectionFeedback={sectionFeedbacks[i] || ""}
          onSectionFeedback={(idx, text) => setSectionFeedbacks(prev => ({ ...prev, [idx]: text }))}
          sectionIndex={i}
        />
      ))}
    </div>
  );
}
