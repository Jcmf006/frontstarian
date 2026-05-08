/**
 * SpotData - Node.js Proxy Server
 * Atua como proxy entre o frontend React e a API FastAPI (Python).
 * Resolve CORS e centraliza as chamadas HTTP.
 */

const http = require("http");
const https = require("https");
const url = require("url");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 3001;
const API_BASE = process.env.SPOTDATA_API || "http://localhost:8080";

function proxyRequest(req, res, targetPath) {
  const parsedTarget = url.parse(API_BASE);
  const isHttps = parsedTarget.protocol === "https:";
  const transport = isHttps ? https : http;

  const options = {
    hostname: parsedTarget.hostname,
    port: parsedTarget.port || (isHttps ? 443 : 80),
    path: targetPath,
    method: req.method,
    headers: {
      ...req.headers,
      host: parsedTarget.host,
    },
  };

  // Remove headers que causam problemas no proxy
  delete options.headers["content-length"];

  const proxy = transport.request(options, (proxyRes) => {
    res.writeHead(proxyRes.statusCode, {
      ...proxyRes.headers,
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    });
    proxyRes.pipe(res);
  });

  proxy.on("error", (err) => {
    console.error("[Proxy Error]", err.message);
    res.writeHead(502, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        error: "API indisponível",
        detail:
          "Verifique se o servidor FastAPI está rodando em " + API_BASE,
      })
    );
  });

  req.pipe(proxy);
}

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);

  // CORS preflight
  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    });
    res.end();
    return;
  }

  // Proxy para a API FastAPI
  if (parsedUrl.pathname.startsWith("/api/")) {
    const targetPath = parsedUrl.pathname.replace("/api", "") + (parsedUrl.search || "");
    console.log(`[Proxy] ${req.method} ${req.url} → ${API_BASE}${targetPath}`);
    proxyRequest(req, res, targetPath);
    return;
  }

  // Health check do proxy
  if (parsedUrl.pathname === "/proxy-health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "ok", proxy_target: API_BASE }));
    return;
  }

  // 404 para rotas desconhecidas
  res.writeHead(404, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ error: "Rota não encontrada no proxy" }));
});

server.listen(PORT, () => {
  console.log(`\n🟢 SpotData Proxy rodando em http://localhost:${PORT}`);
  console.log(`   ↪  Encaminhando /api/* → ${API_BASE}`);
  console.log(`\n   Inicie o frontend React separadamente com:`);
  console.log(`   cd frontend && npm install && npm run dev\n`);
});
