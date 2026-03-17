import { Star, StarOff, BarChart3, Activity, TrendingUp, Heart, AlertTriangle, Users, FileText, Calendar, Clock, Eye, Stethoscope, Building2 } from "lucide-react";

const ICON_MAP = {
  BarChart3, Activity, TrendingUp, Heart, AlertTriangle, Users, FileText,
  Calendar, Clock, Eye, Stethoscope, Building2,
};

function getIcon(iconName) {
  if (typeof iconName === "function") return iconName;
  return ICON_MAP[iconName] || BarChart3;
}

export default function ReportCard({ report, isFav, onToggleFav, onClick, isShared }) {
  const Icon = getIcon(report.icon);
  const color = report.color || "#4A90B8";
  const kpis = typeof report.kpis === "string" ? JSON.parse(report.kpis) : (report.kpis || []);

  return (
    <div
      onClick={onClick}
      style={{
        background: "var(--mp-bg-card)",
        border: "1px solid var(--mp-border)",
        borderRadius: "var(--radius-md)",
        padding: 20,
        cursor: "pointer",
        transition: "all 0.2s",
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = color + "66";
        e.currentTarget.style.transform = "translateY(-2px)";
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = "var(--mp-border)";
        e.currentTarget.style.transform = "none";
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: "var(--radius-sm)",
            background: color + "18",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Icon size={16} color={color} />
          </div>
          <div>
            <span style={{ fontSize: 14, fontWeight: 500, display: "block" }}>{report.title}</span>
            {isShared && (
              <span style={{
                fontSize: 10, fontFamily: "var(--font-data)", textTransform: "uppercase",
                letterSpacing: "0.1em",
                background: "var(--mp-accent-dim)", color: "var(--mp-accent)",
                padding: "1px 8px", borderRadius: "var(--radius-pill)",
                display: "inline-flex", alignItems: "center", gap: 4,
              }}>
                <span style={{ width: 4, height: 4, borderRadius: "50%", background: "var(--mp-accent)" }} />
                partagé
              </span>
            )}
          </div>
        </div>
        <button
          onClick={e => { e.stopPropagation(); onToggleFav(); }}
          style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}
        >
          {isFav
            ? <Star size={15} color="#D4A03A" fill="#D4A03A" />
            : <StarOff size={15} color="var(--mp-text-muted)" />}
        </button>
      </div>

      <p style={{
        fontSize: 12, color: "var(--mp-text-muted)", lineHeight: 1.5,
        margin: "0 0 10px", overflow: "hidden",
        display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
      }}>{report.subtitle}</p>

      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {kpis.slice(0, 2).map((kpi, i) => (
          <div key={i} style={{
            background: "var(--mp-bg)", borderRadius: "var(--radius-sm)",
            padding: "5px 10px", display: "flex", alignItems: "center", gap: 5,
          }}>
            <span className="data-label" style={{ fontSize: 9 }}>{kpi.label}</span>
            <span className="data-value" style={{ fontSize: 12, fontWeight: 600 }}>{kpi.value}</span>
            <span className="data-value" style={{
              fontSize: 10,
              color: kpi.bad ? "var(--mp-warm)" : "var(--mp-success)",
            }}>{kpi.trend}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
