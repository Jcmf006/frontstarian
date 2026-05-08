# SpotData — Fullstack (React + Node.js + FastAPI)

Interface web completa para a API SpotData de ingestão e busca semântica de documentos.

```
spotdata-fullstack/
├── src/                    # Backend Python (FastAPI) — ORIGINAL, sem alterações
├── alembic/                # Migrations do banco
├── main.py                 # Entry point FastAPI
├── requirements.txt
├── docker-compose.yml
│
├── server.js               # Proxy Node.js (resolve CORS, encaminha /api/* → FastAPI)
├── package.json            # Deps do proxy Node.js
│
└── frontend/               # App React (Vite)
    ├── src/
    │   ├── App.jsx         # Componente principal
    │   ├── App.css         # Estilos
    │   ├── api.js          # Client HTTP (chama /api/*)
    │   ├── main.jsx
    │   └── index.css
    ├── index.html
    ├── vite.config.js      # Proxy /api → localhost:3001
    └── package.json
```

---

## Pré-requisitos

- **Docker** e **Docker Compose**
- **Python 3.12+**
- **Node.js 18+**

---

## Como rodar (3 terminais)

### Terminal 1 — Infraestrutura (Postgres + ChromaDB)

```bash
docker compose up -d
```

### Terminal 2 — API FastAPI (Python)

```bash
# Instalar dependências Python
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt

# Criar arquivo .env
cp .env.example .env

# Aplicar migrations
alembic upgrade head

# Subir a API
python main.py
# → http://localhost:8080
# → http://localhost:8080/docs  (Swagger UI)
```

### Terminal 3 — Frontend React + Proxy Node.js

```bash
# Instalar deps do proxy
npm install

# Instalar deps do frontend
cd frontend && npm install && cd ..

# Iniciar proxy Node.js
node server.js
# → http://localhost:3001

# Em outro terminal: iniciar frontend React
cd frontend && npm run dev
# → http://localhost:5173
```

Abra **http://localhost:5173** no navegador.

---

## Arquitetura de comunicação

```
Browser (React)
    ↓  /api/*
Vite dev server (proxy)
    ↓  /api/*
Node.js Proxy (porta 3001)     ← resolve CORS
    ↓  /*  (remove /api prefix)
FastAPI Python (porta 8080)
    ↓
PostgreSQL + ChromaDB
```

---

## Funcionalidades da interface

| Aba       | Endpoint consumido         | Descrição                          |
|-----------|----------------------------|------------------------------------|
| **Buscar**| `GET /documents/search`    | Busca semântica com score/distância|
| **Upload**| `POST /documents/upload`   | Upload de PDF, PNG, JPG, TXT       |
| **Texto** | `POST /documents/text`     | Ingestão de texto puro             |

- Indicador de status da API (online/offline)
- Drag and drop de arquivos
- Lista de documentos recentes
- Resultados com score de distância semântica

---

## Variáveis de ambiente

### FastAPI (`.env` na raiz)

```env
POSTGRES_USER=spotdata
POSTGRES_PASSWORD=spotdata123
POSTGRES_DB=spotdata
POSTGRES_HOST=localhost
POSTGRES_PORT=5432

CHROMA_HOST=localhost
CHROMA_PORT=8000
```

### Node.js Proxy (opcional)

```bash
PORT=3001                           # porta do proxy (padrão: 3001)
SPOTDATA_API=http://localhost:8080  # endereço da API FastAPI
```
