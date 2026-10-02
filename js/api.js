const LS = k => { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } };
// POST wajib text/plain agar tidak memicu CORS preflight di GAS
const api = async body => (await fetch(GAS_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(body) })).json();
