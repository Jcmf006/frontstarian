import { useState, useEffect, useRef } from "react";
import { healthCheck, uploadFile, ingestText, searchDocuments } from "./api.js";
import "./App.css";

// ── Icons (inline SVG) ──────────────────────────────────────────────────────
const Icon = {
  Upload: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="16 16 12 12 8 16" /><line x1="12" y1="12" x2="12" y2="21" />
      <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
    </svg>
  ),
  Search: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  ),
  Text: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="4 7 4 4 20 4 20 7" /><line x1="9" y1="20" x2="15" y2="20" />
      <line x1="12" y1="4" x2="12" y2="20" />
    </svg>
  ),
  Health: () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
      <circle cx="12" cy="12" r="10" />
    </svg>
  ),
  Close: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
  File: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  ),
};

// ── Toast ────────────────────────────────────────────────────────────────────
function Toast({ toasts, remove }) {
  return (
    <div className="toast-container">
      {toasts.map((t) => (
        <div key={t.id} className={`toast toast--${t.type}`}>
          <span>{t.message}</span>
          <button onClick={() => remove(t.id)}><Icon.Close /></button>
        </div>
      ))}
    </div>
  );
}

function useToast() {
  const [toasts, setToasts] = useState([]);
  const add = (message, type = "info") => {
    const id = Date.now();
    setToasts((p) => [...p, { id, message, type }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 4000);
  };
  const remove = (id) => setToasts((p) => p.filter((t) => t.id !== id));
  return { toasts, toast: add, remove };
}

// ── Section: Upload ──────────────────────────────────────────────────────────
function UploadSection({ toast, onSuccess }) {
  const [file, setFile] = useState(null);
  const [sourceName, setSourceName] = useState("");
  const [loading, setLoading] = useState(false);
  const [drag, setDrag] = useState(false);
  const inputRef = useRef();

  const handleFile = (f) => {
    if (!f) return;
    setFile(f);
    if (!sourceName) setSourceName(f.name);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDrag(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const submit = async () => {
    if (!file) { toast("Selecione um arquivo", "error"); return; }
    setLoading(true);
    try {
      const res = await uploadFile(file, sourceName || file.name);
      toast(`✓ Documento salvo — ID: ${res.id.slice(0, 8)}…`, "success");
      setFile(null);
      setSourceName("");
      onSuccess(res);
    } catch (e) {
      toast(e.message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="section">
      <div className="section-header">
        <Icon.Upload />
        <span>Upload de arquivo</span>
      </div>

      <div
        className={`dropzone ${drag ? "dropzone--active" : ""} ${file ? "dropzone--filled" : ""}`}
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.png,.jpg,.jpeg,.bmp,.tiff,.txt"
          style={{ display: "none" }}
          onChange={(e) => handleFile(e.target.files[0])}
        />
        {file ? (
          <div className="dropzone-file">
            <Icon.File />
            <span className="dropzone-filename">{file.name}</span>
            <span className="dropzone-size">
              {(file.size / 1024).toFixed(1)} KB
            </span>
          </div>
        ) : (
          <div className="dropzone-placeholder">
            <span className="dropzone-hint">arraste ou clique para selecionar</span>
            <span className="dropzone-types">PDF · PNG · JPG · TXT</span>
          </div>
        )}
      </div>

      <div className="field">
        <label className="label">nome da fonte</label>
        <input
          className="input"
          placeholder="ex: relatorio-q1.pdf"
          value={sourceName}
          onChange={(e) => setSourceName(e.target.value)}
        />
      </div>

      <button className="btn btn--primary" onClick={submit} disabled={loading || !file}>
        {loading ? <span className="spinner" /> : null}
        {loading ? "processando…" : "enviar documento"}
      </button>
    </div>
  );
}

// ── Section: Text Ingest ─────────────────────────────────────────────────────
function TextSection({ toast, onSuccess }) {
  const [text, setText] = useState("");
  const [sourceName, setSourceName] = useState("texto-direto");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!text.trim()) { toast("Texto vazio", "error"); return; }
    setLoading(true);
    try {
      const res = await ingestText(text.trim(), sourceName || "texto-direto");
      toast(`✓ Texto indexado — ID: ${res.id.slice(0, 8)}…`, "success");
      setText("");
      onSuccess(res);
    } catch (e) {
      toast(e.message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="section">
      <div className="section-header">
        <Icon.Text />
        <span>Ingestão de texto</span>
      </div>

      <div className="field">
        <label className="label">conteúdo</label>
        <textarea
          className="textarea"
          placeholder="Cole ou digite o texto a ser indexado…"
          rows={6}
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <span className="char-count">{text.length} caracteres</span>
      </div>

      <div className="field">
        <label className="label">nome da fonte</label>
        <input
          className="input"
          value={sourceName}
          onChange={(e) => setSourceName(e.target.value)}
        />
      </div>

      <button className="btn btn--primary" onClick={submit} disabled={loading || !text.trim()}>
        {loading ? <span className="spinner" /> : null}
        {loading ? "indexando…" : "indexar texto"}
      </button>
    </div>
  );
}

// ── Section: Search ──────────────────────────────────────────────────────────
function SearchSection({ toast }) {
  const [query, setQuery] = useState("");
  const [nResults, setNResults] = useState(5);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);

  const submit = async (e) => {
    e?.preventDefault();
    if (!query.trim()) { toast("Query vazia", "error"); return; }
    setLoading(true);
    try {
      const res = await searchDocuments(query.trim(), nResults);
      setResults(res);
      if (!res.results.length) toast("Nenhum resultado encontrado", "info");
    } catch (e) {
      toast(e.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const scoreColor = (d) => {
    if (d < 0.3) return "var(--accent)";
    if (d < 0.6) return "var(--orange)";
    return "var(--text-muted)";
  };

  const typeLabel = (ct) => {
    const map = { pdf: "PDF", foto: "IMG", texto: "TXT" };
    return map[ct?.toLowerCase()] || ct || "?";
  };

  return (
    <div className="section search-section">
      <div className="section-header">
        <Icon.Search />
        <span>Busca semântica</span>
      </div>

      <form className="search-form" onSubmit={submit}>
        <div className="search-row">
          <input
            className="input search-input"
            placeholder="o que você quer encontrar?"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <div className="n-results-control">
            <label className="label">top</label>
            <select
              className="select"
              value={nResults}
              onChange={(e) => setNResults(Number(e.target.value))}
            >
              {[3, 5, 10].map((n) => <option key={n}>{n}</option>)}
            </select>
          </div>
          <button className="btn btn--accent" type="submit" disabled={loading}>
            {loading ? <span className="spinner" /> : <Icon.Search />}
          </button>
        </div>
      </form>

      {results && (
        <div className="results">
          <div className="results-meta">
            <span className="label">
              {results.results.length} resultado{results.results.length !== 1 ? "s" : ""}
              {" "}para{" "}
              <em>"{results.query}"</em>
            </span>
          </div>

          {results.results.length === 0 ? (
            <div className="empty-results">sem documentos relevantes</div>
          ) : (
            results.results.map((r, i) => (
              <div className="result-card" key={r.id}>
                <div className="result-header">
                  <div className="result-rank">#{i + 1}</div>
                  <span className={`type-badge type-badge--${r.content_type?.toLowerCase()}`}>
                    {typeLabel(r.content_type)}
                  </span>
                  <span className="result-source">{r.source_name || r.metadata?.source || "—"}</span>
                  <span className="result-score" style={{ color: scoreColor(r.distance) }}>
                    dist {r.distance?.toFixed(4)}
                  </span>
                </div>
                <div className="result-id">{r.id}</div>
                <p className="result-excerpt">{r.document}</p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [tab, setTab] = useState("search");
  const [apiStatus, setApiStatus] = useState("checking");
  const [recentDocs, setRecentDocs] = useState([]);
  const { toasts, toast, remove } = useToast();

  useEffect(() => {
    healthCheck()
      .then(() => setApiStatus("online"))
      .catch(() => setApiStatus("offline"));
  }, []);

  const handleSuccess = (doc) => {
    setRecentDocs((prev) => [doc, ...prev].slice(0, 5));
  };

  const tabs = [
    { id: "search", label: "buscar", icon: <Icon.Search /> },
    { id: "upload", label: "upload", icon: <Icon.Upload /> },
    { id: "text", label: "texto", icon: <Icon.Text /> },
  ];

  return (
    <div className="app">
      <Toast toasts={toasts} remove={remove} />

      {/* Header */}
      <header className="header">
        <div className="header-brand">
          <span className="brand-dot" />
          <span className="brand-name">SpotData</span>
          <span className="brand-version">v0.1</span>
        </div>

        <nav className="tabs">
          {tabs.map((t) => (
            <button
              key={t.id}
              className={`tab ${tab === t.id ? "tab--active" : ""}`}
              onClick={() => setTab(t.id)}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </nav>

        <div className={`status-badge status-badge--${apiStatus}`}>
          <Icon.Health />
          <span>API {apiStatus}</span>
        </div>
      </header>

      {/* Main */}
      <main className="main">
        <div className="main-inner">
          {/* Left: active panel */}
          <div className="panel">
            {tab === "search" && <SearchSection toast={toast} />}
            {tab === "upload" && <UploadSection toast={toast} onSuccess={handleSuccess} />}
            {tab === "text" && <TextSection toast={toast} onSuccess={handleSuccess} />}
          </div>

          {/* Right: sidebar */}
          <aside className="sidebar">
            <div className="sidebar-section">
              <div className="label" style={{ marginBottom: "12px" }}>sobre</div>
              <p className="sidebar-text">
                Ingestão e busca semântica de documentos via{" "}
                <strong>FastAPI</strong>, <strong>PostgreSQL</strong> e{" "}
                <strong>ChromaDB</strong>.
              </p>
              <div className="endpoint-list">
                {[
                  ["GET", "/health"],
                  ["POST", "/documents/upload"],
                  ["POST", "/documents/text"],
                  ["GET", "/documents/search"],
                ].map(([method, path]) => (
                  <div className="endpoint" key={path}>
                    <span className={`method method--${method.toLowerCase()}`}>{method}</span>
                    <span className="endpoint-path">{path}</span>
                  </div>
                ))}
              </div>
            </div>

            {recentDocs.length > 0 && (
              <div className="sidebar-section">
                <div className="label" style={{ marginBottom: "12px" }}>recentes</div>
                {recentDocs.map((d) => (
                  <div className="recent-doc" key={d.id}>
                    <span className="recent-doc-name">{d.source_name}</span>
                    <span className="recent-doc-id">{d.id.slice(0, 12)}…</span>
                  </div>
                ))}
              </div>
            )}

            <div className="sidebar-section">
              <div className="label" style={{ marginBottom: "12px" }}>stack</div>
              <div className="stack-pills">
                {["FastAPI", "PostgreSQL", "ChromaDB", "React", "Node.js"].map((s) => (
                  <span key={s} className="stack-pill">{s}</span>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
