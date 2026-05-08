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
