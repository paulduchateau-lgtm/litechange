import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Upload, Loader2, ChevronLeft } from "lucide-react";
import TemplateFieldMapper from "./TemplateFieldMapper";

export default function ImportReportPage({ api, slug }) {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [step, setStep] = useState(1); // 1=upload, 2=analyzing, 3=mapping
  const [fingerprint, setFingerprint] = useState(null);
  const [availableColumns, setAvailableColumns] = useState([]);
  const [error, setError] = useState(null);
  const [generating, setGenerating] = useState(false);

  const VALID_EXTENSIONS = [".xlsx", ".xls", ".docx", ".doc"];

  const getExtension = (filename) => {
    const idx = filename.lastIndexOf(".");
    return idx >= 0 ? filename.slice(idx).toLowerCase() : "";
  };

  const handleFileSelected = (file) => {
    if (!file) return;
    const ext = getExtension(file.name);
    if (!VALID_EXTENSIONS.includes(ext)) {
      setError("Format non supporté. Veuillez déposer un fichier .xlsx ou .docx.");
      return;
    }
    setError(null);
    setStep(2);
    handleUpload(file);
  };

  const handleUpload = async (file) => {
    try {
      setError(null);
      const result = await api.importTemplate(file);
      setFingerprint(result.fingerprint);
      setAvailableColumns(result.availableColumns);
      setStep(3);
    } catch (err) {
      setError(err.message || "Erreur lors de l'analyse du modele.");
      setStep(1);
    }
  };

  const handleConfirm = async (mapping) => {
    setGenerating(true);
    try {
      const suggestion = {
        title: fingerprint.title,
        description: fingerprint.objective || "Rapport importe depuis un modele",
        type: fingerprint.sections?.[0]?.type || "bar",
        columns: Object.values(mapping).filter(Boolean),
        kpis: fingerprint.kpis?.map(k => k.label) || [],
        templateFingerprint: fingerprint,
        columnMapping: mapping,
      };
      const result = await api.generateReport(suggestion);
      navigate(`/${slug}/report/${result.report.id}`);
    } catch (err) {
      setError(err.message || "Erreur lors de la generation du rapport.");
      setGenerating(false);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileSelected(file);
  };

  const handleInputChange = (e) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelected(file);
  };

  const goBack = () => navigate(`/${slug}/reports`);

  return (
    <div style={{ maxWidth: 680, margin: "0 auto", padding: 32, fontFamily: "var(--font-body)" }}>
      {/* Back link */}
      <button
        onClick={goBack}
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          color: "var(--mp-text-muted)",
          fontSize: 13,
          display: "flex",
          alignItems: "center",
          gap: 6,
          fontFamily: "var(--font-body)",
          padding: 0,
          marginBottom: 28,
        }}
      >
        <ChevronLeft size={15} />
        Retour aux rapports
      </button>

      {/* Step 1: Upload */}
      {step === 1 && (
        <div>
          <h1 style={{
            fontFamily: "var(--font-display)",
            fontSize: 28,
            fontWeight: 300,
            marginBottom: 8,
            color: "var(--mp-text)",
          }}>
            Importer un modele de rapport
          </h1>
          <p style={{
            fontSize: 14,
            color: "var(--mp-text-muted)",
            marginBottom: 32,
          }}>
            Deposez un fichier Excel (.xlsx) ou Word (.docx) pour recreer un rapport equivalent.
          </p>

          {error && (
            <div style={{
              color: "#C45A32",
              fontSize: 13,
              marginBottom: 16,
              padding: "10px 14px",
              background: "rgba(196,90,50,0.08)",
              borderRadius: "var(--radius-sm)",
              border: "1px solid rgba(196,90,50,0.2)",
            }}>
              {error}
            </div>
          )}

          <div
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            style={{
              border: "2px dashed var(--mp-border)",
              borderRadius: "var(--radius-md)",
              padding: 48,
              textAlign: "center",
              cursor: "pointer",
              transition: "border-color 0.2s, background 0.2s",
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = "var(--mp-accent)";
              e.currentTarget.style.background = "var(--mp-accent-dim)";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = "var(--mp-border)";
              e.currentTarget.style.background = "transparent";
            }}
          >
            <Upload size={32} color="var(--mp-text-muted)" style={{ marginBottom: 16 }} />
            <p style={{ fontSize: 15, fontWeight: 500, marginBottom: 6, color: "var(--mp-text)" }}>
              Deposer un fichier ici
            </p>
            <p style={{ fontSize: 13, color: "var(--mp-text-muted)" }}>
              ou cliquer pour parcourir — .xlsx, .xls, .docx, .doc
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.docx,.doc"
              onChange={handleInputChange}
              style={{ display: "none" }}
            />
          </div>
        </div>
      )}

      {/* Step 2: Analyzing */}
      {step === 2 && (
        <div style={{ textAlign: "center", paddingTop: 80 }}>
          <Loader2
            size={40}
            color="var(--mp-accent)"
            style={{ animation: "spin 1s linear infinite", marginBottom: 24 }}
          />
          <p style={{ fontSize: 14, color: "var(--mp-text-muted)", marginBottom: 8 }}>
            Analyse du modele en cours...
          </p>
          <p style={{ fontSize: 13, color: "var(--mp-text-tertiary, var(--mp-text-muted))" }}>
            L'IA identifie la structure, les KPIs et les champs de donnees.
          </p>
        </div>
      )}

      {/* Step 3: Field Mapping */}
      {step === 3 && fingerprint && (
        <div>
          <h1 style={{
            fontFamily: "var(--font-display)",
            fontSize: 24,
            fontWeight: 400,
            marginBottom: 8,
            color: "var(--mp-text)",
          }}>
            {fingerprint.title}
          </h1>

          {fingerprint.objective && (
            <p style={{
              fontSize: 14,
              color: "var(--mp-text-muted)",
              marginBottom: 20,
            }}>
              {fingerprint.objective}
            </p>
          )}

          {error && (
            <div style={{
              color: "#C45A32",
              fontSize: 13,
              marginBottom: 16,
              padding: "10px 14px",
              background: "rgba(196,90,50,0.08)",
              borderRadius: "var(--radius-sm)",
              border: "1px solid rgba(196,90,50,0.2)",
            }}>
              {error}
            </div>
          )}

          {/* KPIs detectes */}
          {fingerprint.kpis?.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <p style={{
                fontFamily: "var(--font-mono)",
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "var(--mp-text-muted)",
                marginBottom: 10,
              }}>
                KPIs detectes
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {fingerprint.kpis.map((kpi, i) => (
                  <span key={i} style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 10,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    padding: "4px 10px",
                    borderRadius: 9999,
                    background: "var(--mp-accent-dim)",
                    color: "var(--mp-accent-text, var(--mp-accent))",
                    border: "1px solid var(--mp-accent-border, var(--mp-border))",
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                  }}>
                    <span style={{
                      width: 6, height: 6, borderRadius: "50%",
                      background: "var(--mp-accent)", display: "inline-block", flexShrink: 0,
                    }} />
                    {kpi.label}{kpi.unit ? ` (${kpi.unit})` : ""}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Sections detectees */}
          {fingerprint.sections?.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <p style={{
                fontFamily: "var(--font-mono)",
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "var(--mp-text-muted)",
                marginBottom: 10,
              }}>
                Sections detectees
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {fingerprint.sections.map((section, i) => (
                  <div key={i} style={{
                    display: "flex", alignItems: "center", gap: 10,
                    fontSize: 13, color: "var(--mp-text-secondary)",
                  }}>
                    <span>{section.title}</span>
                    {section.type && (
                      <span style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: 10,
                        textTransform: "uppercase",
                        letterSpacing: "0.08em",
                        padding: "2px 8px",
                        borderRadius: 9999,
                        background: "var(--mp-bg-card)",
                        border: "1px solid var(--mp-border)",
                        color: "var(--mp-text-muted)",
                      }}>
                        {section.type}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Field Mapper */}
          {fingerprint.detectedFields?.length > 0 && (
            <div style={{ marginBottom: 8 }}>
              <p style={{
                fontFamily: "var(--font-mono)",
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "var(--mp-text-muted)",
                marginBottom: 14,
              }}>
                Correspondance des champs
              </p>
              <TemplateFieldMapper
                detectedFields={fingerprint.detectedFields}
                availableColumns={availableColumns}
                onConfirm={handleConfirm}
                loading={generating}
              />
            </div>
          )}

          {(!fingerprint.detectedFields || fingerprint.detectedFields.length === 0) && (
            <TemplateFieldMapper
              detectedFields={[]}
              availableColumns={availableColumns}
              onConfirm={handleConfirm}
              loading={generating}
            />
          )}
        </div>
      )}
    </div>
  );
}
