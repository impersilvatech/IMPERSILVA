/**
 * IMPERSILVA — Configuração Central da API
 * ─────────────────────────────────────────
 * Altere apenas este ficheiro quando mudar o Worker URL.
 * Todos os ficheiros HTML importam este script.
 */

// URL base do Cloudflare Worker
// Ex: https://impersilva-api.SEU-SUBDOMINIO.workers.dev
const API = 'https://impersilva-api.SEU-SUBDOMINIO.workers.dev';

/**
 * Função auxiliar para chamadas à API
 * Uso: await api.get('/portfolio')
 *      await api.post('/contacto', { nome, email, mensagem })
 */
const api = {
  async get(path) {
    const r = await fetch(API + path);
    if (!r.ok) throw new Error(r.status);
    return r.json();
  },
  async post(path, data) {
    const r = await fetch(API + path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const json = await r.json();
    if (!r.ok) throw Object.assign(new Error(json.erro || r.status), { status: r.status, data: json });
    return json;
  }
};
