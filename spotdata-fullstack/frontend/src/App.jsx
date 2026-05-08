import { useState, useEffect, useRef } from "react";
import { healthCheck, uploadFile, ingestText, searchDocuments } from "./api.js";
import "./App.css";

// ── Sidebar ──────────────────────────────────────────────────────────────────

function Sidebar({ chats, activeChat, onSelectChat, onNewChat, user }) {
  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <div className="brand">
          <div className="brand-dot" />
          <span className="brand-name">SpotData</span>
          <span className="brand-ver">v0.1</span>
        </div>
        <button className="new-chat-btn" onClick={onNewChat}>
          <span>+</span> nova conversa
        </button>
      </div>

      <div className="sidebar-section">Conversas</div>

      {chats.map((chat) => (
        <div
          key={chat.id}
          className={`chat-item ${activeChat === chat.id ? "active" : ""}`}
          onClick={() => onSelectChat(chat)}
        >
          {chat.title}
        </div>
      ))}

      <div className="sidebar-footer">
        <div className="user-row">
          <div className="avatar">{user.initials}</div>
          <span className="user-name">{user.name}</span>
          <div className="status-online" />
        </div>
      </div>
    </div>
  );
}

// ── Topbar ───────────────────────────────────────────────────────────────────

function Topbar({ title, apiStatus }) {
  return (
    <div className="topbar">
      <div className="topbar-left">
        <span className="topbar-title">{title}</span>
        <span className="model-badge">chromadb</span>
        <span
          className="model-badge"
          style={{
            background: apiStatus === "online"
              ? "rgba(93, 202, 165, 0.12)"
              : "rgba(224, 75, 74, 0.12)",
            color: apiStatus === "online" ? "#5DCAA5" : "#F09595",
            border: apiStatus === "online"
              ? "0.5px solid rgba(93, 202, 165, 0.25)"
              : "0.5px solid rgba(224, 75, 74, 0.25)",
          }}
        >
          API {apiStatus}
        </span>
      </div>
      <div className="topbar-actions">
        <button className="icon-btn" aria-label="Compartilhar">⬆</button>
        <button className="icon-btn" aria-label="Mais opções">•••</button>
      </div>
    </div>
  );
}

function Messages({ messages }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="messages">
      {messages.map((msg) => (
        <div key={msg.id} className={`msg ${msg.role}`}>
          <div className={`msg-avatar ${msg.role === "user" ? "uav" : "ai"}`}>
            {msg.role === "user" ? "RF" : "SD"}
          </div>
          <div
            className="bubble"
            dangerouslySetInnerHTML={{ __html: msg.content }}
          />
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  );
}

// ── Typing indicator ─────────────────────────────────────────────────────────

function TypingIndicator() {
  return (
    <div className="msg ai">
      <div className="msg-avatar ai">SD</div>
      <div className="bubble">
        <div className="typing">
          <span /><span /><span />
        </div>
      </div>
    </div>
  );
}

// ── UploadSection ─────────────────────────────────────────────────────────

function UploadSection({ onResult, toast }) {
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
      onResult(`Arquivo <strong>${file.name}</strong> indexado com sucesso!\n\nID: <strong>${res.id.slice(0, 8)}…</strong> · fonte registrada. Quer fazer uma busca agora?`);
      setFile(null);
      setSourceName("");
    } catch (e) {
      toast(e.message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
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
            <span>📄</span>
            <span className="dropzone-filename">{file.name}</span>
            <span className="dropzone-size">{(file.size / 1024).toFixed(1)} KB</span>
          </div>
        ) : (
          <div className="dropzone-placeholder">
            <span className="dropzone-hint">arraste ou clique para selecionar</span>
            <span className="dropzone-types">PDF · PNG · JPG · TXT</span>
          </div>
        )}
      </div>

      <input
        className="input"
        placeholder="nome da fonte (ex: relatorio-q1.pdf)"
        value={sourceName}
        onChange={(e) => setSourceName(e.target.value)}
      />

      <button className="send-btn" style={{ width: "100%", borderRadius: "8px", padding: "10px", fontSize: "13px" }} onClick={submit} disabled={loading || !file}>
        {loading ? <span className="spinner" /> : null}
        {loading ? "processando…" : "enviar documento"}
      </button>
    </div>
  );
}

// ── TextSection ───────────────────────────────────────────────────────────────

function TextSection({ onResult, toast }) {
  const [text, setText] = useState("");
  const [sourceName, setSourceName] = useState("texto-direto");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!text.trim()) { toast("Texto vazio", "error"); return; }
    setLoading(true);
    try {
      const res = await ingestText(text.trim(), sourceName || "texto-direto");
      onResult('Texto indexado com sucesso!\n\nID: <strong>${res.id.slice(0, 8)}…</strong> · fonte: <strong>${sourceName}</strong>. Quer fazer uma busca agora?');
      setText("");
    } catch (e) {
      toast(e.message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
      <textarea
        className="input"
        placeholder="Cole ou digite o texto a ser indexado…"
        rows={5}
        value={text}
        onChange={(e) => setText(e.target.value)}
        style={{ resize: "vertical", lineHeight: "1.6" }}
      />
      <input
        className="input"
        placeholder="nome da fonte"
        value={sourceName}
        onChange={(e) => setSourceName(e.target.value)}
      />
      <button className="send-btn" style={{ width: "100%", borderRadius: "8px", padding: "10px", fontSize: "13px" }} onClick={submit} disabled={loading || !text.trim()}>
        {loading ? "indexando…" : "indexar texto"}
      </button>
    </div>
  );
}

// ── SearchSection ───────────────────────────────────────────────────────────────

function SearchSection({ onResult, toast }) {
const [query, setQuery] = useState("");
const [nResults, setNResults] = useState(5);
const [loading, setLoading] = useState(false);

const submit = async () => {
if (!query.trim()) { toast("Query vazia", "error"); return; }
setLoading(true);
try {
const res = await searchDocuments(query.trim(), nResults);
if (!res.results.length) {
onResult(`Nenhum resultado encontrado para <strong>"${query}"</strong>. Tente outros termos.`);
return;
}
const cards = res.results.map((r, i) => {
const typeClass = r.content_type?.toLowerCase() === "pdf" ? "b-purple" : r.content_type?.toLowerCase() === "foto" ? "b-amber" : "b-teal";
const typeLabel = { pdf: "PDF", foto: "IMG", texto: "TXT" }[r.content_type?.toLowerCase()] || "?";
return `<div class="result-card">
<div class="rc-header">
<span class="badge ${typeClass}">${typeLabel}</span>
<span class="rc-source">${r.source_name || "—"}</span>
<span class="rc-dist">dist ${r.distance?.toFixed(4)}</span>
</div>
<div class="rc-excerpt">${r.document}</div>
</div>`;
}).join("");
onResult(`Encontrei <strong>${res.results.length} resultado${res.results.length !== 1 ? "s" : ""}</strong> para <strong>"${query}"</strong>:\n<div class="results-list">${cards}</div>`);
setQuery("");
} catch (e) {
toast(e.message, "error");
} finally {
setLoading(false);
}
};

return (
<div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
<input
className="input"
placeholder="o que você quer encontrar?"
value={query}
onChange={(e) => setQuery(e.target.value)}
onKeyDown={(e) => e.key === "Enter" && submit()}
style={{ flex: 1 }}
/>
<select
className="input"
value={nResults}
onChange={(e) => setNResults(Number(e.target.value))}
style={{ width: "64px" }}
>
{[3, 5, 10].map((n) => <option key={n}>{n}</option>)}
</select>
<button className="send-btn" onClick={submit} disabled={loading} style={{ borderRadius: "8px" }}>
{loading ? <span className="spinner" /> : "🔍"}
</button>
</div>
);
}
