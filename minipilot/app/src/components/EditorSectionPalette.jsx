import { BarChart3, PieChart, Table2, TrendingUp, Type } from "lucide-react";

const SECTION_TYPES = [
  { type: "bar",        label: "Barres",     icon: BarChart3 },
  { type: "pie",        label: "Camembert",  icon: PieChart },
  { type: "table",      label: "Tableau",    icon: Table2 },
  { type: "area_multi", label: "Aires",      icon: TrendingUp },
  { type: "text",       label: "Texte",      icon: Type },
];

export function createSection(type) {
  const id = crypto.randomUUID();
  if (type === "text") {
    return { id, title: "Section texte", type: "text", html: "" };
  }
  return {
    id,
    title: "Nouvelle section",
    type,
    insight: "",
    data: [],
    config: { xKey: "", yKeys: [], colors: [], names: [], bars: [], line: null },
  };
}

export default function EditorSectionPalette({ onAdd }) {
  return (
    <div style={{ padding: 16, borderBottom: "1px solid var(--mp-border)" }}>
      <span style={{
        display: "block",
        marginBottom: 10,
        fontFamily: "var(--font-data)",
        fontSize: 10,
        textTransform: "uppercase",
        letterSpacing: "0.1em",
        color: "var(--mp-text-muted)",
      }}>
        Ajouter une section
      </span>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {SECTION_TYPES.map(({ type, label, icon: Icon }) => (
          <button
            key={type}
            onClick={() => onAdd(createSection(type))}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "6px 12px",
              background: "var(--mp-bg-elevated)",
              border: "1px solid var(--mp-border)",
              borderRadius: "var(--radius-sm)",
              cursor: "pointer",
              color: "var(--mp-text-secondary)",
              fontSize: 12,
              fontFamily: "var(--font-body)",
              transition: "border-color 150ms ease, color 150ms ease",
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = "var(--mp-accent)";
              e.currentTarget.style.color = "var(--mp-accent)";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = "var(--mp-border)";
              e.currentTarget.style.color = "var(--mp-text-secondary)";
            }}
          >
            <Icon size={13} />
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
