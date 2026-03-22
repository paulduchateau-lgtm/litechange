import { useState } from "react";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, AreaChart, Area, ComposedChart,
} from "recharts";
import { ChevronDown, ChevronUp, Table, BarChart3, MessageSquare } from "lucide-react";
import { useChartTheme } from "../data/theme";

function formatValue(val, fmt) {
  if (fmt === "money") return typeof val === "number" ? (val >= 1e6 ? `${(val/1e6).toFixed(1)}M €` : val >= 1000 ? `${Math.round(val/1000)}k €` : `${val} €`) : val;
  if (fmt === "eur") return typeof val === "number" ? `${val} €` : val;
  if (fmt === "pct") return typeof val === "number" ? `${val.toFixed(1)}%` : val;
  return val;
}

function getHighlightColor(val) {
  const n = typeof val === "number" ? val : parseFloat(String(val));
  if (isNaN(n)) {
    if (String(val).includes("Critique")) return "#C45A32";
    if (String(val).includes("Élevé")) return "#C45A32";
    if (String(val).includes("Moyen")) return "#D4A03A";
    return "#3A8A4A";
  }
  if (n > 100) return "#C45A32";
  if (n > 85) return "#D4A03A";
  return "#3A8A4A";
}

function RiskBadge({ value }) {
  const isElevated = value === "Élevé" || value === "Critique";
  const isMedium = value === "Moyen";
  const dotColor = isElevated ? "#C45A32" : isMedium ? "#D4A03A" : "#3A8A4A";
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      background: dotColor + "18", padding: "2px 10px", borderRadius: 9999,
      fontFamily: "var(--font-data)", fontSize: 10, textTransform: "uppercase",
      letterSpacing: "0.1em", color: dotColor,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: dotColor, flexShrink: 0 }} />
      {value}
    </span>
  );
}

function DataTable({ section }) {
  // Derive columns from data keys if columns not provided by AI
  const columns = section.columns || (
    section.data?.length > 0
      ? Object.keys(section.data[0]).map(key => ({ key, label: key, align: typeof section.data[0][key] === "number" ? "right" : "left" }))
      : []
  );
  const data = section.data || [];

  if (columns.length === 0) return <p style={{ fontSize: 13, color: "var(--mp-text-muted)" }}>Aucune donnée à afficher.</p>;

  return (
    <div style={{ overflow: "auto", borderRadius: "var(--radius-sm)", border: "1px solid var(--mp-border)" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr style={{ background: "var(--mp-bg)" }}>
            {columns.map(col => (
              <th key={col.key} style={{
                padding: "10px 14px",
                textAlign: col.align || "left",
                color: "var(--mp-text-muted)",
                fontFamily: "var(--font-data)",
                fontWeight: 500,
                fontSize: 11,
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                borderBottom: "1px solid var(--mp-border)",
                whiteSpace: "nowrap",
              }}>{col.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, ri) => (
            <tr key={ri} style={{
              background: ri % 2 === 0 ? "transparent" : "var(--mp-bg)",
              borderBottom: "1px solid var(--mp-border-subtle)",
              transition: "background 0.15s",
            }}
            onMouseEnter={e => e.currentTarget.style.background = "var(--mp-accent-dim)"}
            onMouseLeave={e => e.currentTarget.style.background = ri % 2 === 0 ? "transparent" : "var(--mp-bg)"}
            >
              {columns.map(col => {
                let val = row[col.key];
                let color = "var(--mp-text)";

                if (col.key === "risque") {
                  return <td key={col.key} style={{ padding: "10px 14px" }}><RiskBadge value={val} /></td>;
                }

                val = formatValue(val, col.fmt);
                if (col.hl) color = getHighlightColor(row[col.key]);

                return (
                  <td key={col.key} style={{
                    padding: "10px 14px",
                    textAlign: col.align || "left",
                    color,
                    fontFamily: (col.fmt || col.align === "right") ? "var(--font-data)" : "inherit",
                    fontSize: col.align === "right" ? 12 : 13,
                    fontVariantNumeric: "tabular-nums",
                    whiteSpace: "nowrap",
                  }}>{val}</td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function RenderSection({ section, feedbackMode, sectionFeedback, onSectionFeedback, sectionIndex }) {
  const [expanded, setExpanded] = useState(true);
  const [annotating, setAnnotating] = useState(false);
  const ct = useChartTheme();
  const h = 300;
  const c = section.config || {};

  // Remap report colors to current theme
  const remapColor = (color) => {
    const map = { "#C8FF3C": ct.lite, "#4A90B8": ct.signal, "#C45A32": ct.warm, "#D4A03A": ct.warning, "#8B7EC8": ct.purple, "#3A8A4A": ct.success, "#6B8A1A": ct.lite };
    return map[color] || color;
  };

  const noData = <p style={{ fontSize: 13, color: "var(--mp-text-muted)" }}>Aucune donnée à afficher.</p>;

  const renderChart = () => {
    try {
      if (!section.type) return null;

      switch (section.type) {
        case "composed":
          if (!section.data?.length) return noData;
          return (
            <ResponsiveContainer width="100%" height={h}>
              <ComposedChart data={section.data}>
                <CartesianGrid strokeDasharray="3 3" stroke={ct.grid} />
                <XAxis dataKey={c.xKey} tick={ct.axis} axisLine={{ stroke: ct.grid }} />
                <YAxis yAxisId="left" tick={ct.axis} axisLine={{ stroke: ct.grid }} />
                <YAxis yAxisId="right" orientation="right" tick={ct.axis} axisLine={{ stroke: ct.grid }} />
                <Tooltip contentStyle={ct.tooltip} />
                <Legend wrapperStyle={{ fontSize: 11, fontFamily: "'DM Sans'" }} />
                {c.bars?.map(b => <Bar key={b.key} yAxisId="left" dataKey={b.key} fill={remapColor(b.color)} name={b.name} radius={[3,3,0,0]} />)}
                {c.line && <Line yAxisId="right" type="monotone" dataKey={c.line.key} stroke={remapColor(c.line.color)} name={c.line.name} strokeWidth={2.5} dot={{ r:3, fill:remapColor(c.line.color) }} />}
              </ComposedChart>
            </ResponsiveContainer>
          );

        case "bar":
          if (!section.data?.length || !c.yKeys?.length) return noData;
          return (
            <ResponsiveContainer width="100%" height={h}>
              <BarChart data={section.data}>
                <CartesianGrid strokeDasharray="3 3" stroke={ct.grid} />
                <XAxis dataKey={c.xKey} tick={ct.axis} axisLine={{ stroke: ct.grid }} />
                <YAxis tick={ct.axis} axisLine={{ stroke: ct.grid }} />
                <Tooltip contentStyle={ct.tooltip} />
                {c.yKeys.map((k,i) => <Bar key={k} dataKey={k} fill={remapColor(c.colors?.[i]) || ct.colors[i]} radius={[3,3,0,0]} />)}
              </BarChart>
            </ResponsiveContainer>
          );

        case "grouped_bar":
          if (!section.data?.length || !c.yKeys?.length) return noData;
          return (
            <ResponsiveContainer width="100%" height={h}>
              <BarChart data={section.data}>
                <CartesianGrid strokeDasharray="3 3" stroke={ct.grid} />
                <XAxis dataKey={c.xKey} tick={ct.axis} axisLine={{ stroke: ct.grid }} />
                <YAxis tick={ct.axis} axisLine={{ stroke: ct.grid }} />
                <Tooltip contentStyle={ct.tooltip} />
                <Legend wrapperStyle={{ fontSize: 11, fontFamily: "'DM Sans'" }} />
                {c.yKeys.map((k,i) => <Bar key={k} dataKey={k} fill={remapColor(c.colors?.[i]) || ct.colors[i]} name={c.names?.[i] || k} radius={[3,3,0,0]} />)}
              </BarChart>
            </ResponsiveContainer>
          );

        case "area_multi":
          if (!section.data?.length || !c.yKeys?.length) return noData;
          return (
            <ResponsiveContainer width="100%" height={h}>
              <AreaChart data={section.data}>
                <defs>
                  {c.yKeys.map((k,i) => (
                    <linearGradient key={k} id={`ag_${k}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={remapColor(c.colors?.[i]) || ct.colors[i]} stopOpacity={0.25} />
                      <stop offset="95%" stopColor={remapColor(c.colors?.[i]) || ct.colors[i]} stopOpacity={0} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={ct.grid} />
                <XAxis dataKey={c.xKey} tick={ct.axis} axisLine={{ stroke: ct.grid }} />
                <YAxis tick={ct.axis} axisLine={{ stroke: ct.grid }} />
                <Tooltip contentStyle={ct.tooltip} />
                <Legend wrapperStyle={{ fontSize: 11, fontFamily: "'DM Sans'" }} />
                {c.yKeys.map((k,i) => <Area key={k} type="monotone" dataKey={k} stroke={remapColor(c.colors?.[i]) || ct.colors[i]} fill={`url(#ag_${k})`} name={c.names?.[i] || k} strokeWidth={2} />)}
              </AreaChart>
            </ResponsiveContainer>
          );

        case "pie_multi":
          if (!section.data_sets?.length) return noData;
          return (
            <div style={{ display: "flex", gap: 40, justifyContent: "center", flexWrap: "wrap" }}>
              {section.data_sets.map((ds, di) => {
                const items = ds.data || [];
                return (
                  <div key={di} style={{ textAlign: "center", minWidth: 280 }}>
                    <span className="data-label" style={{ display: "block", marginBottom: 8 }}>{ds.label}</span>
                    <ResponsiveContainer width="100%" height={220}>
                      <PieChart>
                        <Pie data={items} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80}
                          label={false}
                          strokeWidth={2} stroke="var(--mp-bg)">
                          {items.map((_, i) => <Cell key={i} fill={ct.colors[i % ct.colors.length]} />)}
                        </Pie>
                        <Tooltip
                          contentStyle={ct.tooltip}
                          formatter={(value, name) => [value, name]}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    {/* Legend below */}
                    <div style={{
                      display: "flex", flexWrap: "wrap", gap: "6px 14px",
                      justifyContent: "center", marginTop: 4, padding: "0 8px",
                    }}>
                      {items.map((item, i) => (
                        <div key={i} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                          <span style={{
                            width: 8, height: 8, borderRadius: 2, flexShrink: 0,
                            background: ct.colors[i % ct.colors.length],
                          }} />
                          <span style={{
                            fontFamily: "var(--font-data)", fontSize: 10,
                            color: "var(--mp-text-muted)", whiteSpace: "nowrap",
                          }}>
                            {item.name}: <strong style={{ color: "var(--mp-text)" }}>{item.value}</strong>
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          );

        case "table":
          return <DataTable section={section} />;

        default:
          return null;
      }
    } catch (err) {
      console.error("[RenderSection] render error:", err, section);
      return (
        <div style={{
          padding: "12px 16px", background: "var(--mp-bg-elevated)",
          borderRadius: "var(--radius-sm)", border: "1px solid var(--mp-border)",
        }}>
          <p style={{ fontSize: 12, color: "var(--mp-text-muted)", margin: 0 }}>
            Impossible d'afficher cette section ({section.type})
          </p>
        </div>
      );
    }
  };

  return (
    <div style={{
      background: "var(--mp-bg-card)",
      border: "1px solid var(--mp-border)",
      borderRadius: "var(--radius-md)",
      marginBottom: 16,
      overflow: "hidden",
      transition: "background 0.3s, border-color 0.3s",
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <button
          onClick={() => setExpanded(!expanded)}
          style={{
            flex: 1, display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "14px 20px", background: "none", border: "none", cursor: "pointer",
            color: "var(--mp-text)", fontFamily: "var(--font-body)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {section.type === "table" ? <Table size={14} color="var(--mp-text-muted)" /> : <BarChart3 size={14} color="var(--mp-text-muted)" />}
            <span style={{ fontSize: 14, fontWeight: 500 }}>{section.title}</span>
          </div>
          {expanded ? <ChevronUp size={16} color="var(--mp-text-muted)" /> : <ChevronDown size={16} color="var(--mp-text-muted)" />}
        </button>
        {feedbackMode && (
          <button
            onClick={() => setAnnotating(!annotating)}
            title="Annoter cette section"
            aria-label="Annoter cette section"
            style={{
              background: "none", border: "none", cursor: "pointer",
              padding: "9px 14px", borderRadius: "var(--radius-sm)",
              display: "flex", alignItems: "center",
              flexShrink: 0,
            }}
          >
            <MessageSquare
              size={14}
              color={sectionFeedback ? "var(--mp-accent)" : "var(--mp-text-muted)"}
            />
          </button>
        )}
      </div>
      {expanded && (
        <div style={{ padding: "0 20px 20px" }}>
          {section.insight && (
            <div style={{
              background: "var(--mp-bg-elevated)",
              borderRadius: "var(--radius-sm)",
              padding: "10px 14px",
              marginBottom: 14,
              borderLeft: "3px solid var(--mp-accent)",
              transition: "background 0.3s, border-color 0.3s",
            }}>
              <p style={{ fontSize: 12, color: "var(--mp-text-secondary)", lineHeight: 1.7, margin: 0 }}>{section.insight}</p>
            </div>
          )}
          {renderChart()}
          {feedbackMode && annotating && (
            <textarea
              value={sectionFeedback || ""}
              onChange={e => onSectionFeedback(sectionIndex, e.target.value)}
              placeholder="Feedback spécifique à cette section (optionnel)"
              aria-label={`Feedback pour ${section.title}`}
              style={{
                width: "100%", marginTop: 8, fontSize: 14,
                fontFamily: "var(--font-body)",
                background: "var(--mp-bg)", border: "1px solid var(--mp-border)",
                borderRadius: "var(--radius-sm)", padding: "8px 12px",
                color: "var(--mp-text)", resize: "vertical", minHeight: 72,
                boxSizing: "border-box",
                opacity: 1, transition: "opacity 150ms ease",
              }}
            />
          )}
        </div>
      )}
    </div>
  );
}
