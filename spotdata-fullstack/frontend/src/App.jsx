import { useState, useEffect, useRef } from "react";
import { healthCheck, uploadFile, ingestText, searchDocuments } from "./api.js";
import "./App.css";

// ── Sidebar ──────────────────────────────────────────────────────────────────

function Sidebar({ chats, activeChat, onSelectChat, onNewChat, user, isOpen, onClose }) {
  return (
    <>
      {isOpen && <div className="sidebar-overlay" onClick={onClose} />}
      <div className={`sidebar ${isOpen ? "sidebar--open" : ""}`}>
        <div className="sidebar-header">
          <div className="brand">
            <div className="brand-dot" />
            <span className="brand-name">SpotData</span>
            <span className="brand-ver">v0.1</span>
          </div>
          <button className="new-chat-btn" onClick={onNewChat}>
            Nova conversa
          </button>
        </div>

        <div className="sidebar-section">Conversas</div>

        {chats.map((chat) => (
          <div
            key={chat.id}
            className={`chat-item ${activeChat === chat.id ? "active" : ""}`}
            onClick={() => { onSelectChat(chat); onClose(); }}
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
    </>
  );
}

// ── Topbar ───────────────────────────────────────────────────────────────────

function Topbar({ title, apiStatus, onToggleSidebar }) {
  return (
    <div className="topbar">
      <div className="topbar-left">
        <button className="hamburger-btn" onClick={onToggleSidebar} aria-label="Menu">☰</button>
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

// ── ListSection ───────────────────────────────────────────────────────────────

function ListSection({ onResult, toast }) {
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setLoading(true);
    try {
      const res = await listDocuments(filter.trim() || null);
      const docs = res.documents ?? res.results ?? [];

      if (!docs.length) {
        onResult("Nenhum documento indexado encontrado.");
        return;
      }

      const rows = docs.map((d, i) => {
        const typeClass =
          d.content_type?.toLowerCase() === "pdf"  ? "b-purple" :
          d.content_type?.toLowerCase() === "foto" ? "b-amber"  : "b-teal";
        const typeLabel =
          { pdf: "PDF", foto: "IMG", texto: "TXT" }[d.content_type?.toLowerCase()] || "?";
        const date = d.created_at
          ? new Date(d.created_at).toLocaleDateString("pt-BR")
          : "—";
        const version = d.version ?? (i + 1);

        return `
          <div class="result-card">
            <div class="rc-header">
              <span class="badge ${typeClass}">${typeLabel}</span>
              <span class="rc-source">${d.source_name || "—"}</span>
              <span class="rc-dist" style="margin-left:auto">v${version}</span>
              <span class="rc-dist">${date}</span>
            </div>
            <div class="rc-excerpt" style="font-size:11px;opacity:0.55">
              ID: ${d.id?.slice(0, 8) ?? "—"}…
            </div>
          </div>`;
      }).join("");

      onResult(
        `<strong>${docs.length} documento${docs.length !== 1 ? "s" : ""}</strong> indexado${docs.length !== 1 ? "s" : ""}:` +
        `<div class="results-list">${rows}</div>`
      );
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
        placeholder="filtrar por fonte (opcional)…"
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && submit()}
        style={{ flex: 1 }}
      />
      <button
        className="send-btn"
        onClick={submit}
        disabled={loading}
        style={{ borderRadius: "8px" }}
      >
        {loading ? <span className="spinner" /> : "📋"}
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
// ── useToast ──────────────────────────────────────────────────────────────────

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

// ── Toast ─────────────────────────────────────────────────────────────────────

function Toast({ toasts, remove }) {
  return (
    <div className="toast-container">
      {toasts.map((t) => (
        <div key={t.id} className={`toast ${t.type}`}>
          <span>{t.message}</span>
          <button onClick={() => remove(t.id)}>×</button>
        </div>
      ))}
    </div>
  );
}

// ── Chat logic ────────────────────────────────────────────────────────────────

const INITIAL_CHATS = [
  { id: 1, title: "Busca relatório Q1" },
  { id: 2, title: "Upload manual produto" },
  { id: 3, title: "Indexar dados de vendas" },
];

const INITIAL_MESSAGE = {
  id: 0,
  role: "ai",
  content: "Olá! Sou o <strong>SpotData</strong>. Posso buscar documentos, indexar textos ou receber uploads de arquivos.<br/><br/>O que você precisa hoje?",
};

const SUGGESTIONS = [
  { label: "🔍 buscar documento", action: "search" },
  { label: "📄 fazer upload",     action: "upload" },
  { label: "✏️ indexar texto",    action: "text"   },
  { label: "📋 listar arquivos",  action: "list"   }, 
];

function useChatLogic(toast) {
  const [messages, setMessages]   = useState([INITIAL_MESSAGE]);
  const [typing, setTyping]       = useState(false);
  const [mode, setMode]           = useState(null); // "search" | "upload" | "text" | null

  const addMsg = (content, role) => {
    setMessages((p) => [...p, { id: Date.now() + Math.random(), role, content }]);
  };

  const aiReply = (content) => {
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      addMsg(content, "ai");
      setMode(null);
    }, 700);
  };

const sendText = (text) => {
    if (!text.trim()) return;
    addMsg(`<p>${text}</p>`, "user");

    if (/upload|arquivo|enviar|anexar/i.test(text)) {
      aiReply("Claro! Use o painel abaixo para selecionar o arquivo:");
      setMode("upload");
    } else if (/index|texto|ingest/i.test(text)) {
      aiReply("Perfeito! Cole o texto abaixo e eu processo pra você:");
      setMode("text");
    } else if (/busca|procur|encontr|search/i.test(text)) {
      aiReply("Tudo certo! Use o campo abaixo para buscar nos documentos indexados:");
      setMode("search");
    } else if (/list|listar|versão|versoes|documentos|todos/i.test(text)) {
      aiReply("Aqui estão os documentos indexados:");
      setMode("list");
    } else {
      aiReply(`Não entendi muito bem. Posso <strong>buscar documentos</strong>, <strong>indexar textos</strong> ou receber <strong>uploads</strong>. O que prefere?`);
    }
  };

  const onSuggestion = (action) => {
    const labels = { search: "quero buscar um documento", upload: "quero fazer upload", text: "quero indexar um texto", list:"listar todos os documentos",};
    sendText(labels[action]);
  };

  const onResult = (content) => {
    addMsg(content, "ai");
    setMode(null);
  };

  return { messages, typing, mode, sendText, onSuggestion, onResult };
}

// ── App root ──────────────────────────────────────────────────────────────────

export default function App() {
  const { toasts, toast, remove } = useToast();
  const [chats, setChats]           = useState(INITIAL_CHATS);
  const [activeChat, setActiveChat] = useState(1);
  const [chatTitle, setChatTitle]   = useState("Busca relatório Q1");
  const [apiStatus, setApiStatus]   = useState("checking");
  const [input, setInput]           = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const inputRef                    = useRef();

  const { messages, typing, mode, sendText, onSuggestion, onResult } = useChatLogic(toast);

  useEffect(() => {
    healthCheck()
      .then(() => setApiStatus("online"))
      .catch(() => setApiStatus("offline"));
  }, []);

  const handleSend = () => {
    if (!input.trim()) return;
    sendText(input);
    setInput("");
    if (inputRef.current) inputRef.current.style.height = "auto";
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleNewChat = () => {
    const id = Date.now();
    const newChat = { id, title: "Nova conversa" };
    setChats((p) => [newChat, ...p]);
    setActiveChat(id);
    setChatTitle("Nova conversa");
  };

  const handleSelectChat = (chat) => {
    setActiveChat(chat.id);
    setChatTitle(chat.title);
  };

  const autoResize = (el) => {
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 120) + "px";
  };

  return (
    <div className="shell">
      <Toast toasts={toasts} remove={remove} />

      <Sidebar
        chats={chats}
        activeChat={activeChat}
        onSelectChat={handleSelectChat}
        onNewChat={handleNewChat}
        user={{ name: "Rafael", initials: "RF" }}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="main">
        <Topbar title={chatTitle} apiStatus={apiStatus} onToggleSidebar={() => setSidebarOpen(p => !p)} />

        <Messages messages={messages} />

        {typing && (
          <div className="msg ai" style={{ padding: "0 24px" }}>
            <div className="msg-avatar ai">SD</div>
            <div className="bubble">
              <div className="typing"><span /><span /><span /></div>
            </div>
          </div>
        )}

        {mode === "search" && (
          <div style={{ padding: "0 24px 12px" }}>
            <SearchSection onResult={onResult} toast={toast} />
          </div>
        )}

        {mode === "upload" && (
          <div style={{ padding: "0 24px 12px" }}>
            <UploadSection onResult={onResult} toast={toast} />
          </div>
        )}

        {mode === "text" && (
          <div style={{ padding: "0 24px 12px" }}>
            <TextSection onResult={onResult} toast={toast} />
          </div>
        )}

        {mode === "list" && (
          <div style={{ padding: "0 24px 12px" }}>
            <ListSection onResult={onResult} toast={toast} />
          </div>
        )}

        {!mode && (
          <div className="suggestions">
            {SUGGESTIONS.map((s) => (
              <button key={s.action} className="suggestion" onClick={() => onSuggestion(s.action)}>
                {s.label}
              </button>
            ))}
          </div>
        )}

        <div className="input-area">
          <div className="input-bar">
            <textarea
              ref={inputRef}
              rows={1}
              placeholder="Pergunte algo ou envie um documento…"
              value={input}
              onChange={(e) => { setInput(e.target.value); autoResize(e.target); }}
              onKeyDown={handleKey}
            />
            <div className="input-actions">
              <button className="attach-btn" aria-label="Anexar" onClick={() => onSuggestion("upload")}>
                📎
              </button>
              <button className="send-btn" onClick={handleSend} disabled={!input.trim()} aria-label="Enviar">
                ↑
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}