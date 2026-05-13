import { useState, useEffect, useRef } from "react";
import { healthCheck } from "./api/index.js";
import Sidebar from "./components/Sidebar.jsx";
import Topbar from "./components/Topbar.jsx";
import Messages from "./components/Messages.jsx";
import TypingIndicator from "./components/TypingIndicator.jsx";
import UploadSection from "./components/UploadSection.jsx";
import TextSection from "./components/TextSection.jsx";
import SearchSection from "./components/SearchSection.jsx";
import FilesScreen from "./components/FilesScreen.jsx";
import Toast, { useToast } from "./components/Toast.jsx";
import useChatLogic from "./hooks/useChatLogic.js";
import "./App.css";

const INITIAL_CHATS = [];

export default function App() {
  const { toasts, toast, remove }     = useToast();
  const [chats, setChats]             = useState(INITIAL_CHATS);
  const [activeChat, setActiveChat]   = useState(null);
  const [chatTitle, setChatTitle]     = useState("Nova conversa");
  const [apiStatus, setApiStatus]     = useState("checking");
  const [input, setInput]             = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [filesOpen, setFilesOpen]     = useState(false);
  const inputRef                      = useRef();

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

  const handleFilesAction = (action) => {
    setFilesOpen(false);
    onSuggestion(action);
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
        filesOpen={filesOpen}
        onToggleFiles={() => setFilesOpen((p) => !p)}
      />

      <div className="main">
        <Topbar
          title={chatTitle}
          apiStatus={apiStatus}
          onToggleSidebar={() => setSidebarOpen((p) => !p)}
        />

        <Messages messages={messages} />

        {typing && <TypingIndicator />}

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

        {filesOpen && (
          <div className="files-modal-backdrop" onClick={() => setFilesOpen(false)}>
            <div className="files-modal" onClick={(e) => e.stopPropagation()}>
              <div className="files-modal-header">
                <span className="files-modal-title">Arquivos indexados</span>
                <button className="icon-btn" onClick={() => setFilesOpen(false)} aria-label="Fechar">×</button>
              </div>
              <FilesScreen onSuggestion={handleFilesAction} toast={toast} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
