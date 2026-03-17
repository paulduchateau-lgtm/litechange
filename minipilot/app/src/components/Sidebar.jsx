import { X, LayoutDashboard, MessageSquare, FileText, Settings, Menu, Sun, Moon, RotateCcw } from "lucide-react";
import { useTheme } from "../data/theme";

const NAV_ITEMS = [
  { id: "dashboard", Icon: LayoutDashboard, label: "Dashboard" },
  { id: "chat", Icon: MessageSquare, label: "Explorer" },
  { id: "reports", Icon: FileText, label: "Rapports" },
  { id: "admin", Icon: Settings, label: "Admin" },
];

export default function Sidebar({ page, setPage, sidebarOpen, setSidebarOpen, onStartOnboarding }) {
  const { theme, toggle } = useTheme();
  if (!sidebarOpen) {
    return (
      <button
        onClick={() => setSidebarOpen(true)}
        style={{
          position: "fixed", top: 16, left: 16, zIndex: 50,
          width: 40, height: 40, borderRadius: "var(--radius-md)",
          background: "var(--mp-bg-card)", border: "1px solid var(--mp-border)",
          cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "var(--mp-shadow)",
        }}
      >
        <Menu size={18} color="var(--mp-text-muted)" />
      </button>
    );
  }

  return (
    <div style={{
      width: 260, minWidth: 260,
      background: "var(--mp-bg-elevated)",
      borderRight: "1px solid var(--mp-border)",
      display: "flex", flexDirection: "column",
      transition: "background 0.35s, border-color 0.35s",
    }}>
      {/* Logo */}
      <div style={{
        padding: "20px 20px 16px",
        display: "flex", alignItems: "center", gap: 12,
        borderBottom: "1px solid var(--mp-border)",
      }}>
        <button
          onClick={() => setSidebarOpen(false)}
          style={{ background: "none", border: "none", cursor: "pointer", padding: 4, display: "flex" }}
        >
          <X size={18} color="var(--mp-text-muted)" />
        </button>
        <div style={{ display: "flex", alignItems: "baseline", gap: 2 }}>
          <span style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 600 }}>mini</span>
          <span style={{
            fontFamily: "var(--font-display)", fontSize: 20,
            fontWeight: 300, fontStyle: "italic",
            color: "var(--mp-accent-text)",
          }}>pilot</span>
          <span className="data-label" style={{ marginLeft: 8, fontSize: 9 }}>v0.2</span>
        </div>
      </div>

      {/* Nav */}
      <div style={{ padding: "12px 8px", flex: 1 }}>
        {NAV_ITEMS.map(it => {
          const NavIcon = it.Icon;
          const isActive = page === it.id || (page === "view_report" && it.id === "reports");
          return (
            <button
              key={it.id}
              onClick={() => setPage(it.id)}
              onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = "var(--mp-nav-hover)"; }}
              onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = "transparent"; }}
              style={{
                width: "100%", display: "flex", alignItems: "center",
                gap: 12, padding: "10px 12px", marginBottom: 2,
                background: isActive ? "var(--mp-accent-dim)" : "transparent",
                border: "none", borderRadius: "var(--radius-sm)",
                cursor: "pointer",
                color: isActive ? "var(--mp-accent-text)" : "var(--mp-text-secondary)",
                fontSize: 13, fontWeight: isActive ? 500 : 400,
                fontFamily: "var(--font-body)",
                whiteSpace: "nowrap",
                transition: "background-color 120ms ease, color 120ms ease",
              }}
            >
              <NavIcon size={15} />
              <span>{it.label}</span>
            </button>
          );
        })}
      </div>

      {/* Reset onboarding */}
      {onStartOnboarding && (
        <div style={{ padding: "0 8px" }}>
          <button
            onClick={onStartOnboarding}
            onMouseEnter={e => e.currentTarget.style.background = "var(--mp-nav-hover)"}
            onMouseLeave={e => e.currentTarget.style.background = "transparent"}
            style={{
              width: "100%", display: "flex", alignItems: "center",
              gap: 10, padding: "9px 12px",
              background: "transparent",
              border: "none", borderRadius: "var(--radius-sm)",
              cursor: "pointer", color: "var(--mp-text-muted)",
              fontSize: 12, fontFamily: "var(--font-body)",
              transition: "background 200ms ease",
            }}
          >
            <RotateCcw size={13} />
            <span>Nouvel onboarding</span>
          </button>
        </div>
      )}

      {/* Theme Toggle */}
      <div style={{ padding: "8px 8px 0" }}>
        <button
          onClick={toggle}
          style={{
            width: "100%", display: "flex", alignItems: "center",
            gap: 10, padding: "9px 12px",
            background: "var(--mp-nav-hover)",
            border: "1px solid var(--mp-border)",
            borderRadius: "var(--radius-sm)",
            cursor: "pointer",
            color: "var(--mp-text-muted)",
            fontSize: 12, fontFamily: "var(--font-body)",
            transition: "background 200ms ease",
          }}
        >
          {theme === "dark" ? <Sun size={14} /> : <Moon size={14} />}
          <span>{theme === "dark" ? "Mode clair" : "Mode sombre"}</span>
        </button>
      </div>

      {/* DB Status */}
      <div style={{
        padding: "12px 16px",
        borderTop: "1px solid var(--mp-border)",
        marginTop: 8,
        display: "flex", alignItems: "center", gap: 8,
      }}>
        <div className="status-dot" />
        <span style={{
          fontFamily: "var(--font-data)", fontSize: 11,
          color: "var(--mp-text-muted)",
        }}>Données connectées</span>
      </div>
    </div>
  );
}
