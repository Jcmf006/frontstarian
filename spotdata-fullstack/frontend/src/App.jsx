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