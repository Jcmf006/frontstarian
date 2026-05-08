/**
 * API Client — comunica com o proxy Node.js que encaminha para o FastAPI.
 * Base: /api → http://localhost:3001/api → http://localhost:8080
 */

const BASE = "/api";

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, options);
  if (!res.ok) {
    let detail = `HTTP ${res.status}`;
    try {
      const json = await res.json();
      detail = json.detail || json.error || detail;
    } catch {}
    throw new Error(detail);
  }
  return res.json();
}

export async function healthCheck() {
  return request("/health");
}

export async function uploadFile(file, sourceName = null) {
  const form = new FormData();
  form.append("file", file);
  if (sourceName) form.append("source_name", sourceName);

  return request("/documents/upload", {
    method: "POST",
    body: form,
  });
}

export async function ingestText(text, sourceName = "texto-direto") {
  const form = new FormData();
  form.append("text", text);
  form.append("source_name", sourceName);

  return request("/documents/text", {
    method: "POST",
    body: form,
  });
}

export async function searchDocuments(query, nResults = 5) {
  const params = new URLSearchParams({ q: query, n_results: nResults });
  return request(`/documents/search?${params}`);
}
