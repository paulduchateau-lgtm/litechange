import { useState, useRef, useEffect, useCallback } from "react";
import { Send, MessageSquare, Database, FileText, Star, StarOff, Loader2, Sparkles, Save } from "lucide-react";
import { useWorkspaceApi } from "../lib/WorkspaceContext";
import RenderSection from "./RenderSection";

const SUGGESTIONS = [
  "Quels sont les principaux indicateurs de performance ?",
  "Montre-moi la répartition par catégorie",
  "Analyse les tendances sur les 12 derniers mois",
  "Quels sont les éléments les plus critiques ?",
  "Donne-moi un résumé global des données",
];

export default function ChatPage({ reports, toggleStar, openReport, onReportGenerated }) {
  const api = useWorkspaceApi();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);
  useEffect(() => { inputRef.current?.focus(); }, []);

  const handleSend = useCallback(async () => {
    if (!input.trim() || isTyping) return;
    const userMsg = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: userMsg }]);
    setIsTyping(true);

    try {
      const result = await api.chatMessage(userMsg, messages.map(m => ({ role: m.role, content: m.content })));

      setMessages(prev => [...prev, {
        role: "assistant",
        content: result.response,
        reportData: result.reportData || null,
        saved: false,
      }]);
    } catch (err) {
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "Désolé, une erreur est survenue lors de l'analyse. Vérifiez que le serveur est en cours d'exécution et réessayez.",
      }]);
    }

    setIsTyping(false);
  }, [input, isTyping, messages]);

  const handleSaveReport = async (msgIndex) => {
    const msg = messages[msgIndex];
    if (!msg?.reportData) return;

    try {
      await api.saveReport({
        ...msg.reportData,
        source: "chat",
        shared: 0,
        starred: 1,
      });
      setMessages(prev => prev.map((m, i) => i === msgIndex ? { ...m, saved: true } : m));
      if (onReportGenerated) onReportGenerated();
    } catch (err) {
      console.error("Failed to save report", err);
    }
  };

  const renderMarkdown = (text) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br/>');
  };

  const renderReportPreview = (reportData, msgIndex, isSaved) => {
    if (!reportData) return null;
    const kpis = typeof reportData.kpis === "string" ? JSON.parse(reportData.kpis) : (reportData.kpis || []);
    const sections = typeof reportData.sections === "string" ? JSON.parse(reportData.sections) : (reportData.sections || []);

    return (
      <div style={{
        marginTop: 16, background: "var(--mp-bg)",
        border: "1px solid var(--mp-border)", borderRadius: "var(--radius-md)",
        overflow: "hidden",
      }}>
        {/* Report header */}
        <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--mp-border)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <Sparkles size={14} color="var(--mp-accent)" />
            <span style={{ fontSize: 14, fontWeight: 500 }}>{reportData.title}</span>
          </div>
          {reportData.subtitle && (
            <p style={{ fontSize: 12, color: "var(--mp-text-muted)", margin: 0 }}>{reportData.subtitle}</p>
          )}
        </div>

        {/* KPIs preview */}
        {kpis.length > 0 && (
          <div style={{
            display: "grid",
            gridTemplateColumns: `repeat(${Math.min(kpis.length, 4)}, 1fr)`,
            gap: 1, background: "var(--mp-border)",
          }}>
            {kpis.slice(0, 4).map((kpi, i) => (
              <div key={i} style={{ background: "var(--mp-bg)", padding: "12px 14px" }}>
                <span className="data-label" style={{ fontSize: 9 }}>{kpi.label}</span>
                <span style={{
                  display: "block", fontSize: 18, fontWeight: 600,
                  fontFamily: "var(--font-body)", marginTop: 4,
                }}>{kpi.value}</span>
                {kpi.trend && (
                  <span className="data-value" style={{
                    fontSize: 10,
                    color: kpi.bad ? "var(--mp-warm)" : "var(--mp-success)",
                  }}>{kpi.trend}</span>
                )}
              </div>
            ))}
          </div>
        )}

        {/* First section chart preview */}
        {sections.length > 0 && (
          <div style={{ padding: "12px 18px" }}>
            <RenderSection section={sections[0]} />
          </div>
        )}

        {/* Actions */}
        <div style={{
          padding: "12px 18px", borderTop: "1px solid var(--mp-border)",
          display: "flex", gap: 8,
        }}>
          <button
            onClick={() => handleSaveReport(msgIndex)}
            disabled={isSaved}
            style={{
              background: isSaved ? "var(--mp-bg-elevated)" : "var(--mp-accent)",
              border: "none", borderRadius: "var(--radius-sm)",
              padding: "8px 16px",
              color: isSaved ? "var(--mp-text-muted)" : "var(--mp-accent-on)",
              cursor: isSaved ? "default" : "pointer",
              fontSize: 13, fontWeight: 500, display: "flex", alignItems: "center", gap: 6,
              fontFamily: "var(--font-body)",
            }}
          >
            {isSaved ? <><Star size={14} fill="#D4A03A" color="#D4A03A" /> Sauvegardé</> : <><Save size={14} /> Sauvegarder</>}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Header */}
      <div style={{
        padding: "14px 24px", borderBottom: "1px solid var(--mp-border)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div>
          <h2 style={{ fontSize: 17, fontWeight: 400, margin: 0, fontFamily: "var(--font-display)" }}>
            Explorateur de données
          </h2>
          <p style={{ fontSize: 12, color: "var(--mp-text-muted)", margin: 0, marginTop: 2 }}>
            Langage naturel → Analyse IA → Rapport métier
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Database size={13} color="var(--mp-text-muted)" />
          <span style={{ fontFamily: "var(--font-data)", fontSize: 11, color: "var(--mp-text-muted)" }}>
            Données connectées
          </span>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflow: "auto", padding: "24px 24px 12px" }}>
        {messages.length === 0 && (
          <div style={{
            display: "flex", flexDirection: "column", alignItems: "center",
            justifyContent: "center", height: "100%", gap: 20, paddingBottom: 60,
          }}>
            <div style={{
              width: 56, height: 56, borderRadius: "var(--radius-lg)",
              background: "var(--mp-accent-dim)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <MessageSquare size={24} color="var(--mp-accent)" />
            </div>
            <div style={{ textAlign: "center" }}>
              <p style={{ fontSize: 17, fontWeight: 300, marginBottom: 6, fontFamily: "var(--font-display)" }}>
                Quelle analyse souhaitez-vous ?
              </p>
              <p style={{ fontSize: 13, color: "var(--mp-text-muted)", maxWidth: 480 }}>
                Décrivez votre besoin et Minipilot génère un rapport complet avec KPIs, graphiques et tableaux.
              </p>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", maxWidth: 640 }}>
              {SUGGESTIONS.map(q => (
                <button
                  key={q}
                  onClick={() => setInput(q)}
                  style={{
                    background: "var(--mp-bg-card)", border: "1px solid var(--mp-border)",
                    borderRadius: "var(--radius-pill)", padding: "8px 16px",
                    color: "var(--mp-text-muted)", fontSize: 13, cursor: "pointer",
                    fontFamily: "var(--font-body)", transition: "all 0.15s",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--mp-accent)"; e.currentTarget.style.color = "var(--mp-accent)"; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--mp-border)"; e.currentTarget.style.color = "var(--mp-text-muted)"; }}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} style={{
            display: "flex",
            justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
            marginBottom: 16,
          }}>
            <div style={{
              maxWidth: msg.reportData ? 800 : 600,
              width: msg.reportData ? "100%" : undefined,
              background: msg.role === "user" ? "var(--mp-bg-elevated)" : "var(--mp-bg-card)",
              borderRadius: msg.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
              padding: "14px 18px",
              border: "1px solid var(--mp-border)",
            }}>
              <p
                style={{ fontSize: 14, lineHeight: 1.65, margin: 0 }}
                dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }}
              />
              {msg.reportData && renderReportPreview(msg.reportData, i, msg.saved)}
            </div>
          </div>
        ))}

        {isTyping && (
          <div style={{ display: "flex", marginBottom: 16 }}>
            <div style={{
              background: "var(--mp-bg-card)",
              borderRadius: "16px 16px 16px 4px", padding: "12px 20px",
              border: "1px solid var(--mp-border)",
              display: "flex", alignItems: "center", gap: 8,
            }}>
              <Loader2 size={15} color="var(--mp-accent)" style={{ animation: "spin 1s linear infinite" }} />
              <span style={{ fontSize: 13, color: "var(--mp-text-muted)" }}>
                Analyse des données — génération du rapport...
              </span>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input */}
      <div style={{ padding: "12px 24px 20px", borderTop: "1px solid var(--mp-border)" }}>
        <div style={{
          display: "flex", gap: 12, alignItems: "center",
          background: "var(--mp-bg-input)", borderRadius: "var(--radius-md)",
          padding: "4px 4px 4px 16px", border: "1px solid var(--mp-border)",
        }}>
          <input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && !e.shiftKey && handleSend()}
            placeholder="Posez votre question sur les données..."
            style={{
              flex: 1, background: "none", border: "none", outline: "none",
              color: "var(--mp-text)", fontSize: 14, fontFamily: "var(--font-body)",
              padding: "8px 0",
            }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isTyping}
            style={{
              background: input.trim() ? "var(--mp-accent)" : "var(--mp-border)",
              border: "none", borderRadius: "var(--radius-md)",
              width: 40, height: 40,
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: input.trim() ? "pointer" : "default",
              transition: "background 0.15s",
            }}
          >
            <Send size={18} color={input.trim() ? "var(--lc-olive-900)" : "var(--mp-text-muted)"} />
          </button>
        </div>
        <p style={{
          fontFamily: "var(--font-data)", fontSize: 10,
          color: "var(--mp-text-muted)", textAlign: "center",
          marginTop: 8, textTransform: "uppercase", letterSpacing: "0.1em",
        }}>
          Claude (Anthropic) — aucune donnée ne quitte votre infrastructure
        </p>
      </div>
    </div>
  );
}
