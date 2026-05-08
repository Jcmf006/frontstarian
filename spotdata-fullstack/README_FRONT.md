# SpotData Frontend

> **Interface moderna para busca semântica e indexação de documentos** — Uma aplicação React/Vite que fornece uma experiência fluida para upload de documentos, ingestão de texto e busca semântica alimentada por IA.

![React](https://img.shields.io/badge/React-18.3.1-61DAFB?logo=react&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-5.4.2-646CFF?logo=vite&logoColor=white)
![Fetch API](https://img.shields.io/badge/Fetch%20API-Native-orange)
![Status](https://img.shields.io/badge/Status-Production%20Ready-C8F560?labelColor=0a0a0a)

---

## 📖 Objetivo do Frontend

**Propósito**: Interface intuitiva para gerenciamento de bases de conhecimento com busca semântica em tempo real.

**Problema Resolvido**: Simplifica upload de documentos, indexação automática e busca inteligente com resultados ordenados por relevância.

**Experiência do Usuário**:

1. Upload via drag & drop (PDF, imagens, texto)
2. Ingestão direta de texto sem arquivo
3. Busca semântica com resultados em cards
4. Feedback visual com notificações toast

---

## 🛠️ Tecnologias Utilizadas

| Tecnologia       | Versão | Função                                    |
| ---------------- | ------ | ----------------------------------------- |
| **React**        | 18.3.1 | Framework UI com hooks (useState, useRef) |
| **Vite**         | 5.4.2  | Build tool com HMR rápido (~200ms)        |
| **Fetch API**    | Nativa | HTTP client wrapper em `api.js`           |
| **CSS**          | Puro   | Design system com CSS variables           |
| **Google Fonts** | -      | Syne + DM Mono                            |

**Por que Fetch em vez de Axios?** Menos dependências, FormData nativo, bundle size reduzido.

---

## 🏗️ Arquitetura

### Componentes Principais

```
App.jsx (~400+ linhas)
├── Header (navegação + status)
├── UploadSection (drag & drop)
├── TextSection (ingestão direta)
├── SearchSection (busca + resultados)
├── Toast (notificações)
└── Sidebar (info + endpoints)
```

### Estrutura de Pastas

```
frontend/
├── index.html
├── package.json
├── vite.config.js
└── src/
    ├── main.jsx (React StrictMode)
    ├── App.jsx (todos os componentes)
    ├── api.js (4 funções HTTP)
    ├── App.css (~550 linhas)
    └── index.css (~80 linhas)
```

### Arquitetura de Comunicação

```
React (5173) → Vite Proxy (/api) → Node (3001) → FastAPI (8080)
```

**API Endpoints** (`api.js`):

- `healthCheck()` - GET /api/health
- `uploadFile(file, name)` - POST /api/documents/upload
- `ingestText(text, name)` - POST /api/documents/text
- `searchDocuments(query, n)` - GET /api/documents/search

### Gerenciamento de Estado

**Padrão**: Local component state (hooks), sem Redux/Context API necessário.

```javascript
const [file, setFile] = useState(null);
const [loading, setLoading] = useState(false);
const [results, setResults] = useState(null);
```

---

## 🎨 Interface e Design

### Design System

| Elemento         | Valor                            |
| ---------------- | -------------------------------- |
| **Cor Primária** | Verde: #c8f560                   |
| **Fundo**        | Cinza escuro: #0a0a0a            |
| **Tipografia**   | Syne (headers) + DM Mono (corpo) |
| **Radius**       | 6px (cards), 12px (sections)     |
| **Tema**         | Dark mode nativo                 |

### Layout

- **Desktop**: 2 colunas (main + sidebar 260px)
- **Tablet/Mobile**: 1 coluna (sidebar abaixo)
- **Max-width**: 1100px

### Componentes de UI

- **Dropzone**: Drag & drop com hover states
- **Result Cards**: Scoring visual, badges por tipo
- **Toast**: Auto-dismiss (4s), tipos (success/error/info)
- **Spinner**: Animação suave durante loading

---

## 🔌 Comunicação com Backend

### Fluxo de Requisições

**Upload**:

```javascript
uploadFile(file, sourceName)
→ POST /api/documents/upload
→ Response: { id, source_name, content_type, ... }
→ Toast: "✓ Documento salvo"
```

**Busca**:

```javascript
searchDocuments(query, nResults)
→ GET /api/documents/search?q=...&n_results=5
→ Response: { query, results: [...] }
→ Render cards com fadeIn
```

### Tratamento de Erros

```javascript
if (!res.ok) {
  const detail = json.detail || json.error || `HTTP ${res.status}`;
  throw new Error(detail); // → toast("erro", "error")
}
```

---

## 🚀 Como Executar

### Instalação

```bash
cd frontend
npm install
```

### Desenvolvimento

```bash
npm run dev
```

Abre em `http://localhost:5173` com HMR ativo.

### Build Produção

```bash
npm run build
```

Gera `dist/` minificado (~15-20KB gzipped).

### Preview

```bash
npm run preview
```

Testa build em `http://localhost:4173`.

### Portas

| Serviço            | Porta |
| ------------------ | ----- |
| Frontend (Dev)     | 5173  |
| Frontend (Preview) | 4173  |
| Node Proxy         | 3001  |
| FastAPI Backend    | 8080  |

---

## 🔮 Melhorias Futuras

### UI/UX

- [ ] Dark mode toggle (salvar em localStorage)
- [ ] Click em resultado expande conteúdo
- [ ] Filtros: tipo, data, fonte, score
- [ ] Histórico de buscas (últimas 10)
- [ ] Atalhos de teclado (Ctrl+K, Ctrl+U, Ctrl+/)

### Performance

- [ ] Lazy loading de resultados (scroll infinito)
- [ ] Caching de queries
- [ ] Compressão de imagem antes upload
- [ ] Code splitting de componentes

### Componentização

- [ ] Extrair componentes de `App.jsx`
- [ ] Criar pasta `components/`, `hooks/`, `services/`
- [ ] Adicionar TypeScript

### Acessibilidade

- [ ] ARIA labels em botões e inputs
- [ ] Validar contrast ratio WCAG 2.1 AA
- [ ] Keyboard navigation completa
- [ ] Screen reader friendly

### Robustez

- [ ] Retry com backoff exponencial
- [ ] Rate limiting no frontend
- [ ] Error boundary component
- [ ] Testes unitários (Vitest + React Testing Library)
- [ ] ESLint + Prettier

### Experiência

- [ ] Onboarding interativo
- [ ] Auto-complete de queries
- [ ] Notificações real-time (WebSocket)
- [ ] Dashboard com estatísticas

---

## 📊 Resumo

| Métrica              | Valor                    |
| -------------------- | ------------------------ |
| **Linhas de Código** | ~800                     |
| **Bundle Size**      | ~15-20KB (gzipped)       |
| **Componentes**      | 6 principais             |
| **Tempo Dev Init**   | ~200ms                   |
| **HMR**              | <100ms                   |
| **Responsividade**   | Desktop/Tablet/Mobile ✅ |

---

## 📞 Links

- [Backend](../README-FULLSTACK.md)
- [GitHub](https://github.com/seu-usuario/spotdata-fullstack)

---

**v1.0.0** | Maio 2026 | Production Ready ✅
