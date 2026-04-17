const API = 'https://impersilva-ao.3miliosilva.workers.dev';

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
