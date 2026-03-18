import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

// Load .env from the server directory (not cwd)
const __filename_env = fileURLToPath(import.meta.url);
dotenv.config({ path: path.join(path.dirname(__filename_env), ".env"), override: true });
import * as XLSX from "xlsx";
import { parse as csvParse } from "csv-parse/sync";
import Database from "better-sqlite3";
import Anthropic from "@anthropic-ai/sdk";
import { Mistral } from "@mistralai/mistralai";
import { v4 as uuidv4 } from "uuid";

// ─── Paths ───────────────────────────────────────────────────────────────────

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const IS_VERCEL = !!process.env.VERCEL;
const IS_DOCKER = !!process.env.DOCKER;
const UPLOADS_DIR = process.env.UPLOADS_DIR || (IS_VERCEL ? path.join("/tmp", "uploads") : path.join(__dirname, "uploads"));
const DB_PATH = process.env.DB_PATH || (IS_VERCEL ? path.join("/tmp", "minipilot.db") : path.join(__dirname, "minipilot.db"));

if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

// ─── Database setup ───────────────────────────────────────────────────────────

const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
  CREATE TABLE IF NOT EXISTS uploaded_files (
    id TEXT PRIMARY KEY,
    name TEXT,
    type TEXT,
    size INTEGER,
    columns TEXT,
    row_count INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS data_rows (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    file_id TEXT,
    sheet_name TEXT,
    row_data TEXT,
    FOREIGN KEY (file_id) REFERENCES uploaded_files(id)
  );

  CREATE TABLE IF NOT EXISTS clean_data (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    table_name TEXT,
    columns TEXT,
    row_data TEXT,
    source_file_id TEXT
  );

  CREATE TABLE IF NOT EXISTS project_context (
    id INTEGER PRIMARY KEY DEFAULT 1,
    project_name TEXT,
    industry TEXT,
    objectives TEXT,
    questionnaire TEXT,
    free_text TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS reports (
    id TEXT PRIMARY KEY,
    title TEXT,
    subtitle TEXT,
    objective TEXT,
    color TEXT,
    icon TEXT DEFAULT 'BarChart3',
    kpis TEXT,
    sections TEXT,
    shared INTEGER DEFAULT 0,
    starred INTEGER DEFAULT 0,
    source TEXT DEFAULT 'ai',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS chat_sessions (
    id TEXT PRIMARY KEY,
    workspace_id TEXT,
    title TEXT,
    messages TEXT DEFAULT '[]',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS usage_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    action TEXT,
    query TEXT,
    themes TEXT,
    user_id TEXT DEFAULT 'default',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS workspaces (
    id TEXT PRIMARY KEY,
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    industry TEXT,
    file_count INTEGER DEFAULT 0,
    row_count INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// ─── Migrations: add workspace_id to existing tables ─────────────────────────

try { db.exec("ALTER TABLE uploaded_files ADD COLUMN workspace_id TEXT REFERENCES workspaces(id)"); } catch {}
try { db.exec("ALTER TABLE clean_data ADD COLUMN workspace_id TEXT REFERENCES workspaces(id)"); } catch {}
try { db.exec("ALTER TABLE project_context ADD COLUMN workspace_id TEXT"); } catch {}
try { db.exec("ALTER TABLE reports ADD COLUMN workspace_id TEXT REFERENCES workspaces(id)"); } catch {}
try { db.exec("ALTER TABLE usage_logs ADD COLUMN workspace_id TEXT"); } catch {}
try { db.exec("ALTER TABLE reports ADD COLUMN trashed INTEGER DEFAULT 0"); } catch {}

// Backfill: if data exists but no workspaces, create a default workspace
{
  const wsCount = db.prepare("SELECT COUNT(*) AS cnt FROM workspaces").get().cnt;
  const existingFiles = db.prepare("SELECT COUNT(*) AS cnt FROM uploaded_files").get().cnt;
  if (wsCount === 0 && existingFiles > 0) {
    const ctx = db.prepare("SELECT * FROM project_context WHERE id = 1").get();
    const defaultId = uuidv4();
    const defaultSlug = "default";
    const defaultName = ctx?.project_name || "Mon espace";
    db.prepare("INSERT INTO workspaces (id, slug, name, industry, file_count, row_count) VALUES (?, ?, ?, ?, ?, ?)")
      .run(defaultId, defaultSlug, defaultName, ctx?.industry || null, existingFiles,
        db.prepare("SELECT COUNT(*) AS cnt FROM clean_data").get().cnt);
    db.prepare("UPDATE uploaded_files SET workspace_id = ? WHERE workspace_id IS NULL").run(defaultId);
    db.prepare("UPDATE clean_data SET workspace_id = ? WHERE workspace_id IS NULL").run(defaultId);
    db.prepare("UPDATE reports SET workspace_id = ? WHERE workspace_id IS NULL").run(defaultId);
    db.prepare("UPDATE usage_logs SET workspace_id = ? WHERE workspace_id IS NULL").run(defaultId);
    db.prepare("UPDATE project_context SET workspace_id = ? WHERE workspace_id IS NULL").run(defaultId);
    console.log(`Migrated existing data to default workspace: "${defaultName}" (/${defaultSlug})`);
  }
}

// ─── AI clients ──────────────────────────────────────────────────────────────
//
// Two modes, togglable at runtime via GET/POST /api/ai/mode:
//   "local"   → Ollama on localhost (Mistral, 100% offline, zero data leakage)
//   "premium" → Anthropic Claude → Mistral cloud fallback → Ollama last resort
//

const anthropic = process.env.ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null;

const mistralCloud = process.env.MISTRAL_API_KEY
  ? new Mistral({ apiKey: process.env.MISTRAL_API_KEY })
  : null;

const OLLAMA_BASE = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "ministral-3:3b";
const MISTRAL_CLOUD_MODEL = process.env.MISTRAL_CLOUD_MODEL || "ministral-3b-latest";

// Runtime AI mode — togglable via API
let aiMode = process.env.AI_MODE || "premium"; // "local" | "premium"

async function checkOllama() {
  try {
    const res = await fetch(`${OLLAMA_BASE}/api/tags`, { signal: AbortSignal.timeout(2000) });
    if (!res.ok) return { running: false, models: [] };
    const data = await res.json();
    const models = (data.models || []).map(m => m.name.replace(":latest", ""));
    return { running: true, models };
  } catch { return { running: false, models: [] }; }
}

// Log available providers on startup
(async () => {
  const ollama = await checkOllama();
  const providers = [];
  if (anthropic) providers.push("Anthropic (cloud)");
  if (mistralCloud) providers.push("Mistral (cloud)");
  if (ollama.running) providers.push(`Ollama [${ollama.models.join(", ") || "no models"}]`);
  console.log(`AI providers: ${providers.length ? providers.join(" · ") : "NONE"}`);
  console.log(`AI mode: ${aiMode}`);
  if (!anthropic && !ollama.running) {
    console.log("⚠  Pour l'IA : ANTHROPIC_API_KEY dans .env ou Ollama sur localhost:11434");
  }
})();

/**
 * Call Ollama chat API (100% local, zero internet)
 */
async function ollamaChat(messages, { maxTokens = 4096 } = {}) {
  const res = await fetch(`${OLLAMA_BASE}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      messages,
      stream: false,
      options: {
        num_predict: maxTokens,
        temperature: 0.2,
        repeat_penalty: 1.3,
        repeat_last_n: 128,
        top_k: 40,
        top_p: 0.9,
      },
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Ollama (${OLLAMA_MODEL}): ${err}`);
  }
  const data = await res.json();
  let text = data.message?.content || "";
  // Detect and truncate repetition loops (same 50+ char block repeated 3+ times)
  text = truncateRepetitions(text);
  return { text, provider: "ollama", model: OLLAMA_MODEL };
}

/**
 * Detect and truncate repetition loops from small LLMs.
 * If a chunk of 40+ chars is repeated 3+ times, cut at the second occurrence.
 */
function truncateRepetitions(text) {
  // Find repeated blocks of 40+ characters
  const match = text.match(/(.{40,}?)\1{2,}/s);
  if (match) {
    const repeatedBlock = match[1];
    const firstIdx = text.indexOf(repeatedBlock);
    const secondIdx = text.indexOf(repeatedBlock, firstIdx + repeatedBlock.length);
    if (secondIdx > firstIdx) {
      console.warn(`[ollama] Detected repetition loop (${repeatedBlock.length} chars repeated). Truncating.`);
      text = text.substring(0, secondIdx).trim();
    }
  }
  return text;
}

/**
 * Call Mistral cloud API (fallback for premium mode)
 */
async function mistralCloudChat(messages, { maxTokens = 4096 } = {}) {
  if (!mistralCloud) throw new Error("MISTRAL_API_KEY non configurée");
  const result = await mistralCloud.chat.complete({
    model: MISTRAL_CLOUD_MODEL,
    messages,
    maxTokens,
  });
  return { text: result.choices[0].message.content, provider: "mistral", model: MISTRAL_CLOUD_MODEL };
}

/**
 * Unified AI completion — route based on aiMode
 */
async function aiComplete(systemPrompt, userPrompt, { maxTokens = 4096 } = {}) {
  const msgs = [];
  if (systemPrompt) msgs.push({ role: "system", content: systemPrompt });
  msgs.push({ role: "user", content: userPrompt });

  if (aiMode === "local") {
    return ollamaChat(msgs, { maxTokens });
  }

  // Premium: Anthropic → Mistral cloud → Ollama
  if (anthropic) {
    try {
      const message = await anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: maxTokens,
        system: systemPrompt || undefined,
        messages: [{ role: "user", content: userPrompt }],
      });
      return { text: message.content[0].text, provider: "anthropic", model: "claude-sonnet-4" };
    } catch (err) {
      console.warn("[aiComplete] Anthropic failed:", err.message);
    }
  }

  if (mistralCloud) {
    try { return await mistralCloudChat(msgs, { maxTokens }); }
    catch (err) { console.warn("[aiComplete] Mistral cloud failed:", err.message); }
  }

  return ollamaChat(msgs, { maxTokens });
}

/**
 * Unified AI chat (multi-turn)
 */
async function aiChat(systemPrompt, chatMessages, { maxTokens = 4096 } = {}) {
  const ollamaMsgs = [];
  if (systemPrompt) ollamaMsgs.push({ role: "system", content: systemPrompt });
  ollamaMsgs.push(...chatMessages);

  if (aiMode === "local") {
    return ollamaChat(ollamaMsgs, { maxTokens });
  }

  // Premium: Anthropic → Mistral cloud → Ollama
  if (anthropic) {
    try {
      const response = await anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: maxTokens,
        system: systemPrompt || undefined,
        messages: chatMessages,
      });
      return { text: response.content[0].text, provider: "anthropic", model: "claude-sonnet-4" };
    } catch (err) {
      console.warn("[aiChat] Anthropic failed:", err.message);
    }
  }

  if (mistralCloud) {
    try { return await mistralCloudChat(ollamaMsgs, { maxTokens }); }
    catch (err) { console.warn("[aiChat] Mistral cloud failed:", err.message); }
  }

  return ollamaChat(ollamaMsgs, { maxTokens });
}

// ─── Express app ─────────────────────────────────────────────────────────────

const app = express();
const ALLOWED_ORIGINS = IS_VERCEL
  ? [/\.vercel\.app$/, /localhost/]
  : ["http://localhost:5173", "http://localhost:5183", "http://localhost:5174"];
app.use(cors({ origin: ALLOWED_ORIGINS }));
app.use(express.json({ limit: "10mb" }));

// ─── Multer config ────────────────────────────────────────────────────────────

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => {
    const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
    cb(null, `${uuidv4()}_${safe}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
      "text/csv",
      "application/json",
      "text/plain",
    ];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(file.mimetype) || [".xlsx", ".xls", ".csv", ".json"].includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`Type de fichier non supporté : ${file.mimetype}`));
    }
  },
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Normalize a column name: strip accents, lowercase, replace spaces/specials
 * with underscores.
 */
function normalizeColumnName(name) {
  return String(name)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

/**
 * Convert French number strings like "1 234,56" to JS number 1234.56.
 * Returns the original value if conversion is not applicable.
 */
function parseFrenchNumber(val) {
  if (typeof val === "number") return val;
  if (typeof val !== "string") return val;
  const cleaned = val.replace(/\s/g, "").replace(",", ".");
  const n = Number(cleaned);
  return isNaN(n) ? val : n;
}

/**
 * Detect whether a string looks like a date.
 */
function looksLikeDate(val) {
  if (typeof val !== "string") return false;
  // ISO dates or DD/MM/YYYY or DD-MM-YYYY
  return /^\d{4}-\d{2}-\d{2}/.test(val) || /^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}$/.test(val);
}

/**
 * Normalize a date string to ISO format YYYY-MM-DD.
 */
function normalizeDate(val) {
  if (/^\d{4}-\d{2}-\d{2}/.test(val)) return val.slice(0, 10);
  // DD/MM/YYYY or DD-MM-YYYY
  const m = val.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (m) return `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`;
  return val;
}

/**
 * Detect column type from a sample of non-null values.
 */
function detectType(samples) {
  if (samples.length === 0) return "string";
  const allNum = samples.every(v => {
    const n = parseFrenchNumber(v);
    return typeof n === "number";
  });
  if (allNum) return "number";
  const allDate = samples.every(v => looksLikeDate(String(v)));
  if (allDate) return "date";
  return "string";
}

/**
 * Extract 1-3 keyword themes from a French query string (simple noun heuristic).
 */
function extractThemes(query) {
  const stopwords = new Set([
    "le","la","les","de","du","des","un","une","et","ou","en","au","aux","par",
    "sur","dans","avec","pour","qui","que","quoi","quelle","quel","quels","quelles",
    "est","sont","était","avez","avoir","être","faire","quel","je","tu","il","elle",
    "nous","vous","ils","me","te","se","mon","ma","mes","ton","ta","tes","son","sa",
    "ses","notre","votre","leur","leurs","ce","cet","cette","ces","plus","moins",
    "très","bien","tout","tous","toute","toutes","comment","pourquoi","quand","où",
    "combien","quelle","quel","analyse","rapport","données","montrer","afficher",
    "voir","regarder","donner","obtenir","vouloir","pouvoir","souhaitez","besoin",
  ]);

  const words = query
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z\s]/g, " ")
    .split(/\s+/)
    .filter(w => w.length > 3 && !stopwords.has(w));

  // Deduplicate and take up to 3
  return [...new Set(words)].slice(0, 3);
}

/**
 * Extract report JSON from AI response. Tries multiple patterns:
 * 1. <REPORT_DATA>{ ... }</REPORT_DATA> tags
 * 2. ```json { ... } ``` markdown code blocks
 * 3. Bare JSON object with "title" and "sections" keys
 * Returns { json: parsed object, cleanText: response without the JSON block } or null
 */
/**
 * Clean common JSON issues produced by small LLMs:
 * - // comments
 * - Trailing commas
 * - Unquoted values like 34 320 000 € → "34320000"
 * - NaN, undefined, Infinity
 */
function cleanLlmJson(str) {
  return str
    .replace(/\/\/[^\n]*/g, "")                     // Remove // comments
    .replace(/,\s*([\]}])/g, "$1")                   // Remove trailing commas
    // Fix unquoted numeric values with spaces/symbols: 34 320 000 € → "34320000"
    .replace(/:\s*(\d[\d\s]+\d)\s*[€%$£]?\s*([,\}\]])/g, (_, num, after) => {
      return `: "${num.replace(/\s/g, '')}"${after}`;
    })
    // Fix bare currency/unit values: 500 000 adhérents → "500000"
    .replace(/:\s*(\d[\d\s]+)\s*[a-zA-Zéèêàùôîûç]+\s*([,\}\]])/g, (_, num, after) => {
      return `: "${num.replace(/\s/g, '')}"${after}`;
    })
    // Fix NaN, undefined, Infinity
    .replace(/:\s*(NaN|undefined|Infinity)\s*([,\}\]])/g, ': null$2');
}

function extractReportFromResponse(rawResponse) {
  // Strategy 1: <REPORT_DATA> tags
  const tagMatch = rawResponse.match(/<REPORT_DATA>([\s\S]*?)<\/REPORT_DATA>/);
  if (tagMatch) {
    try {
      const cleaned = cleanLlmJson(tagMatch[1].trim());
      const json = JSON.parse(cleaned);
      if (json.title || json.sections) {
        const cleanText = rawResponse.replace(/<REPORT_DATA>[\s\S]*?<\/REPORT_DATA>/g, "").trim();
        return { json, cleanText };
      }
    } catch (e) {
      console.warn("[extractReport] REPORT_DATA tag parse failed:", e.message);
    }
  }

  // Strategy 2: ```json ... ``` code blocks
  const codeBlockMatch = rawResponse.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
  if (codeBlockMatch) {
    try {
      const cleaned = cleanLlmJson(codeBlockMatch[1]);
      const json = JSON.parse(cleaned);
      if (json.title || json.sections) {
        const cleanText = rawResponse.replace(/```(?:json)?\s*\{[\s\S]*?\}\s*```/g, "").trim();
        return { json, cleanText };
      }
    } catch (e) {
      console.warn("[extractReport] code block JSON parse failed:", e.message);
    }
  }

  // Strategy 3: Find a bare JSON object containing "title" and "sections"
  const bareMatch = rawResponse.match(/(\{"id"[\s\S]*?"sections"\s*:\s*\[[\s\S]*?\]\s*\})/);
  if (bareMatch) {
    try {
      const cleaned = cleanLlmJson(bareMatch[1]);
      const json = JSON.parse(cleaned);
      if (json.title && json.sections) {
        const cleanText = rawResponse.replace(bareMatch[0], "").trim();
        return { json, cleanText };
      }
    } catch (e) {
      console.warn("[extractReport] bare JSON parse failed:", e.message);
    }
  }

  return null;
}

/**
 * Generate a URL-safe slug from a workspace name, ensuring uniqueness.
 */
function generateSlug(name) {
  let slug = String(name)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  if (!slug) slug = "espace";
  const existing = db.prepare("SELECT COUNT(*) AS cnt FROM workspaces WHERE slug = ?").get(slug).cnt;
  if (existing > 0) {
    slug = `${slug}-${Date.now().toString(36).slice(-4)}`;
  }
  return slug;
}

/**
 * Build a compact data summary for AI prompts: schema + sample rows.
 */
function buildDataSummary(maxSampleRows = 5, workspaceId = null) {
  const wsFilter = workspaceId ? " WHERE workspace_id = ?" : "";
  const wsParams = workspaceId ? [workspaceId] : [];

  const tables = db
    .prepare(`SELECT DISTINCT table_name FROM clean_data${wsFilter}`)
    .all(...wsParams)
    .map(r => r.table_name);

  if (tables.length === 0) {
    // Fall back to raw uploaded files
    const filesQuery = workspaceId
      ? "SELECT * FROM uploaded_files WHERE workspace_id = ?"
      : "SELECT * FROM uploaded_files";
    const files = workspaceId
      ? db.prepare(filesQuery).all(workspaceId)
      : db.prepare(filesQuery).all();
    return files.map(f => ({
      name: f.name,
      columns: JSON.parse(f.columns || "[]"),
      rowCount: f.row_count,
      sample: db
        .prepare("SELECT row_data FROM data_rows WHERE file_id = ? LIMIT ?")
        .all(f.id, maxSampleRows)
        .map(r => JSON.parse(r.row_data)),
    }));
  }

  return tables.map(tableName => {
    const colsFilter = workspaceId
      ? "SELECT columns FROM clean_data WHERE table_name = ? AND workspace_id = ? LIMIT 1"
      : "SELECT columns FROM clean_data WHERE table_name = ? LIMIT 1";
    const colsRow = workspaceId
      ? db.prepare(colsFilter).get(tableName, workspaceId)
      : db.prepare(colsFilter).get(tableName);
    const cols = colsRow ? JSON.parse(colsRow.columns) : [];

    const countFilter = workspaceId
      ? "SELECT COUNT(*) AS cnt FROM clean_data WHERE table_name = ? AND workspace_id = ?"
      : "SELECT COUNT(*) AS cnt FROM clean_data WHERE table_name = ?";
    const rowCount = workspaceId
      ? db.prepare(countFilter).get(tableName, workspaceId).cnt
      : db.prepare(countFilter).get(tableName).cnt;

    const sampleFilter = workspaceId
      ? "SELECT row_data FROM clean_data WHERE table_name = ? AND workspace_id = ? LIMIT ?"
      : "SELECT row_data FROM clean_data WHERE table_name = ? LIMIT ?";
    const sample = workspaceId
      ? db.prepare(sampleFilter).all(tableName, workspaceId, maxSampleRows).map(r => JSON.parse(r.row_data))
      : db.prepare(sampleFilter).all(tableName, maxSampleRows).map(r => JSON.parse(r.row_data));

    return { name: tableName, columns: cols, rowCount, sample };
  });
}

/**
 * Build a column stats summary for AI prompts.
 */
function buildColumnStats(workspaceId = null) {
  const wsFilter = workspaceId ? " WHERE workspace_id = ?" : "";
  const wsParams = workspaceId ? [workspaceId] : [];

  const tables = db
    .prepare(`SELECT DISTINCT table_name FROM clean_data${wsFilter}`)
    .all(...wsParams)
    .map(r => r.table_name);

  const result = {};
  for (const tableName of tables) {
    const colsRow = workspaceId
      ? db.prepare("SELECT columns FROM clean_data WHERE table_name = ? AND workspace_id = ? LIMIT 1").get(tableName, workspaceId)
      : db.prepare("SELECT columns FROM clean_data WHERE table_name = ? LIMIT 1").get(tableName);
    const cols = colsRow ? JSON.parse(colsRow.columns) : [];
    const rows = workspaceId
      ? db.prepare("SELECT row_data FROM clean_data WHERE table_name = ? AND workspace_id = ?").all(tableName, workspaceId).map(r => JSON.parse(r.row_data))
      : db.prepare("SELECT row_data FROM clean_data WHERE table_name = ?").all(tableName).map(r => JSON.parse(r.row_data));

    const stats = {};
    for (const col of cols) {
      const key = col.name;
      const values = rows.map(r => r[key]).filter(v => v !== null && v !== undefined && v !== "");
      const nullCount = rows.length - values.length;

      if (col.type === "number") {
        const nums = values.map(Number).filter(n => !isNaN(n));
        stats[key] = {
          type: "number",
          nullCount,
          min: nums.length ? Math.min(...nums) : null,
          max: nums.length ? Math.max(...nums) : null,
          avg: nums.length ? Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 100) / 100 : null,
        };
      } else {
        const unique = new Set(values).size;
        stats[key] = {
          type: col.type,
          nullCount,
          uniqueCount: unique,
          sampleValues: [...new Set(values)].slice(0, 5),
        };
      }
    }
    result[tableName] = stats;
  }
  return result;
}

/**
 * Build a comprehensive data context for AI chat — includes full distributions,
 * cross-tabulations, and all data rows (up to a reasonable limit).
 */
function buildFullDataContext(workspaceId) {
  const wsFilter = workspaceId ? " WHERE workspace_id = ?" : "";
  const wsParams = workspaceId ? [workspaceId] : [];

  const tables = db
    .prepare(`SELECT DISTINCT table_name FROM clean_data${wsFilter}`)
    .all(...wsParams)
    .map(r => r.table_name);

  const result = { tables: [], totalRows: 0 };

  for (const tableName of tables) {
    const colsRow = workspaceId
      ? db.prepare("SELECT columns FROM clean_data WHERE table_name = ? AND workspace_id = ? LIMIT 1").get(tableName, workspaceId)
      : db.prepare("SELECT columns FROM clean_data WHERE table_name = ? LIMIT 1").get(tableName);
    const cols = colsRow ? JSON.parse(colsRow.columns) : [];
    const rows = workspaceId
      ? db.prepare("SELECT row_data FROM clean_data WHERE table_name = ? AND workspace_id = ?").all(tableName, workspaceId).map(r => JSON.parse(r.row_data))
      : db.prepare("SELECT row_data FROM clean_data WHERE table_name = ?").all(tableName).map(r => JSON.parse(r.row_data));

    result.totalRows += rows.length;

    // Build distributions for categorical columns
    const distributions = {};
    const numericStats = {};

    for (const col of cols) {
      const key = col.name;
      const values = rows.map(r => r[key]).filter(v => v !== null && v !== undefined && v !== "");

      if (col.type === "number") {
        const nums = values.map(Number).filter(n => !isNaN(n));
        if (nums.length > 0) {
          const sorted = [...nums].sort((a, b) => a - b);
          numericStats[key] = {
            count: nums.length,
            min: Math.min(...nums),
            max: Math.max(...nums),
            sum: Math.round(nums.reduce((a, b) => a + b, 0) * 100) / 100,
            avg: Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 100) / 100,
            median: sorted[Math.floor(sorted.length / 2)],
          };
        }
      } else {
        // Full distribution for categorical columns
        const freq = {};
        values.forEach(v => { freq[v] = (freq[v] || 0) + 1; });
        // Keep all values (not just top 5)
        const entries = Object.entries(freq).sort((a, b) => b[1] - a[1]);
        distributions[key] = {
          uniqueCount: entries.length,
          values: Object.fromEntries(entries),
        };
      }
    }

    // Cross-tabulations for key dimensions
    const crossTabs = {};
    const catCols = cols.filter(c => c.type !== "number").map(c => c.name);
    const numCols = cols.filter(c => c.type === "number").map(c => c.name);

    // For each categorical col, compute aggregates of numeric cols
    for (const catCol of catCols.slice(0, 8)) { // Limit to 8 most useful dimensions
      const groups = {};
      rows.forEach(row => {
        const key = row[catCol] || "(vide)";
        if (!groups[key]) groups[key] = { count: 0 };
        groups[key].count++;
        for (const numCol of numCols.slice(0, 6)) {
          const v = Number(row[numCol]);
          if (!isNaN(v)) {
            if (!groups[key][numCol]) groups[key][numCol] = { sum: 0, count: 0 };
            groups[key][numCol].sum += v;
            groups[key][numCol].count++;
          }
        }
      });
      // Compute averages
      for (const [, g] of Object.entries(groups)) {
        for (const numCol of numCols.slice(0, 6)) {
          if (g[numCol]) {
            g[numCol].avg = Math.round((g[numCol].sum / g[numCol].count) * 100) / 100;
          }
        }
      }
      crossTabs[catCol] = groups;
    }

    result.tables.push({
      name: tableName,
      rowCount: rows.length,
      columns: cols.map(c => `${c.name} (${c.type})`),
      distributions,
      numericStats,
      crossTabs,
      // Include ALL rows if <= 200, otherwise a representative sample
      allData: rows.length <= 200 ? rows : rows.slice(0, 50),
    });
  }
  return result;
}

// ─── Routes ───────────────────────────────────────────────────────────────────

// ── GET /api/workspaces ───────────────────────────────────────────────────────

app.get("/api/workspaces", (req, res) => {
  try {
    const workspaces = db.prepare(`
      SELECT w.*,
        (SELECT COUNT(*) FROM uploaded_files WHERE workspace_id = w.id) AS files_count,
        (SELECT COUNT(*) FROM reports WHERE workspace_id = w.id) AS reports_count
      FROM workspaces w ORDER BY w.updated_at DESC
    `).all();
    res.json({ workspaces });
  } catch (err) {
    console.error("[GET /api/workspaces]", err);
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/workspaces ──────────────────────────────────────────────────────

app.post("/api/workspaces", (req, res) => {
  try {
    const { name, industry } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ error: "Nom requis" });
    const id = uuidv4();
    const slug = generateSlug(name.trim());
    db.prepare("INSERT INTO workspaces (id, slug, name, industry) VALUES (?, ?, ?, ?)")
      .run(id, slug, name.trim(), industry || null);
    res.status(201).json({ id, slug, name: name.trim() });
  } catch (err) {
    console.error("[POST /api/workspaces]", err);
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/workspaces/:slug ─────────────────────────────────────────────────

app.get("/api/workspaces/:slug", (req, res) => {
  try {
    const ws = db.prepare("SELECT * FROM workspaces WHERE slug = ?").get(req.params.slug);
    if (!ws) return res.status(404).json({ error: "Espace introuvable" });
    const filesCount = db.prepare("SELECT COUNT(*) AS cnt FROM uploaded_files WHERE workspace_id = ?").get(ws.id).cnt;
    const reportsCount = db.prepare("SELECT COUNT(*) AS cnt FROM reports WHERE workspace_id = ?").get(ws.id).cnt;
    res.json({ ...ws, filesCount, reportsCount });
  } catch (err) {
    console.error("[GET /api/workspaces/:slug]", err);
    res.status(500).json({ error: err.message });
  }
});

// ── DELETE /api/workspaces/:slug ──────────────────────────────────────────────

app.delete("/api/workspaces/:slug", (req, res) => {
  try {
    const ws = db.prepare("SELECT * FROM workspaces WHERE slug = ?").get(req.params.slug);
    if (!ws) return res.status(404).json({ error: "Espace introuvable" });
    const fileIds = db.prepare("SELECT id FROM uploaded_files WHERE workspace_id = ?").all(ws.id).map(r => r.id);
    for (const fid of fileIds) {
      db.prepare("DELETE FROM data_rows WHERE file_id = ?").run(fid);
    }
    db.prepare("DELETE FROM uploaded_files WHERE workspace_id = ?").run(ws.id);
    db.prepare("DELETE FROM clean_data WHERE workspace_id = ?").run(ws.id);
    db.prepare("DELETE FROM reports WHERE workspace_id = ?").run(ws.id);
    db.prepare("DELETE FROM usage_logs WHERE workspace_id = ?").run(ws.id);
    db.prepare("DELETE FROM project_context WHERE workspace_id = ?").run(ws.id);
    db.prepare("DELETE FROM workspaces WHERE id = ?").run(ws.id);
    res.json({ success: true });
  } catch (err) {
    console.error("[DELETE /api/workspaces/:slug]", err);
    res.status(500).json({ error: err.message });
  }
});

// ── Workspace middleware — sets req.workspace for all /api/w/:slug/* routes ───

app.use("/api/w/:slug", (req, res, next) => {
  const ws = db.prepare("SELECT * FROM workspaces WHERE slug = ?").get(req.params.slug);
  if (!ws) return res.status(404).json({ error: `Espace "${req.params.slug}" introuvable` });
  req.workspace = ws;
  next();
});

// ── POST /api/upload ──────────────────────────────────────────────────────────

app.post("/api/upload", upload.array("files", 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: "Aucun fichier reçu." });
    }

    const result = [];

    for (const file of req.files) {
      const ext = path.extname(file.originalname).toLowerCase();
      const fileId = uuidv4();
      let rows = [];
      let columns = [];

      // Parse file first to get columns and rows
      if (ext === ".xlsx" || ext === ".xls") {
        const fileBuffer = fs.readFileSync(file.path);
        const workbook = XLSX.read(fileBuffer, { type: "buffer" });
        // Parse ALL sheets — merge all unique columns (skip __EMPTY* artifacts)
        const allCols = new Set();
        for (const sheetName of workbook.SheetNames) {
          const sheet = workbook.Sheets[sheetName];
          const sheetRows = XLSX.utils.sheet_to_json(sheet, { defval: null });
          if (sheetRows.length === 0) continue;
          Object.keys(sheetRows[0])
            .filter(k => !k.startsWith("__EMPTY"))
            .forEach(k => allCols.add(k));
          rows = rows.concat(sheetRows.map(r => ({ _sheet: sheetName, ...r })));
        }
        columns = [...allCols];
      } else if (ext === ".csv") {
        const rawContent = fs.readFileSync(file.path, "utf8");
        const delimiters = [",", ";", "\t", "|"];
        let bestDelimiter = ",";
        let bestCount = 0;
        for (const d of delimiters) {
          const count = (rawContent.slice(0, 2000).match(new RegExp(`\\${d}`, "g")) || []).length;
          if (count > bestCount) { bestCount = count; bestDelimiter = d; }
        }
        const parsed = csvParse(rawContent, {
          delimiter: bestDelimiter, columns: true,
          skip_empty_lines: true, trim: true, relax_quotes: true,
        });
        if (parsed.length > 0) columns = Object.keys(parsed[0]);
        rows = parsed.map(r => ({ _sheet: "sheet1", ...r }));
      } else if (ext === ".json") {
        const rawContent = fs.readFileSync(file.path, "utf8");
        const parsed = JSON.parse(rawContent);
        const dataArray = Array.isArray(parsed) ? parsed : [parsed];
        if (dataArray.length > 0) columns = Object.keys(dataArray[0]);
        rows = dataArray.map(r => ({ _sheet: "sheet1", ...r }));
      }

      // Insert parent record FIRST (before data_rows to satisfy FK constraint)
      db.prepare(
        "INSERT INTO uploaded_files (id, name, type, size, columns, row_count) VALUES (?, ?, ?, ?, ?, ?)"
      ).run(fileId, file.originalname, ext.replace(".", ""), file.size, JSON.stringify(columns), rows.length);

      // Now insert data rows
      const insertRow = db.prepare(
        "INSERT INTO data_rows (file_id, sheet_name, row_data) VALUES (?, ?, ?)"
      );
      const insertMany = db.transaction(items => {
        for (const row of items) {
          const sheet = row._sheet || "sheet1";
          const { _sheet, ...data } = row;
          insertRow.run(fileId, sheet, JSON.stringify(data));
        }
      });
      insertMany(rows);

      result.push({
        id: fileId,
        name: file.originalname,
        type: ext.replace(".", ""),
        rows: rows.length,
        columns,
      });
    }

    db.prepare("INSERT OR REPLACE INTO usage_logs (action, query, themes, user_id) VALUES (?, ?, ?, ?)")
      .run("upload", `Uploaded ${req.files.length} file(s)`, JSON.stringify(req.files.map(f => f.originalname)), "default");

    // Compute aggregate stats for the response
    const totalRows = result.reduce((sum, f) => sum + f.rows, 0);
    const allCols = new Set();
    result.forEach(f => f.columns.forEach(c => allCols.add(c)));

    res.json({ files: result, stats: { totalRows, totalCols: allCols.size } });
  } catch (err) {
    console.error("[POST /api/upload]", err);
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/context ─────────────────────────────────────────────────────────

app.post("/api/context", (req, res) => {
  try {
    const { projectName, industry, objectives, questionnaire, freeText } = req.body;
    db.prepare(`
      INSERT INTO project_context (id, project_name, industry, objectives, questionnaire, free_text, updated_at)
      VALUES (1, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(id) DO UPDATE SET
        project_name = excluded.project_name,
        industry = excluded.industry,
        objectives = excluded.objectives,
        questionnaire = excluded.questionnaire,
        free_text = excluded.free_text,
        updated_at = CURRENT_TIMESTAMP
    `).run(
      projectName || null,
      industry || null,
      objectives || null,
      questionnaire ? JSON.stringify(questionnaire) : null,
      freeText || null
    );
    const saved = db.prepare("SELECT * FROM project_context WHERE id = 1").get();
    res.json({ context: formatContext(saved) });
  } catch (err) {
    console.error("[POST /api/context]", err);
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/context ──────────────────────────────────────────────────────────

app.get("/api/context", (req, res) => {
  try {
    const row = db.prepare("SELECT * FROM project_context WHERE id = 1").get();
    if (!row) return res.json({ context: null });
    res.json({ context: formatContext(row) });
  } catch (err) {
    console.error("[GET /api/context]", err);
    res.status(500).json({ error: err.message });
  }
});

// ── PUT /api/context ──────────────────────────────────────────────────────────

app.put("/api/context", (req, res) => {
  try {
    const { projectName, industry, objectives, questionnaire, freeText } = req.body;
    const existing = db.prepare("SELECT * FROM project_context WHERE id = 1").get();
    if (!existing) {
      return res.status(404).json({ error: "Contexte introuvable. Utilisez POST pour créer." });
    }
    db.prepare(`
      UPDATE project_context SET
        project_name = ?,
        industry = ?,
        objectives = ?,
        questionnaire = ?,
        free_text = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = 1
    `).run(
      projectName ?? existing.project_name,
      industry ?? existing.industry,
      objectives ?? existing.objectives,
      questionnaire ? JSON.stringify(questionnaire) : existing.questionnaire,
      freeText ?? existing.free_text
    );
    const updated = db.prepare("SELECT * FROM project_context WHERE id = 1").get();
    res.json({ context: formatContext(updated) });
  } catch (err) {
    console.error("[PUT /api/context]", err);
    res.status(500).json({ error: err.message });
  }
});

function formatContext(row) {
  if (!row) return null;
  return {
    projectName: row.project_name,
    industry: row.industry,
    objectives: row.objectives,
    questionnaire: row.questionnaire ? JSON.parse(row.questionnaire) : null,
    freeText: row.free_text,
    updatedAt: row.updated_at,
  };
}

// ── POST /api/transform ───────────────────────────────────────────────────────

app.post("/api/transform", (req, res) => {
  try {
    // Clear previous clean_data
    db.prepare("DELETE FROM clean_data").run();

    const files = db.prepare("SELECT * FROM uploaded_files").all();
    if (files.length === 0) {
      return res.status(400).json({ error: "Aucun fichier importé. Commencez par /api/upload." });
    }

    const tableSummaries = [];
    const tablesByCommonKey = {}; // key: column_name -> [{tableName, rows}]

    for (const file of files) {
      const rawRows = db
        .prepare("SELECT row_data FROM data_rows WHERE file_id = ?")
        .all(file.id)
        .map(r => JSON.parse(r.row_data));

      if (rawRows.length === 0) continue;

      // Remove completely empty rows
      const nonEmptyRows = rawRows.filter(row =>
        Object.values(row).some(v => v !== null && v !== undefined && v !== "")
      );
      if (nonEmptyRows.length === 0) continue;

      // Normalize column names
      const originalKeys = Object.keys(nonEmptyRows[0]);
      const keyMap = {};
      for (const k of originalKeys) {
        keyMap[k] = normalizeColumnName(k);
      }

      // Remap rows
      const remapped = nonEmptyRows.map(row => {
        const newRow = {};
        for (const [origKey, normKey] of Object.entries(keyMap)) {
          let val = row[origKey];
          if (typeof val === "string") val = val.trim();
          newRow[normKey] = val;
        }
        return newRow;
      });

      // Detect column types from a sample
      const normalizedKeys = Object.values(keyMap);
      const columns = normalizedKeys.map(key => {
        const sampleVals = remapped
          .map(r => r[key])
          .filter(v => v !== null && v !== undefined && v !== "")
          .slice(0, 50);
        const type = detectType(sampleVals);
        return { name: key, type, nullable: remapped.some(r => r[key] === null || r[key] === undefined || r[key] === "") };
      });

      // Convert types in rows
      const converted = remapped.map(row => {
        const newRow = {};
        for (const col of columns) {
          let val = row[col.name];
          if (val === null || val === undefined || val === "") {
            newRow[col.name] = null;
          } else if (col.type === "number") {
            newRow[col.name] = parseFrenchNumber(val);
          } else if (col.type === "date") {
            newRow[col.name] = normalizeDate(String(val));
          } else {
            newRow[col.name] = String(val).trim();
          }
        }
        return newRow;
      });

      const tableName = normalizeColumnName(path.basename(file.name, path.extname(file.name)));
      const colsJson = JSON.stringify(columns);

      const insertClean = db.prepare(
        "INSERT INTO clean_data (table_name, columns, row_data, source_file_id) VALUES (?, ?, ?, ?)"
      );
      const insertMany = db.transaction(items => {
        for (const row of items) {
          insertClean.run(tableName, colsJson, JSON.stringify(row), file.id);
        }
      });
      insertMany(converted);

      // Collect stats for response
      const colStats = columns.map(col => {
        const vals = converted.map(r => r[col.name]).filter(v => v !== null && v !== undefined && v !== "");
        const nullCount = converted.length - vals.length;
        const sampleValues = col.type === "string"
          ? [...new Set(vals)].slice(0, 5)
          : vals.slice(0, 5);
        return { name: col.name, type: col.type, nullCount, sampleValues };
      });

      tableSummaries.push({
        name: tableName,
        columns: colStats,
        rowCount: converted.length,
      });

      // Record potential join columns
      for (const col of columns) {
        if (!tablesByCommonKey[col.name]) tablesByCommonKey[col.name] = [];
        tablesByCommonKey[col.name].push(tableName);
      }
    }

    // Identify common columns for potential merge
    const commonCols = Object.entries(tablesByCommonKey)
      .filter(([, tables]) => tables.length > 1)
      .map(([col, tables]) => ({ column: col, tables }));

    // Compute summary stats for the frontend component
    const totalRows = tableSummaries.reduce((s, t) => s + t.rowCount, 0);
    const allCols = tableSummaries.flatMap(t => t.columns);
    const totalCols = allCols.length;
    const numericCols = allCols.filter(c => c.type === "number").length;
    const textCols = allCols.filter(c => c.type === "string").length;
    const dateCols = allCols.filter(c => c.type === "date").length;
    const totalNulls = allCols.reduce((s, c) => s + (c.nullCount || 0), 0);

    const response = {
      tables: tableSummaries,
      // Summary fields expected by OnboardingTransform component
      cleanedRows: totalRows,
      typedCols: totalCols,
      numericCols,
      textCols,
      dateCols,
      nullValues: totalNulls,
      mergedColumn: commonCols.length > 0 ? commonCols[0].column : null,
    };
    if (commonCols.length > 0) {
      response.mergeOpportunities = commonCols;
    }

    res.json(response);
  } catch (err) {
    console.error("[POST /api/transform]", err);
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/data/preview ─────────────────────────────────────────────────────

app.get("/api/data/preview", (req, res) => {
  try {
    const tables = db.prepare("SELECT DISTINCT table_name FROM clean_data").all().map(r => r.table_name);

    if (tables.length === 0) {
      return res.json({ columns: [], rows: [], totalRows: 0, tables: 0 });
    }

    // Flatten: merge all tables into a single preview (MVP = typically 1 table)
    let allColumns = [];
    let allRows = [];
    let totalRows = 0;

    for (const tableName of tables) {
      // Get columns definition
      const colsRow = db
        .prepare("SELECT columns FROM clean_data WHERE table_name = ? LIMIT 1")
        .get(tableName);
      const cols = colsRow ? JSON.parse(colsRow.columns) : [];

      // Merge columns (avoid duplicates by key)
      const existingKeys = new Set(allColumns.map(c => c.key || c.name));
      for (const col of cols) {
        const key = col.key || col.name;
        if (!existingKeys.has(key)) {
          allColumns.push({ key, label: col.label || col.name, type: col.type || "text" });
          existingKeys.add(key);
        }
      }

      // Get rows (limit 50 for preview)
      const rows = db
        .prepare("SELECT row_data FROM clean_data WHERE table_name = ? LIMIT 50")
        .all(tableName)
        .map(r => JSON.parse(r.row_data));
      allRows.push(...rows);

      // Total count
      const count = db
        .prepare("SELECT COUNT(*) AS cnt FROM clean_data WHERE table_name = ?")
        .get(tableName).cnt;
      totalRows += count;
    }

    res.json({
      columns: allColumns,
      rows: allRows.slice(0, 50),
      totalRows,
      tables: tables.length,
    });
  } catch (err) {
    console.error("[GET /api/data/preview]", err);
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/data/columns ──────────────────────────────────────────────────────

app.get("/api/data/columns", (req, res) => {
  try {
    const tables = db.prepare("SELECT DISTINCT table_name FROM clean_data").all().map(r => r.table_name);
    const result = {};
    for (const tableName of tables) {
      const colsRow = db
        .prepare("SELECT columns FROM clean_data WHERE table_name = ? LIMIT 1")
        .get(tableName);
      result[tableName] = colsRow ? JSON.parse(colsRow.columns) : [];
    }
    res.json({ columns: result });
  } catch (err) {
    console.error("[GET /api/data/columns]", err);
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/data/stats ───────────────────────────────────────────────────────

app.get("/api/data/stats", (req, res) => {
  try {
    const allStats = buildColumnStats();
    // Flatten: merge stats from all tables into a single object keyed by column name
    const flat = {};
    for (const tableName of Object.keys(allStats)) {
      Object.assign(flat, allStats[tableName]);
    }
    res.json(flat);
  } catch (err) {
    console.error("[GET /api/data/stats]", err);
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/ai/suggest-reports ──────────────────────────────────────────────

app.post("/api/ai/suggest-reports", async (req, res) => {
  try {
    const context = db.prepare("SELECT * FROM project_context WHERE id = 1").get();
    const dataSummary = buildDataSummary(5);
    const colStats = buildColumnStats();

    if (dataSummary.length === 0) {
      return res.status(400).json({ error: "Aucune donnée disponible. Importez et transformez des fichiers d'abord." });
    }

    const contextText = context
      ? `Projet : ${context.project_name || "non renseigné"}
Secteur : ${context.industry || "non renseigné"}
Objectifs : ${context.objectives || "non renseignés"}
Texte libre : ${context.free_text || "—"}`
      : "Aucun contexte projet renseigné.";

    const schemaText = dataSummary.map(t => {
      const cols = t.columns.map(c => `  - ${c.name} (${c.type})`).join("\n");
      return `Table "${t.name}" — ${t.rowCount} lignes :\n${cols}\nExemple : ${JSON.stringify(t.sample?.[0] || {})}`;
    }).join("\n\n");

    const statsText = Object.entries(colStats).map(([table, cols]) => {
      const entries = Object.entries(cols).map(([col, s]) =>
        s.type === "number"
          ? `  ${col}: min=${s.min}, max=${s.max}, avg=${s.avg}, nulls=${s.nullCount}`
          : `  ${col}: ${s.uniqueCount} valeurs uniques, exemples=${JSON.stringify(s.sampleValues)}, nulls=${s.nullCount}`
      ).join("\n");
      return `Table "${table}" :\n${entries}`;
    }).join("\n\n");

    const prompt = `Tu es un expert en data analytics pour les mutuelles santé collectives françaises.

CONTEXTE PROJET :
${contextText}

SCHÉMA ET DONNÉES :
${schemaText}

STATISTIQUES PAR COLONNE :
${statsText}

Ta mission : suggérer 5 à 8 rapports analytiques pertinents pour ce jeu de données.
Chaque suggestion doit être directement exploitable avec les colonnes disponibles.

Réponds UNIQUEMENT avec un JSON valide, sans markdown, sans explication, dans ce format exact :
{
  "suggestions": [
    {
      "id": "suggestion_1",
      "title": "Titre du rapport",
      "description": "Description concise de l'analyse et de sa valeur métier",
      "type": "bar|composed|grouped_bar|area_multi|pie_multi|table",
      "columns": ["col1", "col2"],
      "kpis": ["KPI à calculer 1", "KPI à calculer 2"],
      "sections": ["Titre section 1", "Titre section 2"]
    }
  ]
}`;

    const aiResult = await aiComplete("", prompt, { maxTokens: 2000 });

    const rawText = aiResult.text.trim();
    // Strip possible markdown code fences
    const jsonText = rawText.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    const parsed = JSON.parse(jsonText);

    db.prepare("INSERT INTO usage_logs (action, query, themes, user_id) VALUES (?, ?, ?, ?)")
      .run("report_suggest", "AI suggest-reports", JSON.stringify(["suggestion", "rapport", "analyse"]), "default");

    res.json(parsed);
  } catch (err) {
    console.error("[POST /api/ai/suggest-reports]", err);
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/ai/generate-report ──────────────────────────────────────────────

app.post("/api/ai/generate-report", async (req, res) => {
  try {
    const { suggestion } = req.body;
    if (!suggestion) {
      return res.status(400).json({ error: "Paramètre 'suggestion' manquant." });
    }

    const context = db.prepare("SELECT * FROM project_context WHERE id = 1").get();
    const dataSummary = buildDataSummary(20);
    const colStats = buildColumnStats();

    const contextText = context
      ? `Projet : ${context.project_name || "—"}\nSecteur : ${context.industry || "—"}\nObjectifs : ${context.objectives || "—"}`
      : "Aucun contexte renseigné.";

    const dataText = dataSummary.map(t =>
      `Table "${t.name}" (${t.rowCount} lignes) :\nColonnes : ${t.columns.map(c => `${c.name}(${c.type})`).join(", ")}\nExemples :\n${t.sample.map(r => JSON.stringify(r)).join("\n")}`
    ).join("\n\n");

    const statsText = Object.entries(colStats).map(([table, cols]) => {
      const entries = Object.entries(cols).map(([col, s]) =>
        s.type === "number"
          ? `  ${col}: min=${s.min}, max=${s.max}, avg=${s.avg}`
          : `  ${col}: ${s.uniqueCount} valeurs uniques`
      ).join("\n");
      return `Table "${table}" :\n${entries}`;
    }).join("\n\n");

    const prompt = `Tu es un expert data pour mutuelles santé collectives françaises.

CONTEXTE :
${contextText}

RAPPORT À GÉNÉRER :
Titre : ${suggestion.title}
Description : ${suggestion.description}
Type principal : ${suggestion.type}
Colonnes clés : ${(suggestion.columns || []).join(", ")}
KPIs demandés : ${(suggestion.kpis || []).join(", ")}

DONNÉES DISPONIBLES :
${dataText}

STATISTIQUES :
${statsText}

Génère un rapport analytique complet avec des données RÉELLES calculées depuis les données fournies.

RÈGLES IMPORTANTES pour le format des sections :
- type "bar" : config doit avoir { xKey, yKeys: [...], colors: [...] }
- type "composed" : config doit avoir { xKey, bars: [{key, color, name}], line: {key, color, name} }
- type "grouped_bar" : config doit avoir { xKey, yKeys: [...], colors: [...], names: [...] }
- type "area_multi" : config doit avoir { xKey, yKeys: [...], colors: [...], names: [...] }
- type "pie_multi" : doit avoir data_sets: [{label, data: [{name, value}]}]
- type "table" : doit avoir columns: [{key, label, align?, fmt?, hl?}]
- Les couleurs disponibles : "#C8FF3C" (lite), "#4A90B8" (signal), "#C45A32" (warm), "#D4A03A" (warning), "#3A8A4A" (success)

Réponds UNIQUEMENT avec un JSON valide, sans markdown :
{
  "id": "report_<uuid>",
  "title": "...",
  "subtitle": "...",
  "objective": "...",
  "color": "#4A90B8",
  "kpis": [
    { "label": "...", "value": "...", "trend": "+X%", "bad": false }
  ],
  "sections": [
    {
      "title": "...",
      "type": "bar|composed|grouped_bar|area_multi|pie_multi|table",
      "insight": "Observation analytique clé",
      "data": [...],
      "config": { ... }
    }
  ]
}`;

    const aiResult = await aiComplete("", prompt, { maxTokens: 4000 });

    const rawText = aiResult.text.trim();
    const jsonText = rawText.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    const report = JSON.parse(jsonText);

    // Assign a guaranteed unique ID
    report.id = report.id || `report_${uuidv4()}`;

    db.prepare(`
      INSERT INTO reports (id, title, subtitle, objective, color, icon, kpis, sections, shared, starred, source)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, 0, 'ai')
    `).run(
      report.id,
      report.title,
      report.subtitle || null,
      report.objective || null,
      report.color || "#4A90B8",
      report.icon || "BarChart3",
      JSON.stringify(report.kpis || []),
      JSON.stringify(report.sections || [])
    );

    db.prepare("INSERT INTO usage_logs (action, query, themes, user_id) VALUES (?, ?, ?, ?)")
      .run("report_generate", `Generated: ${report.title}`, JSON.stringify(extractThemes(report.title)), "default");

    res.json({ report });
  } catch (err) {
    console.error("[POST /api/ai/generate-report]", err);
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/ai/chat ─────────────────────────────────────────────────────────

app.post("/api/ai/chat", async (req, res) => {
  try {
    const { message, history = [] } = req.body;
    if (!message) {
      return res.status(400).json({ error: "Paramètre 'message' manquant." });
    }

    const context = db.prepare("SELECT * FROM project_context WHERE id = 1").get();
    const dataSummary = buildDataSummary(10);
    const colStats = buildColumnStats();

    const contextText = context
      ? `Projet : ${context.project_name || "—"}\nSecteur : ${context.industry || "—"}\nObjectifs : ${context.objectives || "—"}`
      : "Aucun contexte renseigné.";

    const schemaText = dataSummary.map(t => {
      const cols = t.columns.map(c => `${c.name}(${c.type})`).join(", ");
      return `Table "${t.name}" — ${t.rowCount} lignes — colonnes : ${cols}`;
    }).join("\n");

    const sampleText = dataSummary.map(t =>
      `Table "${t.name}" — 3 exemples :\n${t.sample.slice(0, 3).map(r => JSON.stringify(r)).join("\n")}`
    ).join("\n\n");

    const statsText = Object.entries(colStats).map(([table, cols]) => {
      const entries = Object.entries(cols).map(([col, s]) =>
        s.type === "number"
          ? `  ${col}: min=${s.min}, max=${s.max}, avg=${s.avg}`
          : `  ${col}: ${s.uniqueCount} valeurs uniques`
      ).join("\n");
      return `Table "${table}" :\n${entries}`;
    }).join("\n\n");

    const systemPrompt = `Tu es Minipilot, un assistant analytique expert en mutuelles santé collectives françaises (mutuelle santé collective, sinistralité, prestations, cotisations, bénéficiaires).

CONTEXTE PROJET :
${contextText}

SCHÉMA DES DONNÉES :
${schemaText}

STATISTIQUES :
${statsText}

EXEMPLES DE DONNÉES :
${sampleText}

INSTRUCTIONS :
- Réponds en français, de manière professionnelle et concise.
- Si l'utilisateur demande une analyse, un rapport, un graphique ou une visualisation, génère un rapport complet.
- Si tu génères un rapport, inclus TOUJOURS un bloc JSON valide entre les balises <REPORT_DATA> et </REPORT_DATA>.
- Le format du rapport doit respecter exactement ce schéma (pour le composant RenderSection) :
{
  "id": "report_xxx",
  "title": "...",
  "subtitle": "...",
  "objective": "...",
  "color": "#4A90B8",
  "kpis": [{ "label": "...", "value": "...", "trend": "+X%", "bad": false }],
  "sections": [{
    "title": "...",
    "type": "bar|composed|grouped_bar|area_multi|pie_multi|table",
    "insight": "...",
    "data": [...],
    "config": {
      "xKey": "...",
      "yKeys": [...],
      "colors": [...],
      "names": [...],
      "bars": [{"key":"...","color":"...","name":"..."}],
      "line": {"key":"...","color":"...","name":"..."}
    }
  }]
}
- Si tu ne génères pas de rapport, réponds simplement avec du texte.
- Utilise les données réelles disponibles dans les statistiques et exemples.`;

    // Build messages array for Anthropic
    const messages = [
      ...history.map(h => ({ role: h.role, content: h.content })),
      { role: "user", content: message },
    ];

    // Adapt maxTokens based on AI mode (small local models need shorter output)
    const chatMaxTokens = aiMode === "local" ? 2000 : 4000;
    const aiResponse = await aiChat(systemPrompt, messages, { maxTokens: chatMaxTokens });

    let rawResponse = aiResponse.text;
    // If from local model, clean up common issues
    if (aiResponse.provider === "ollama") {
      rawResponse = truncateRepetitions(rawResponse);
    }

    // Extract report data using unified extractor (supports REPORT_DATA tags, markdown blocks, bare JSON)
    let reportData = null;
    const extracted = extractReportFromResponse(rawResponse);
    if (extracted) {
      try {
        reportData = extracted.json;
        reportData.id = reportData.id || `report_${uuidv4()}`;

        // Persist the report
        db.prepare(`
          INSERT OR REPLACE INTO reports (id, title, subtitle, objective, color, icon, kpis, sections, shared, starred, source)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, 0, 'chat')
        `).run(
          reportData.id,
          reportData.title,
          reportData.subtitle || null,
          reportData.objective || null,
          reportData.color || "#4A90B8",
          reportData.icon || "BarChart3",
          JSON.stringify(reportData.kpis || []),
          JSON.stringify(reportData.sections || [])
        );
      } catch (parseErr) {
        console.error("[chat] Impossible de parser le rapport JSON :", parseErr.message);
      }
    }

    // Clean the response text (remove the JSON block for cleaner display)
    const cleanResponse = extracted ? extracted.cleanText : rawResponse;

    // Extract themes for logging
    const themes = extractThemes(message);
    db.prepare("INSERT INTO usage_logs (action, query, themes, user_id) VALUES (?, ?, ?, ?)")
      .run("chat_query", message, JSON.stringify(themes), "default");

    res.json({
      response: cleanResponse,
      provider: aiResponse.provider || aiMode,
      model: aiResponse.model || null,
      ...(reportData ? { reportData } : {}),
    });
  } catch (err) {
    console.error("[POST /api/ai/chat]", err);
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/reports ──────────────────────────────────────────────────────────

app.get("/api/reports", (req, res) => {
  try {
    const rows = db.prepare("SELECT * FROM reports ORDER BY created_at DESC").all();
    const reports = rows.map(deserializeReport);
    const shared = reports.filter(r => r.shared);
    const privateReports = reports.filter(r => !r.shared);
    res.json({ shared, private: privateReports });
  } catch (err) {
    console.error("[GET /api/reports]", err);
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/reports ─────────────────────────────────────────────────────────

app.post("/api/reports", (req, res) => {
  try {
    const { title, subtitle, objective, color, icon, kpis, sections, shared, source } = req.body;
    if (!title) return res.status(400).json({ error: "Champ 'title' requis." });

    const id = `report_${uuidv4()}`;
    db.prepare(`
      INSERT INTO reports (id, title, subtitle, objective, color, icon, kpis, sections, shared, starred, source)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)
    `).run(
      id,
      title,
      subtitle || null,
      objective || null,
      color || "#4A90B8",
      icon || "BarChart3",
      JSON.stringify(kpis || []),
      JSON.stringify(sections || []),
      shared ? 1 : 0,
      source || "chat"
    );

    const created = db.prepare("SELECT * FROM reports WHERE id = ?").get(id);
    db.prepare("INSERT INTO usage_logs (action, query, themes, user_id) VALUES (?, ?, ?, ?)")
      .run("report_create", `Created: ${title}`, JSON.stringify(extractThemes(title)), "default");

    res.status(201).json({ report: deserializeReport(created) });
  } catch (err) {
    console.error("[POST /api/reports]", err);
    res.status(500).json({ error: err.message });
  }
});

// ── PATCH /api/reports/:id ────────────────────────────────────────────────────

app.patch("/api/reports/:id", (req, res) => {
  try {
    const { id } = req.params;
    const existing = db.prepare("SELECT * FROM reports WHERE id = ?").get(id);
    if (!existing) return res.status(404).json({ error: "Rapport introuvable." });

    const { starred, shared, title, subtitle, objective, color } = req.body;

    const newStarred = starred !== undefined ? (starred ? 1 : 0) : existing.starred;
    const newShared = shared !== undefined ? (shared ? 1 : 0) : existing.shared;
    const newTitle = title !== undefined ? title : existing.title;
    const newSubtitle = subtitle !== undefined ? subtitle : existing.subtitle;
    const newObjective = objective !== undefined ? objective : existing.objective;
    const newColor = color !== undefined ? color : existing.color;

    db.prepare(`
      UPDATE reports SET
        starred = ?,
        shared = ?,
        title = ?,
        subtitle = ?,
        objective = ?,
        color = ?
      WHERE id = ?
    `).run(newStarred, newShared, newTitle, newSubtitle, newObjective, newColor, id);

    const updated = db.prepare("SELECT * FROM reports WHERE id = ?").get(id);
    res.json({ report: deserializeReport(updated) });
  } catch (err) {
    console.error("[PATCH /api/reports/:id]", err);
    res.status(500).json({ error: err.message });
  }
});

// ── DELETE /api/reports/:id ───────────────────────────────────────────────────

app.delete("/api/reports/:id", (req, res) => {
  try {
    const { id } = req.params;
    const existing = db.prepare("SELECT * FROM reports WHERE id = ?").get(id);
    if (!existing) return res.status(404).json({ error: "Rapport introuvable." });
    db.prepare("DELETE FROM reports WHERE id = ?").run(id);
    res.json({ success: true });
  } catch (err) {
    console.error("[DELETE /api/reports/:id]", err);
    res.status(500).json({ error: err.message });
  }
});

function deserializeReport(row) {
  return {
    id: row.id,
    title: row.title,
    subtitle: row.subtitle,
    objective: row.objective,
    color: row.color,
    icon: row.icon,
    kpis: row.kpis ? JSON.parse(row.kpis) : [],
    sections: row.sections ? JSON.parse(row.sections) : [],
    shared: row.shared === 1,
    starred: row.starred === 1,
    source: row.source,
    createdAt: row.created_at,
  };
}

// ── GET /api/logs ─────────────────────────────────────────────────────────────

app.get("/api/logs", (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 50, 200);
    const offset = (page - 1) * limit;

    const logs = db
      .prepare("SELECT * FROM usage_logs ORDER BY created_at DESC LIMIT ? OFFSET ?")
      .all(limit, offset);
    const total = db.prepare("SELECT COUNT(*) AS cnt FROM usage_logs").get().cnt;

    res.json({
      logs: logs.map(l => ({
        id: l.id,
        timestamp: l.created_at,
        action: l.action,
        query: l.query,
        themes: l.themes ? JSON.parse(l.themes) : [],
        userId: l.user_id,
      })),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    console.error("[GET /api/logs]", err);
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/stats/themes ─────────────────────────────────────────────────────

app.get("/api/stats/themes", (req, res) => {
  try {
    const chatLogs = db
      .prepare("SELECT themes FROM usage_logs WHERE action = 'chat_query' AND themes IS NOT NULL")
      .all();

    const themeCounts = {};
    for (const log of chatLogs) {
      try {
        const themes = JSON.parse(log.themes);
        for (const theme of themes) {
          if (theme) themeCounts[theme] = (themeCounts[theme] || 0) + 1;
        }
      } catch {
        // Skip malformed themes
      }
    }

    const sorted = Object.entries(themeCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([topic, count]) => ({ topic, count }));

    res.json({ themes: sorted });
  } catch (err) {
    console.error("[GET /api/stats/themes]", err);
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/stats/usage ──────────────────────────────────────────────────────

app.get("/api/stats/usage", (req, res) => {
  try {
    // Queries per day (last 30 days)
    const perDay = db.prepare(`
      SELECT date(created_at) AS day, COUNT(*) AS count
      FROM usage_logs
      WHERE created_at >= date('now', '-30 days')
      GROUP BY date(created_at)
      ORDER BY day ASC
    `).all();

    const reportsGenerated = db
      .prepare("SELECT COUNT(*) AS cnt FROM usage_logs WHERE action IN ('report_generate', 'report_create')")
      .get().cnt;

    const chatQueries = db
      .prepare("SELECT COUNT(*) AS cnt FROM usage_logs WHERE action = 'chat_query'")
      .get().cnt;

    const activeUsers = db
      .prepare("SELECT COUNT(DISTINCT user_id) AS cnt FROM usage_logs WHERE created_at >= date('now', '-7 days')")
      .get().cnt;

    const totalReports = db.prepare("SELECT COUNT(*) AS cnt FROM reports").get().cnt;

    res.json({
      queriesPerDay: perDay,
      reportsGenerated,
      chatQueries,
      activeUsers,
      totalReports,
    });
  } catch (err) {
    console.error("[GET /api/stats/usage]", err);
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/ai/mode — current AI mode & available providers ─────────────────

app.get("/api/ai/mode", async (req, res) => {
  const ollama = await checkOllama();
  res.json({
    mode: aiMode,
    providers: {
      anthropic: !!anthropic,
      mistral: !!mistralCloud,
      ollama: ollama.running,
      ollamaModels: ollama.models,
      ollamaModel: OLLAMA_MODEL,
    },
  });
});

// ── POST /api/ai/mode — toggle between local and premium ────────────────────

app.post("/api/ai/mode", async (req, res) => {
  const { mode } = req.body;
  if (mode !== "local" && mode !== "premium") {
    return res.status(400).json({ error: "Mode invalide. Valeurs acceptées : 'local' ou 'premium'" });
  }

  if (mode === "local") {
    const ollama = await checkOllama();
    if (!ollama.running) {
      return res.status(503).json({
        error: "Ollama n'est pas accessible sur " + OLLAMA_BASE,
        hint: "Lancez: brew services start ollama && ollama pull mistral",
      });
    }
    if (!ollama.models.some(m => m.includes(OLLAMA_MODEL))) {
      return res.status(503).json({
        error: `Modèle '${OLLAMA_MODEL}' non trouvé dans Ollama`,
        available: ollama.models,
        hint: `Lancez: ollama pull ${OLLAMA_MODEL}`,
      });
    }
  }

  if (mode === "premium" && !anthropic && !mistralCloud) {
    return res.status(503).json({
      error: "Aucune clé API cloud configurée",
      hint: "Ajoutez ANTHROPIC_API_KEY ou MISTRAL_API_KEY dans .env",
    });
  }

  aiMode = mode;
  console.log(`AI mode switched to: ${mode}`);
  const ollama = await checkOllama();
  res.json({
    mode: aiMode,
    providers: {
      anthropic: !!anthropic,
      mistral: !!mistralCloud,
      ollama: ollama.running,
      ollamaModels: ollama.models,
      ollamaModel: OLLAMA_MODEL,
    },
  });
});

// ── GET /api/onboarding/status ────────────────────────────────────────────────

app.get("/api/onboarding/status", (req, res) => {
  try {
    const filesCount = db.prepare("SELECT COUNT(*) AS cnt FROM uploaded_files").get().cnt;
    const contextSet = !!db.prepare("SELECT id FROM project_context WHERE id = 1").get();
    const dataTransformed = db.prepare("SELECT COUNT(*) AS cnt FROM clean_data").get().cnt > 0;
    const reportsCount = db.prepare("SELECT COUNT(*) AS cnt FROM reports").get().cnt;

    // Determine current step and completed steps
    const completedSteps = [];
    let currentStep;

    if (filesCount === 0) {
      currentStep = "upload";
    } else if (!contextSet) {
      completedSteps.push("upload");
      currentStep = "context";
    } else if (!dataTransformed) {
      completedSteps.push("upload", "context");
      currentStep = "transform";
    } else if (reportsCount === 0) {
      completedSteps.push("upload", "context", "transform");
      currentStep = "verify";
    } else {
      completedSteps.push("upload", "context", "transform", "verify", "suggest");
      currentStep = "complete";
    }

    res.json({
      step: currentStep,
      currentStep,
      completedSteps,
      filesUploaded: filesCount,
      contextSet,
      dataTransformed,
      reportsCount,
    });
  } catch (err) {
    console.error("[GET /api/onboarding/status]", err);
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/onboarding/reset ────────────────────────────────────────────────

app.post("/api/onboarding/reset", (req, res) => {
  try {
    db.prepare("DELETE FROM usage_logs").run();
    db.prepare("DELETE FROM reports").run();
    db.prepare("DELETE FROM clean_data").run();
    db.prepare("DELETE FROM data_rows").run();
    db.prepare("DELETE FROM uploaded_files").run();
    db.prepare("DELETE FROM project_context").run();

    // Clean uploads directory
    const files = fs.readdirSync(UPLOADS_DIR);
    for (const f of files) {
      try {
        fs.unlinkSync(path.join(UPLOADS_DIR, f));
      } catch {
        // Best-effort
      }
    }

    res.json({ success: true, message: "Onboarding réinitialisé." });
  } catch (err) {
    console.error("[POST /api/onboarding/reset]", err);
    res.status(500).json({ error: err.message });
  }
});

// ─── Workspace-scoped routes (/api/w/:slug/*) ─────────────────────────────────

// ── POST /api/w/:slug/upload ──────────────────────────────────────────────────

app.post("/api/w/:slug/upload", upload.array("files", 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: "Aucun fichier reçu." });
    }
    const workspaceId = req.workspace.id;
    const result = [];

    for (const file of req.files) {
      const ext = path.extname(file.originalname).toLowerCase();
      const fileId = uuidv4();
      let rows = [];
      let columns = [];

      if (ext === ".xlsx" || ext === ".xls") {
        const fileBuffer = fs.readFileSync(file.path);
        const workbook = XLSX.read(fileBuffer, { type: "buffer" });
        const allCols = new Set();
        for (const sheetName of workbook.SheetNames) {
          const sheet = workbook.Sheets[sheetName];
          const sheetRows = XLSX.utils.sheet_to_json(sheet, { defval: null });
          if (sheetRows.length === 0) continue;
          Object.keys(sheetRows[0]).filter(k => !k.startsWith("__EMPTY")).forEach(k => allCols.add(k));
          rows = rows.concat(sheetRows.map(r => ({ _sheet: sheetName, ...r })));
        }
        columns = [...allCols];
      } else if (ext === ".csv") {
        const rawContent = fs.readFileSync(file.path, "utf8");
        const delimiters = [",", ";", "\t", "|"];
        let bestDelimiter = ",";
        let bestCount = 0;
        for (const d of delimiters) {
          const count = (rawContent.slice(0, 2000).match(new RegExp(`\\${d}`, "g")) || []).length;
          if (count > bestCount) { bestCount = count; bestDelimiter = d; }
        }
        const parsed = csvParse(rawContent, { delimiter: bestDelimiter, columns: true, skip_empty_lines: true, trim: true, relax_quotes: true });
        if (parsed.length > 0) columns = Object.keys(parsed[0]);
        rows = parsed.map(r => ({ _sheet: "sheet1", ...r }));
      } else if (ext === ".json") {
        const rawContent = fs.readFileSync(file.path, "utf8");
        const parsed = JSON.parse(rawContent);
        const dataArray = Array.isArray(parsed) ? parsed : [parsed];
        if (dataArray.length > 0) columns = Object.keys(dataArray[0]);
        rows = dataArray.map(r => ({ _sheet: "sheet1", ...r }));
      }

      db.prepare(
        "INSERT INTO uploaded_files (id, name, type, size, columns, row_count, workspace_id) VALUES (?, ?, ?, ?, ?, ?, ?)"
      ).run(fileId, file.originalname, ext.replace(".", ""), file.size, JSON.stringify(columns), rows.length, workspaceId);

      const insertRow = db.prepare("INSERT INTO data_rows (file_id, sheet_name, row_data) VALUES (?, ?, ?)");
      const insertMany = db.transaction(items => {
        for (const row of items) {
          const sheet = row._sheet || "sheet1";
          const { _sheet, ...data } = row;
          insertRow.run(fileId, sheet, JSON.stringify(data));
        }
      });
      insertMany(rows);

      result.push({ id: fileId, name: file.originalname, type: ext.replace(".", ""), rows: rows.length, columns });
    }

    db.prepare("INSERT OR REPLACE INTO usage_logs (action, query, themes, user_id, workspace_id) VALUES (?, ?, ?, ?, ?)")
      .run("upload", `Uploaded ${req.files.length} file(s)`, JSON.stringify(req.files.map(f => f.originalname)), "default", workspaceId);

    db.prepare("UPDATE workspaces SET file_count = (SELECT COUNT(*) FROM uploaded_files WHERE workspace_id = ?), updated_at = CURRENT_TIMESTAMP WHERE id = ?")
      .run(workspaceId, workspaceId);

    const totalRows = result.reduce((sum, f) => sum + f.rows, 0);
    const allCols = new Set();
    result.forEach(f => f.columns.forEach(c => allCols.add(c)));
    res.json({ files: result, stats: { totalRows, totalCols: allCols.size } });
  } catch (err) {
    console.error("[POST /api/w/:slug/upload]", err);
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/w/:slug/context ─────────────────────────────────────────────────

app.post("/api/w/:slug/context", (req, res) => {
  try {
    const { projectName, industry, objectives, questionnaire, freeText } = req.body;
    const workspaceId = req.workspace.id;
    const existing = db.prepare("SELECT * FROM project_context WHERE workspace_id = ?").get(workspaceId);
    if (existing) {
      db.prepare(`
        UPDATE project_context SET
          project_name = ?, industry = ?, objectives = ?, questionnaire = ?, free_text = ?, updated_at = CURRENT_TIMESTAMP
        WHERE workspace_id = ?
      `).run(projectName || null, industry || null, objectives || null, questionnaire ? JSON.stringify(questionnaire) : null, freeText || null, workspaceId);
    } else {
      db.prepare(`
        INSERT INTO project_context (project_name, industry, objectives, questionnaire, free_text, workspace_id, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `).run(projectName || null, industry || null, objectives || null, questionnaire ? JSON.stringify(questionnaire) : null, freeText || null, workspaceId);
    }
    const saved = db.prepare("SELECT * FROM project_context WHERE workspace_id = ?").get(workspaceId);
    res.json({ context: formatContext(saved) });
  } catch (err) {
    console.error("[POST /api/w/:slug/context]", err);
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/w/:slug/context ──────────────────────────────────────────────────

app.get("/api/w/:slug/context", (req, res) => {
  try {
    const row = db.prepare("SELECT * FROM project_context WHERE workspace_id = ?").get(req.workspace.id);
    if (!row) return res.json({ context: null });
    res.json({ context: formatContext(row) });
  } catch (err) {
    console.error("[GET /api/w/:slug/context]", err);
    res.status(500).json({ error: err.message });
  }
});

// ── PUT /api/w/:slug/context ──────────────────────────────────────────────────

app.put("/api/w/:slug/context", (req, res) => {
  try {
    const { projectName, industry, objectives, questionnaire, freeText } = req.body;
    const workspaceId = req.workspace.id;
    const existing = db.prepare("SELECT * FROM project_context WHERE workspace_id = ?").get(workspaceId);
    if (!existing) return res.status(404).json({ error: "Contexte introuvable. Utilisez POST pour créer." });
    db.prepare(`
      UPDATE project_context SET
        project_name = ?, industry = ?, objectives = ?, questionnaire = ?, free_text = ?, updated_at = CURRENT_TIMESTAMP
      WHERE workspace_id = ?
    `).run(
      projectName ?? existing.project_name,
      industry ?? existing.industry,
      objectives ?? existing.objectives,
      questionnaire ? JSON.stringify(questionnaire) : existing.questionnaire,
      freeText ?? existing.free_text,
      workspaceId
    );
    const updated = db.prepare("SELECT * FROM project_context WHERE workspace_id = ?").get(workspaceId);
    res.json({ context: formatContext(updated) });
  } catch (err) {
    console.error("[PUT /api/w/:slug/context]", err);
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/w/:slug/transform ───────────────────────────────────────────────

app.post("/api/w/:slug/transform", (req, res) => {
  try {
    const workspaceId = req.workspace.id;
    db.prepare("DELETE FROM clean_data WHERE workspace_id = ?").run(workspaceId);

    const files = db.prepare("SELECT * FROM uploaded_files WHERE workspace_id = ?").all(workspaceId);
    if (files.length === 0) {
      return res.status(400).json({ error: "Aucun fichier importé. Commencez par /api/w/:slug/upload." });
    }

    const tableSummaries = [];
    const tablesByCommonKey = {};

    for (const file of files) {
      // Group rows by sheet — each sheet becomes its own clean_data table
      const sheets = db.prepare("SELECT DISTINCT sheet_name FROM data_rows WHERE file_id = ?").all(file.id);
      const sheetNames = sheets.map(s => s.sheet_name).filter(Boolean);
      // If no sheet_name (CSV), treat as single sheet
      const sheetsToProcess = sheetNames.length > 0 ? sheetNames : [null];

      for (const sheetName of sheetsToProcess) {
        const rawRows = sheetName
          ? db.prepare("SELECT row_data FROM data_rows WHERE file_id = ? AND sheet_name = ?").all(file.id, sheetName).map(r => JSON.parse(r.row_data))
          : db.prepare("SELECT row_data FROM data_rows WHERE file_id = ?").all(file.id).map(r => JSON.parse(r.row_data));
        if (rawRows.length === 0) continue;
        const nonEmptyRows = rawRows.filter(row => Object.values(row).some(v => v !== null && v !== undefined && v !== ""));
        if (nonEmptyRows.length === 0) continue;

        const originalKeys = Object.keys(nonEmptyRows[0]);
        const keyMap = {};
        for (const k of originalKeys) keyMap[k] = normalizeColumnName(k);

        const remapped = nonEmptyRows.map(row => {
          const newRow = {};
          for (const [origKey, normKey] of Object.entries(keyMap)) {
            let val = row[origKey];
            if (typeof val === "string") val = val.trim();
            newRow[normKey] = val;
          }
          return newRow;
        });

        const normalizedKeys = Object.values(keyMap);
        const columns = normalizedKeys.map(key => {
          const sampleVals = remapped.map(r => r[key]).filter(v => v !== null && v !== undefined && v !== "").slice(0, 50);
          const type = detectType(sampleVals);
          return { name: key, type, nullable: remapped.some(r => r[key] === null || r[key] === undefined || r[key] === "") };
        });

        const converted = remapped.map(row => {
          const newRow = {};
          for (const col of columns) {
            let val = row[col.name];
            if (val === null || val === undefined || val === "") newRow[col.name] = null;
            else if (col.type === "number") newRow[col.name] = parseFrenchNumber(val);
            else if (col.type === "date") newRow[col.name] = normalizeDate(String(val));
            else newRow[col.name] = String(val).trim();
          }
          return newRow;
        });

        // Use sheet name as table name if multi-sheet, otherwise file name
        const baseName = sheetName
          ? normalizeColumnName(sheetName)
          : normalizeColumnName(path.basename(file.name, path.extname(file.name)));
        const tableName = baseName;
        const colsJson = JSON.stringify(columns);

        const insertClean = db.prepare("INSERT INTO clean_data (table_name, columns, row_data, source_file_id, workspace_id) VALUES (?, ?, ?, ?, ?)");
        const insertMany = db.transaction(items => {
          for (const row of items) insertClean.run(tableName, colsJson, JSON.stringify(row), file.id, workspaceId);
        });
        insertMany(converted);

        const colStats = columns.map(col => {
          const vals = converted.map(r => r[col.name]).filter(v => v !== null && v !== undefined && v !== "");
          const nullCount = converted.length - vals.length;
          const sampleValues = col.type === "string" ? [...new Set(vals)].slice(0, 5) : vals.slice(0, 5);
          return { name: col.name, type: col.type, nullCount, sampleValues };
        });
        tableSummaries.push({ name: tableName, columns: colStats, rowCount: converted.length });

        for (const col of columns) {
          if (!tablesByCommonKey[col.name]) tablesByCommonKey[col.name] = [];
          tablesByCommonKey[col.name].push(tableName);
        }
      }
    }

    db.prepare("UPDATE workspaces SET row_count = (SELECT COUNT(*) FROM clean_data WHERE workspace_id = ?), updated_at = CURRENT_TIMESTAMP WHERE id = ?")
      .run(workspaceId, workspaceId);

    const commonCols = Object.entries(tablesByCommonKey).filter(([, tables]) => tables.length > 1).map(([col, tables]) => ({ column: col, tables }));
    const totalRows = tableSummaries.reduce((s, t) => s + t.rowCount, 0);
    const allCols = tableSummaries.flatMap(t => t.columns);

    const response = {
      tables: tableSummaries,
      cleanedRows: totalRows,
      typedCols: allCols.length,
      numericCols: allCols.filter(c => c.type === "number").length,
      textCols: allCols.filter(c => c.type === "string").length,
      dateCols: allCols.filter(c => c.type === "date").length,
      nullValues: allCols.reduce((s, c) => s + (c.nullCount || 0), 0),
      mergedColumn: commonCols.length > 0 ? commonCols[0].column : null,
    };
    if (commonCols.length > 0) response.mergeOpportunities = commonCols;
    res.json(response);
  } catch (err) {
    console.error("[POST /api/w/:slug/transform]", err);
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/w/:slug/data/preview ─────────────────────────────────────────────

app.get("/api/w/:slug/data/preview", (req, res) => {
  try {
    const workspaceId = req.workspace.id;
    const tables = db.prepare("SELECT DISTINCT table_name FROM clean_data WHERE workspace_id = ?").all(workspaceId).map(r => r.table_name);
    if (tables.length === 0) return res.json({ columns: [], rows: [], totalRows: 0, tables: 0 });

    let allColumns = [];
    let allRows = [];
    let totalRows = 0;

    for (const tableName of tables) {
      const colsRow = db.prepare("SELECT columns FROM clean_data WHERE table_name = ? AND workspace_id = ? LIMIT 1").get(tableName, workspaceId);
      const cols = colsRow ? JSON.parse(colsRow.columns) : [];
      const existingKeys = new Set(allColumns.map(c => c.key || c.name));
      for (const col of cols) {
        const key = col.key || col.name;
        if (!existingKeys.has(key)) { allColumns.push({ key, label: col.label || col.name, type: col.type || "text" }); existingKeys.add(key); }
      }
      const rows = db.prepare("SELECT row_data FROM clean_data WHERE table_name = ? AND workspace_id = ? LIMIT 50").all(tableName, workspaceId).map(r => JSON.parse(r.row_data));
      allRows.push(...rows);
      totalRows += db.prepare("SELECT COUNT(*) AS cnt FROM clean_data WHERE table_name = ? AND workspace_id = ?").get(tableName, workspaceId).cnt;
    }
    res.json({ columns: allColumns, rows: allRows.slice(0, 50), totalRows, tables: tables.length });
  } catch (err) {
    console.error("[GET /api/w/:slug/data/preview]", err);
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/w/:slug/data/columns ─────────────────────────────────────────────

app.get("/api/w/:slug/data/columns", (req, res) => {
  try {
    const workspaceId = req.workspace.id;
    const tables = db.prepare("SELECT DISTINCT table_name FROM clean_data WHERE workspace_id = ?").all(workspaceId).map(r => r.table_name);
    const result = {};
    for (const tableName of tables) {
      const colsRow = db.prepare("SELECT columns FROM clean_data WHERE table_name = ? AND workspace_id = ? LIMIT 1").get(tableName, workspaceId);
      result[tableName] = colsRow ? JSON.parse(colsRow.columns) : [];
    }
    res.json({ columns: result });
  } catch (err) {
    console.error("[GET /api/w/:slug/data/columns]", err);
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/w/:slug/data/stats ───────────────────────────────────────────────

app.get("/api/w/:slug/data/stats", (req, res) => {
  try {
    const allStats = buildColumnStats(req.workspace.id);
    const flat = {};
    for (const tableName of Object.keys(allStats)) Object.assign(flat, allStats[tableName]);
    res.json(flat);
  } catch (err) {
    console.error("[GET /api/w/:slug/data/stats]", err);
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/w/:slug/ai/suggest-reports ──────────────────────────────────────

app.post("/api/w/:slug/ai/suggest-reports", async (req, res) => {
  try {
    const workspaceId = req.workspace.id;
    const context = db.prepare("SELECT * FROM project_context WHERE workspace_id = ?").get(workspaceId);
    const dataSummary = buildDataSummary(5, workspaceId);
    const colStats = buildColumnStats(workspaceId);

    if (dataSummary.length === 0) {
      return res.status(400).json({ error: "Aucune donnée disponible. Importez et transformez des fichiers d'abord." });
    }

    const contextText = context
      ? `Projet : ${context.project_name || "non renseigné"}\nSecteur : ${context.industry || "non renseigné"}\nObjectifs : ${context.objectives || "non renseignés"}\nTexte libre : ${context.free_text || "—"}`
      : "Aucun contexte projet renseigné.";

    const schemaText = dataSummary.map(t => {
      const cols = t.columns.map(c => `  - ${c.name} (${c.type})`).join("\n");
      return `Table "${t.name}" — ${t.rowCount} lignes :\n${cols}\nExemple : ${JSON.stringify(t.sample?.[0] || {})}`;
    }).join("\n\n");

    const statsText = Object.entries(colStats).map(([table, cols]) => {
      const entries = Object.entries(cols).map(([col, s]) =>
        s.type === "number"
          ? `  ${col}: min=${s.min}, max=${s.max}, avg=${s.avg}, nulls=${s.nullCount}`
          : `  ${col}: ${s.uniqueCount} valeurs uniques, exemples=${JSON.stringify(s.sampleValues)}, nulls=${s.nullCount}`
      ).join("\n");
      return `Table "${table}" :\n${entries}`;
    }).join("\n\n");

    const prompt = `Tu es un expert en data analytics pour les mutuelles santé collectives françaises.

CONTEXTE PROJET :
${contextText}

SCHÉMA ET DONNÉES :
${schemaText}

STATISTIQUES PAR COLONNE :
${statsText}

Ta mission : suggérer 5 à 8 rapports analytiques pertinents pour ce jeu de données.
Chaque suggestion doit être directement exploitable avec les colonnes disponibles.

Réponds UNIQUEMENT avec un JSON valide, sans markdown, sans explication, dans ce format exact :
{
  "suggestions": [
    {
      "id": "suggestion_1",
      "title": "Titre du rapport",
      "description": "Description concise de l'analyse et de sa valeur métier",
      "type": "bar|composed|grouped_bar|area_multi|pie_multi|table",
      "columns": ["col1", "col2"],
      "kpis": ["KPI à calculer 1", "KPI à calculer 2"],
      "sections": ["Titre section 1", "Titre section 2"]
    }
  ]
}`;

    const aiResult = await aiComplete("", prompt, { maxTokens: 2000 });
    const rawText = aiResult.text.trim();
    const jsonText = rawText.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    const parsed = JSON.parse(jsonText);

    db.prepare("INSERT INTO usage_logs (action, query, themes, user_id, workspace_id) VALUES (?, ?, ?, ?, ?)")
      .run("report_suggest", "AI suggest-reports", JSON.stringify(["suggestion", "rapport", "analyse"]), "default", workspaceId);

    res.json(parsed);
  } catch (err) {
    console.error("[POST /api/w/:slug/ai/suggest-reports]", err);
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/w/:slug/ai/generate-report ──────────────────────────────────────

app.post("/api/w/:slug/ai/generate-report", async (req, res) => {
  try {
    const { suggestion } = req.body;
    if (!suggestion) return res.status(400).json({ error: "Paramètre 'suggestion' manquant." });

    const workspaceId = req.workspace.id;
    const context = db.prepare("SELECT * FROM project_context WHERE workspace_id = ?").get(workspaceId);
    const dataSummary = buildDataSummary(20, workspaceId);
    const colStats = buildColumnStats(workspaceId);

    const contextText = context
      ? `Projet : ${context.project_name || "—"}\nSecteur : ${context.industry || "—"}\nObjectifs : ${context.objectives || "—"}`
      : "Aucun contexte renseigné.";

    const dataText = dataSummary.map(t =>
      `Table "${t.name}" (${t.rowCount} lignes) :\nColonnes : ${t.columns.map(c => `${c.name}(${c.type})`).join(", ")}\nExemples :\n${t.sample.map(r => JSON.stringify(r)).join("\n")}`
    ).join("\n\n");

    const statsText = Object.entries(colStats).map(([table, cols]) => {
      const entries = Object.entries(cols).map(([col, s]) =>
        s.type === "number" ? `  ${col}: min=${s.min}, max=${s.max}, avg=${s.avg}` : `  ${col}: ${s.uniqueCount} valeurs uniques`
      ).join("\n");
      return `Table "${table}" :\n${entries}`;
    }).join("\n\n");

    const prompt = `Tu es un expert data pour mutuelles santé collectives françaises.

CONTEXTE :
${contextText}

RAPPORT À GÉNÉRER :
Titre : ${suggestion.title}
Description : ${suggestion.description}
Type principal : ${suggestion.type}
Colonnes clés : ${(suggestion.columns || []).join(", ")}
KPIs demandés : ${(suggestion.kpis || []).join(", ")}

DONNÉES DISPONIBLES :
${dataText}

STATISTIQUES :
${statsText}

Génère un rapport analytique complet avec des données RÉELLES calculées depuis les données fournies.

RÈGLES IMPORTANTES pour le format des sections :
- type "bar" : config doit avoir { xKey, yKeys: [...], colors: [...] }
- type "composed" : config doit avoir { xKey, bars: [{key, color, name}], line: {key, color, name} }
- type "grouped_bar" : config doit avoir { xKey, yKeys: [...], colors: [...], names: [...] }
- type "area_multi" : config doit avoir { xKey, yKeys: [...], colors: [...], names: [...] }
- type "pie_multi" : doit avoir data_sets: [{label, data: [{name, value}]}]
- type "table" : doit avoir columns: [{key, label, align?, fmt?, hl?}]
- Les couleurs disponibles : "#C8FF3C" (lite), "#4A90B8" (signal), "#C45A32" (warm), "#D4A03A" (warning), "#3A8A4A" (success)

Réponds UNIQUEMENT avec un JSON valide, sans markdown :
{
  "id": "report_<uuid>",
  "title": "...",
  "subtitle": "...",
  "objective": "...",
  "color": "#4A90B8",
  "kpis": [
    { "label": "...", "value": "...", "trend": "+X%", "bad": false }
  ],
  "sections": [
    {
      "title": "...",
      "type": "bar|composed|grouped_bar|area_multi|pie_multi|table",
      "insight": "Observation analytique clé",
      "data": [...],
      "config": { ... }
    }
  ]
}`;

    const aiResult = await aiComplete("", prompt, { maxTokens: 4000 });
    const rawText = aiResult.text.trim();
    const jsonText = rawText.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    const report = JSON.parse(jsonText);
    report.id = report.id || `report_${uuidv4()}`;

    db.prepare(`
      INSERT INTO reports (id, title, subtitle, objective, color, icon, kpis, sections, shared, starred, source, workspace_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, 0, 'ai', ?)
    `).run(report.id, report.title, report.subtitle || null, report.objective || null, report.color || "#4A90B8", report.icon || "BarChart3", JSON.stringify(report.kpis || []), JSON.stringify(report.sections || []), workspaceId);

    db.prepare("INSERT INTO usage_logs (action, query, themes, user_id, workspace_id) VALUES (?, ?, ?, ?, ?)")
      .run("report_generate", `Generated: ${report.title}`, JSON.stringify(extractThemes(report.title)), "default", workspaceId);

    res.json({ report });
  } catch (err) {
    console.error("[POST /api/w/:slug/ai/generate-report]", err);
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/w/:slug/chat-sessions ───────────────────────────────────────────

app.get("/api/w/:slug/chat-sessions", (req, res) => {
  try {
    const rows = db.prepare(
      "SELECT id, title, created_at, updated_at FROM chat_sessions WHERE workspace_id = ? ORDER BY updated_at DESC LIMIT 20"
    ).all(req.workspace.id);
    res.json({ sessions: rows });
  } catch (err) {
    console.error("[GET /api/w/:slug/chat-sessions]", err);
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/w/:slug/chat-sessions/:id ──────────────────────────────────────

app.get("/api/w/:slug/chat-sessions/:id", (req, res) => {
  try {
    const row = db.prepare("SELECT * FROM chat_sessions WHERE id = ? AND workspace_id = ?").get(req.params.id, req.workspace.id);
    if (!row) return res.status(404).json({ error: "Session introuvable." });
    res.json({ ...row, messages: JSON.parse(row.messages || "[]") });
  } catch (err) {
    console.error("[GET /api/w/:slug/chat-sessions/:id]", err);
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/w/:slug/chat-sessions ─────────────────────────────────────────

app.post("/api/w/:slug/chat-sessions", (req, res) => {
  try {
    const id = `chat_${uuidv4()}`;
    const title = req.body.title || "Nouvelle conversation";
    db.prepare("INSERT INTO chat_sessions (id, workspace_id, title, messages) VALUES (?, ?, ?, '[]')")
      .run(id, req.workspace.id, title);
    res.json({ id, title, messages: [], created_at: new Date().toISOString() });
  } catch (err) {
    console.error("[POST /api/w/:slug/chat-sessions]", err);
    res.status(500).json({ error: err.message });
  }
});

// ── PATCH /api/w/:slug/chat-sessions/:id ────────────────────────────────────

app.patch("/api/w/:slug/chat-sessions/:id", (req, res) => {
  try {
    const { title, messages } = req.body;
    const existing = db.prepare("SELECT * FROM chat_sessions WHERE id = ? AND workspace_id = ?").get(req.params.id, req.workspace.id);
    if (!existing) return res.status(404).json({ error: "Session introuvable." });
    db.prepare("UPDATE chat_sessions SET title = ?, messages = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?")
      .run(title || existing.title, messages !== undefined ? JSON.stringify(messages) : existing.messages, req.params.id);
    res.json({ success: true });
  } catch (err) {
    console.error("[PATCH /api/w/:slug/chat-sessions/:id]", err);
    res.status(500).json({ error: err.message });
  }
});

// ── DELETE /api/w/:slug/chat-sessions/:id ───────────────────────────────────

app.delete("/api/w/:slug/chat-sessions/:id", (req, res) => {
  try {
    db.prepare("DELETE FROM chat_sessions WHERE id = ? AND workspace_id = ?").run(req.params.id, req.workspace.id);
    res.json({ success: true });
  } catch (err) {
    console.error("[DELETE /api/w/:slug/chat-sessions/:id]", err);
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/w/:slug/ai/chat ─────────────────────────────────────────────────

app.post("/api/w/:slug/ai/chat", async (req, res) => {
  try {
    const { message, history = [] } = req.body;
    if (!message) return res.status(400).json({ error: "Paramètre 'message' manquant." });

    const workspaceId = req.workspace.id;
    const context = db.prepare("SELECT * FROM project_context WHERE workspace_id = ?").get(workspaceId);
    const fullData = buildFullDataContext(workspaceId);

    const projectName = context?.project_name || req.workspace.name || "Analyse";
    const industry = context?.industry || req.workspace.industry || "";
    const objectives = context?.objectives || "";
    const questionnaire = context?.questionnaire ? JSON.parse(context.questionnaire) : {};
    const scope = questionnaire.perimetre || "";
    const indicateurs = questionnaire.indicateurs || [];

    // Build rich data context
    let dataContext = "";
    for (const table of fullData.tables) {
      dataContext += `\n## Table "${table.name}" — ${table.rowCount} lignes\n`;
      dataContext += `Colonnes : ${table.columns.join(", ")}\n`;

      // Numeric stats
      if (Object.keys(table.numericStats).length > 0) {
        dataContext += "\nStatistiques numériques :\n";
        for (const [col, s] of Object.entries(table.numericStats)) {
          dataContext += `  ${col}: min=${s.min}, max=${s.max}, moyenne=${s.avg}, médiane=${s.median}, somme=${s.sum}, count=${s.count}\n`;
        }
      }

      // Full distributions
      if (Object.keys(table.distributions).length > 0) {
        dataContext += "\nDistributions catégorielles :\n";
        for (const [col, d] of Object.entries(table.distributions)) {
          const valStr = Object.entries(d.values).map(([v, c]) => `${v}: ${c}`).join(", ");
          dataContext += `  ${col} (${d.uniqueCount} valeurs): ${valStr}\n`;
        }
      }

      // Cross-tabs (key aggregations)
      if (Object.keys(table.crossTabs).length > 0) {
        dataContext += "\nAgrégations croisées :\n";
        for (const [catCol, groups] of Object.entries(table.crossTabs)) {
          dataContext += `  Par ${catCol}:\n`;
          for (const [val, agg] of Object.entries(groups)) {
            const numStr = Object.entries(agg)
              .filter(([k]) => k !== "count")
              .map(([k, v]) => `${k}: moy=${v.avg}, somme=${v.sum}`)
              .join("; ");
            dataContext += `    ${val} (${agg.count} lignes)${numStr ? " — " + numStr : ""}\n`;
          }
        }
      }

      // Sample data rows (limit to avoid exceeding token limits)
      if (table.allData && table.allData.length > 0) {
        const maxRows = aiMode === "local" ? 15 : 50;
        const sampleData = table.allData.slice(0, maxRows);
        dataContext += `\nÉchantillon de données (${sampleData.length} sur ${table.allData.length} lignes) :\n`;
        dataContext += JSON.stringify(sampleData, null, 0) + "\n";
      }
    }

    const systemPrompt = `Tu es Minipilot, un assistant analytique expert. Tu analyses les données du projet "${projectName}"${industry ? ` dans le secteur ${industry}` : ""}.
${objectives ? `\nObjectifs du projet : ${objectives}` : ""}
${scope ? `\nPérimètre : ${scope}` : ""}
${indicateurs.length ? `\nAxes d'analyse attendus : ${indicateurs.join(", ")}` : ""}

DONNÉES DISPONIBLES :
${dataContext}

RÈGLES IMPÉRATIVES :
1. Réponds TOUJOURS en français, de manière professionnelle, institutionnelle et factuelle.
2. Base tes réponses EXCLUSIVEMENT sur les données fournies ci-dessus. Calcule les vrais chiffres à partir des distributions et agrégations.
3. Quand on te demande une analyse, un classement, une répartition ou un reporting → génère TOUJOURS un rapport avec des données réelles tirées du dataset.
4. Ne jamais inventer de données. Utilise uniquement ce qui figure dans les distributions, statistiques et données complètes ci-dessus.
5. Pour les KPIs, calcule les valeurs réelles (ex : nombre total de risques critiques = compter dans la distribution de Niveau_brut ou Niveau_residuel).

FORMAT DU RAPPORT :
Si tu génères un rapport, inclus TOUJOURS un bloc JSON valide entre <REPORT_DATA> et </REPORT_DATA>.
Le JSON doit respecter exactement cette structure :
{
  "id": "report_<uuid>",
  "title": "Titre court et descriptif",
  "subtitle": "Sous-titre explicatif",
  "objective": "Ce que ce rapport permet de comprendre",
  "color": "#4A90B8",
  "icon": "BarChart3",
  "kpis": [
    { "label": "Label KPI", "value": "123", "trend": "+X%", "bad": false }
  ],
  "sections": [
    {
      "title": "Titre de la section",
      "type": "bar|grouped_bar|composed|area_multi|pie_multi|table",
      "insight": "Phrase d'analyse clé de cette section",
      "data": [...],
      "config": { ... }
    }
  ]
}

TYPES DE SECTIONS DISPONIBLES :
- "bar" : graphique en barres — config: { xKey, yKeys: [...], colors: [...] }
- "grouped_bar" : barres groupées — config: { xKey, yKeys: [...], colors: [...], names: [...] }
- "composed" : barres + ligne — config: { xKey, bars: [{key, color, name}], line: {key, color, name} }
- "pie_multi" : camemberts — pas de config, mais "data_sets": [{ label: "...", data: [{name, value}] }]
- "table" : tableau de données — "columns": [{ key, label, align?, fmt?, hl? }], "data": [{...}]
  IMPORTANT pour les tables: tu DOIS fournir le champ "columns" (array d'objets avec key et label) ET "data" (array d'objets).
  Exemple: { "type": "table", "title": "Top 10", "columns": [{"key":"nom","label":"Nom"},{"key":"score","label":"Score","align":"right","fmt":"number"}], "data": [{"nom":"X","score":12}] }

COULEURS : utilise "#4A90B8" (bleu signal), "#C45A32" (rouge alerte), "#D4A03A" (jaune warning), "#3A8A4A" (vert), "#B0D838" (vert accent).

RÈGLE CRITIQUE SUR LE FORMAT DE SORTIE :
- Tu DOIS TOUJOURS envelopper le JSON du rapport entre les balises <REPORT_DATA> et </REPORT_DATA>.
- NE PAS utiliser de bloc markdown \`\`\`json. Utilise UNIQUEMENT les balises <REPORT_DATA>.
- Le JSON doit être valide : pas de commentaires (//), pas de virgules en fin de tableau/objet.
- Exemple correct :
<REPORT_DATA>
{"id":"report_xxx","title":"Mon rapport","kpis":[],"sections":[]}
</REPORT_DATA>
- Si tu ne génères PAS de rapport (question purement factuelle), réponds avec du texte structuré.
- En cas de doute, génère TOUJOURS un rapport avec les données réelles.`;

    const messages = [
      ...history.map(h => ({ role: h.role, content: h.content })),
      { role: "user", content: message },
    ];

    const wsMaxTokens = aiMode === "local" ? 3000 : 8000;
    const aiResponse = await aiChat(systemPrompt, messages, { maxTokens: wsMaxTokens });
    let rawResponse = aiResponse.text;
    if (aiResponse.provider === "ollama") {
      rawResponse = truncateRepetitions(rawResponse);
    }

    let reportData = null;
    let cleanResponse = rawResponse;

    const extracted = extractReportFromResponse(rawResponse);
    if (extracted) {
      try {
        reportData = extracted.json;
        reportData.id = reportData.id || `report_${uuidv4()}`;
        cleanResponse = extracted.cleanText;
        db.prepare(`
          INSERT OR REPLACE INTO reports (id, title, subtitle, objective, color, icon, kpis, sections, shared, starred, source, workspace_id)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, 0, 'chat', ?)
        `).run(reportData.id, reportData.title, reportData.subtitle || null, reportData.objective || null, reportData.color || "#4A90B8", reportData.icon || "BarChart3", JSON.stringify(reportData.kpis || []), JSON.stringify(reportData.sections || []), workspaceId);
      } catch (parseErr) {
        console.error("[chat ws] Impossible de parser le rapport JSON :", parseErr.message);
        reportData = null;
        cleanResponse = rawResponse;
      }
    }

    const themes = extractThemes(message);
    db.prepare("INSERT INTO usage_logs (action, query, themes, user_id, workspace_id) VALUES (?, ?, ?, ?, ?)")
      .run("chat_query", message, JSON.stringify(themes), "default", workspaceId);

    res.json({
      response: cleanResponse,
      provider: aiResponse.provider || aiMode,
      model: aiResponse.model || null,
      ...(reportData ? { reportData } : {}),
    });
  } catch (err) {
    console.error("[POST /api/w/:slug/ai/chat]", err);
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/w/:slug/reports ──────────────────────────────────────────────────

app.get("/api/w/:slug/reports", (req, res) => {
  try {
    const rows = db.prepare("SELECT * FROM reports WHERE workspace_id = ? AND (trashed IS NULL OR trashed = 0) ORDER BY created_at DESC").all(req.workspace.id);
    const reports = rows.map(deserializeReport);
    res.json({ shared: reports.filter(r => r.shared), private: reports.filter(r => !r.shared) });
  } catch (err) {
    console.error("[GET /api/w/:slug/reports]", err);
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/w/:slug/reports ─────────────────────────────────────────────────

app.post("/api/w/:slug/reports", (req, res) => {
  try {
    const { title, subtitle, objective, color, icon, kpis, sections, shared, source } = req.body;
    if (!title) return res.status(400).json({ error: "Champ 'title' requis." });
    const workspaceId = req.workspace.id;
    const id = `report_${uuidv4()}`;
    db.prepare(`
      INSERT INTO reports (id, title, subtitle, objective, color, icon, kpis, sections, shared, starred, source, workspace_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)
    `).run(id, title, subtitle || null, objective || null, color || "#4A90B8", icon || "BarChart3", JSON.stringify(kpis || []), JSON.stringify(sections || []), shared ? 1 : 0, source || "chat", workspaceId);
    const created = db.prepare("SELECT * FROM reports WHERE id = ?").get(id);
    db.prepare("INSERT INTO usage_logs (action, query, themes, user_id, workspace_id) VALUES (?, ?, ?, ?, ?)")
      .run("report_create", `Created: ${title}`, JSON.stringify(extractThemes(title)), "default", workspaceId);
    res.status(201).json({ report: deserializeReport(created) });
  } catch (err) {
    console.error("[POST /api/w/:slug/reports]", err);
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/w/:slug/reports/:id ─────────────────────────────────────────────

app.get("/api/w/:slug/reports/:id", (req, res) => {
  try {
    const { id } = req.params;
    const row = db.prepare("SELECT * FROM reports WHERE id = ? AND workspace_id = ?").get(id, req.workspace.id);
    if (!row) return res.status(404).json({ error: "Rapport introuvable." });
    res.json(deserializeReport(row));
  } catch (err) {
    console.error("[GET /api/w/:slug/reports/:id]", err);
    res.status(500).json({ error: err.message });
  }
});

// ── PATCH /api/w/:slug/reports/:id ───────────────────────────────────────────

app.patch("/api/w/:slug/reports/:id", (req, res) => {
  try {
    const { id } = req.params;
    const existing = db.prepare("SELECT * FROM reports WHERE id = ? AND workspace_id = ?").get(id, req.workspace.id);
    if (!existing) return res.status(404).json({ error: "Rapport introuvable." });

    const { starred, shared, title, subtitle, objective, color } = req.body;
    db.prepare(`
      UPDATE reports SET
        starred = ?, shared = ?, title = ?, subtitle = ?, objective = ?, color = ?
      WHERE id = ? AND workspace_id = ?
    `).run(
      starred !== undefined ? (starred ? 1 : 0) : existing.starred,
      shared !== undefined ? (shared ? 1 : 0) : existing.shared,
      title !== undefined ? title : existing.title,
      subtitle !== undefined ? subtitle : existing.subtitle,
      objective !== undefined ? objective : existing.objective,
      color !== undefined ? color : existing.color,
      id, req.workspace.id
    );
    const updated = db.prepare("SELECT * FROM reports WHERE id = ?").get(id);
    res.json({ report: deserializeReport(updated) });
  } catch (err) {
    console.error("[PATCH /api/w/:slug/reports/:id]", err);
    res.status(500).json({ error: err.message });
  }
});

// ── DELETE /api/w/:slug/reports/:id (soft-delete → corbeille) ────────────────

app.delete("/api/w/:slug/reports/:id", (req, res) => {
  try {
    const { id } = req.params;
    const existing = db.prepare("SELECT * FROM reports WHERE id = ? AND workspace_id = ?").get(id, req.workspace.id);
    if (!existing) return res.status(404).json({ error: "Rapport introuvable." });
    db.prepare("UPDATE reports SET trashed = 1 WHERE id = ? AND workspace_id = ?").run(id, req.workspace.id);
    res.json({ success: true });
  } catch (err) {
    console.error("[DELETE /api/w/:slug/reports/:id]", err);
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/w/:slug/reports/trash ──────────────────────────────────────────

app.get("/api/w/:slug/reports-trash", (req, res) => {
  try {
    const rows = db.prepare("SELECT * FROM reports WHERE workspace_id = ? AND trashed = 1 ORDER BY created_at DESC").all(req.workspace.id);
    res.json({ reports: rows.map(deserializeReport) });
  } catch (err) {
    console.error("[GET /api/w/:slug/reports-trash]", err);
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/w/:slug/reports/:id/restore ───────────────────────────────────

app.post("/api/w/:slug/reports/:id/restore", (req, res) => {
  try {
    const { id } = req.params;
    const existing = db.prepare("SELECT * FROM reports WHERE id = ? AND workspace_id = ? AND trashed = 1").get(id, req.workspace.id);
    if (!existing) return res.status(404).json({ error: "Rapport introuvable dans la corbeille." });
    db.prepare("UPDATE reports SET trashed = 0 WHERE id = ? AND workspace_id = ?").run(id, req.workspace.id);
    res.json({ success: true, report: deserializeReport(db.prepare("SELECT * FROM reports WHERE id = ?").get(id)) });
  } catch (err) {
    console.error("[POST /api/w/:slug/reports/:id/restore]", err);
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/w/:slug/logs ─────────────────────────────────────────────────────

app.get("/api/w/:slug/logs", (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 50, 200);
    const offset = (page - 1) * limit;
    const workspaceId = req.workspace.id;

    const logs = db.prepare("SELECT * FROM usage_logs WHERE workspace_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?").all(workspaceId, limit, offset);
    const total = db.prepare("SELECT COUNT(*) AS cnt FROM usage_logs WHERE workspace_id = ?").get(workspaceId).cnt;

    res.json({
      logs: logs.map(l => ({ id: l.id, timestamp: l.created_at, action: l.action, query: l.query, themes: l.themes ? JSON.parse(l.themes) : [], userId: l.user_id })),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    console.error("[GET /api/w/:slug/logs]", err);
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/w/:slug/stats/themes ─────────────────────────────────────────────

app.get("/api/w/:slug/stats/themes", (req, res) => {
  try {
    const workspaceId = req.workspace.id;
    const chatLogs = db.prepare("SELECT themes FROM usage_logs WHERE action = 'chat_query' AND themes IS NOT NULL AND workspace_id = ?").all(workspaceId);
    const themeCounts = {};
    for (const log of chatLogs) {
      try {
        const themes = JSON.parse(log.themes);
        for (const theme of themes) { if (theme) themeCounts[theme] = (themeCounts[theme] || 0) + 1; }
      } catch {}
    }
    const sorted = Object.entries(themeCounts).sort((a, b) => b[1] - a[1]).slice(0, 20).map(([topic, count]) => ({ topic, count }));
    res.json({ themes: sorted });
  } catch (err) {
    console.error("[GET /api/w/:slug/stats/themes]", err);
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/w/:slug/stats/usage ──────────────────────────────────────────────

app.get("/api/w/:slug/stats/usage", (req, res) => {
  try {
    const workspaceId = req.workspace.id;
    const perDay = db.prepare(`
      SELECT date(created_at) AS day, COUNT(*) AS count
      FROM usage_logs
      WHERE created_at >= date('now', '-30 days') AND workspace_id = ?
      GROUP BY date(created_at)
      ORDER BY day ASC
    `).all(workspaceId);
    const reportsGenerated = db.prepare("SELECT COUNT(*) AS cnt FROM usage_logs WHERE action IN ('report_generate', 'report_create') AND workspace_id = ?").get(workspaceId).cnt;
    const chatQueries = db.prepare("SELECT COUNT(*) AS cnt FROM usage_logs WHERE action = 'chat_query' AND workspace_id = ?").get(workspaceId).cnt;
    const activeUsers = db.prepare("SELECT COUNT(DISTINCT user_id) AS cnt FROM usage_logs WHERE created_at >= date('now', '-7 days') AND workspace_id = ?").get(workspaceId).cnt;
    const totalReports = db.prepare("SELECT COUNT(*) AS cnt FROM reports WHERE workspace_id = ?").get(workspaceId).cnt;
    res.json({ queriesPerDay: perDay, reportsGenerated, chatQueries, activeUsers, totalReports });
  } catch (err) {
    console.error("[GET /api/w/:slug/stats/usage]", err);
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/w/:slug/onboarding/status ───────────────────────────────────────

app.get("/api/w/:slug/onboarding/status", (req, res) => {
  try {
    const workspaceId = req.workspace.id;
    const filesCount = db.prepare("SELECT COUNT(*) AS cnt FROM uploaded_files WHERE workspace_id = ?").get(workspaceId).cnt;
    const contextSet = !!db.prepare("SELECT id FROM project_context WHERE workspace_id = ?").get(workspaceId);
    const dataTransformed = db.prepare("SELECT COUNT(*) AS cnt FROM clean_data WHERE workspace_id = ?").get(workspaceId).cnt > 0;
    const reportsCount = db.prepare("SELECT COUNT(*) AS cnt FROM reports WHERE workspace_id = ?").get(workspaceId).cnt;

    const completedSteps = [];
    let currentStep;

    if (filesCount === 0) {
      currentStep = "upload";
    } else if (!contextSet) {
      completedSteps.push("upload");
      currentStep = "context";
    } else if (!dataTransformed) {
      completedSteps.push("upload", "context");
      currentStep = "transform";
    } else if (reportsCount === 0) {
      completedSteps.push("upload", "context", "transform");
      currentStep = "verify";
    } else {
      completedSteps.push("upload", "context", "transform", "verify", "suggest");
      currentStep = "complete";
    }

    res.json({ step: currentStep, currentStep, completedSteps, filesUploaded: filesCount, contextSet, dataTransformed, reportsCount });
  } catch (err) {
    console.error("[GET /api/w/:slug/onboarding/status]", err);
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/w/:slug/onboarding/reset ───────────────────────────────────────

app.post("/api/w/:slug/onboarding/reset", (req, res) => {
  try {
    const workspaceId = req.workspace.id;
    db.prepare("DELETE FROM usage_logs WHERE workspace_id = ?").run(workspaceId);
    db.prepare("DELETE FROM reports WHERE workspace_id = ?").run(workspaceId);
    db.prepare("DELETE FROM clean_data WHERE workspace_id = ?").run(workspaceId);
    const fileIds = db.prepare("SELECT id FROM uploaded_files WHERE workspace_id = ?").all(workspaceId).map(r => r.id);
    for (const fid of fileIds) db.prepare("DELETE FROM data_rows WHERE file_id = ?").run(fid);
    db.prepare("DELETE FROM uploaded_files WHERE workspace_id = ?").run(workspaceId);
    db.prepare("DELETE FROM project_context WHERE workspace_id = ?").run(workspaceId);
    db.prepare("UPDATE workspaces SET file_count = 0, row_count = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(workspaceId);
    res.json({ success: true, message: "Onboarding de l'espace réinitialisé." });
  } catch (err) {
    console.error("[POST /api/w/:slug/onboarding/reset]", err);
    res.status(500).json({ error: err.message });
  }
});

// ─── 404 handler ──────────────────────────────────────────────────────────────

app.use((req, res) => {
  res.status(404).json({ error: `Route introuvable : ${req.method} ${req.path}` });
});

// ─── Global error handler ─────────────────────────────────────────────────────

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error("[Unhandled error]", err);
  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(413).json({ error: "Fichier trop volumineux (max 50 Mo)." });
  }
  res.status(500).json({ error: err.message || "Erreur serveur interne." });
});

// ─── Health check ─────────────────────────────────────────────────────────────

app.get("/api/health", (req, res) => {
  try {
    db.prepare("SELECT 1").get();
    res.json({ status: "ok", db: "connected" });
  } catch (e) {
    res.status(500).json({ status: "error", db: e.message });
  }
});

// ─── Static file serving (Docker / production) ───────────────────────────────

const STATIC_DIR = path.join(__dirname, "..", "app", "dist");
if (!IS_VERCEL && fs.existsSync(STATIC_DIR)) {
  app.use(express.static(STATIC_DIR));
  // SPA fallback — serve index.html for any non-API route
  app.get("*", (req, res) => {
    if (!req.path.startsWith("/api")) {
      res.sendFile(path.join(STATIC_DIR, "index.html"));
    }
  });
}

// ─── Start ────────────────────────────────────────────────────────────────────

// Export for Vercel serverless
export default app;

// Only listen in dev mode or Docker (not on Vercel)
if (!IS_VERCEL) {
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => {
    console.log(`Minipilot server — http://localhost:${PORT}`);
    console.log(`Database : ${DB_PATH}`);
    console.log(`Uploads  : ${UPLOADS_DIR}`);
    if (fs.existsSync(STATIC_DIR)) console.log(`Frontend : ${STATIC_DIR}`);
  });
}
