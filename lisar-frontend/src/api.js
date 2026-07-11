// ═══════════════════════════════════════════════════════════
//  api.js — Frontend API client for LISAR LMS
// ═══════════════════════════════════════════════════════════

const BASE = (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_URL)
  ? import.meta.env.VITE_API_URL
  : "http://localhost:4000/api";

// Safe localStorage access
function getStorage(key) {
  try { return localStorage.getItem(key) || ""; } catch { return ""; }
}
function setStorage(key, val) {
  try { if (val) localStorage.setItem(key, val); else localStorage.removeItem(key); } catch {}
}

let _token = getStorage("lisar_token");

export function setToken(t) { _token = t; setStorage("lisar_token", t); }
export function getToken() { return _token; }

async function req(method, path, body) {
  try {
    const headers = { "Content-Type": "application/json" };
    if (_token) headers["Authorization"] = `Bearer ${_token}`;
    const res = await fetch(`${BASE}${path}`, {
      method, headers,
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw Object.assign(new Error(data.error || "Request failed"), { status: res.status, data });
    return data;
  } catch (e) {
    throw e;
  }
}

const get  = (path, params) => {
  const qs = params ? "?" + new URLSearchParams(params).toString() : "";
  return req("GET", path + qs);
};
const post = (path, body) => req("POST", path, body);
const put  = (path, body) => req("PUT",  path, body);
const del  = (path)       => req("DELETE", path);

const auth = {
  login:          (email, password) => post("/auth/login", { email, password }),
  logout:         ()                => post("/auth/logout"),
  me:             ()                => get("/auth/me"),
  changePassword: (currentPassword, newPassword) => post("/auth/change-password", { currentPassword, newPassword }),
  register:       (data) => post("/auth/register", data),
};

const catalogue = {
  list:    (params)   => get("/catalogue", params),
  get:     (id)       => get(`/catalogue/${id}`),
  create:  (data)     => post("/catalogue", data),
  update:  (id, data) => put(`/catalogue/${id}`, data),
  delete:  (id)       => del(`/catalogue/${id}`),
  resolve: (barcode)  => get(`/catalogue/items/resolve/${barcode}`),
  addItem: (bibId, data) => post(`/catalogue/${bibId}/items`, data),
};

const patrons = {
  list:    (params)   => get("/patrons", params),
  get:     (id)       => get(`/patrons/${id}`),
  resolve: (barcode)  => get(`/patrons/resolve/${barcode}`),
  create:  (data)     => post("/patrons", data),
  update:  (id, data) => put(`/patrons/${id}`, data),
  delete:  (id)       => del(`/patrons/${id}`),
};

const circulation = {
  loans:       (params)  => get("/circulation/loans", params),
  checkout:    (item_barcode, patron_barcode, notes) => post("/circulation/checkout", { item_barcode, patron_barcode, notes }),
  checkin:     (item_barcode, notes) => post("/circulation/checkin", { item_barcode, notes }),
  renew:       (item_barcode) => post("/circulation/renew", { item_barcode }),
  holds:       ()        => get("/circulation/holds"),
  placeHold:   (bib_id, patron_barcode) => post("/circulation/holds", { bib_id, patron_barcode }),
  cancelHold:  (id)      => del(`/circulation/holds/${id}`),
  fines:       (params)  => get("/circulation/fines", params),
  collectFine: (id, method) => post(`/circulation/fines/${id}/collect`, { method }),
  stats:       ()        => get("/circulation/stats"),
};

const acquisitions = {
  orders:       (params) => get("/acquisitions/orders", params),
  createOrder:  (data)   => post("/acquisitions/orders", data),
  updateOrder:  (id, data) => put(`/acquisitions/orders/${id}`, data),
  vendors:      ()       => get("/acquisitions/vendors"),
  createVendor: (data)   => post("/acquisitions/vendors", data),
};

const serials = {
  list:         ()           => get("/serials"),
  get:          (id)         => get(`/serials/${id}`),
  create:       (data)       => post("/serials", data),
  update:       (id, data)   => put(`/serials/${id}`, data),
  receiveIssue: (id, data)   => post(`/serials/${id}/issues`, data),
};

const ill = {
  list:   (params)   => get("/ill", params),
  create: (data)     => post("/ill", data),
  update: (id, data) => put(`/ill/${id}`, data),
};

const reports = {
  dashboard:   () => get("/reports/dashboard"),
  circulation: () => get("/reports/circulation"),
  overdue:     () => get("/reports/overdue"),
  collection:  () => get("/reports/collection"),
  patrons:     () => get("/reports/patrons"),
  audit:       (params) => get("/reports/audit", params),
};

const settings = {
  getLibrary:       ()           => get("/settings/library"),
  updateLibrary:    (data)       => put("/settings/library", data),
  staff:            ()           => get("/settings/staff"),
  createStaff:      (data)       => post("/settings/staff", data),
  updateStaff:      (id, data)   => put(`/settings/staff/${id}`, data),
  loanRules:        ()           => get("/settings/loan-rules"),
  updateLoanRules:  (data)       => put("/settings/loan-rules", data),
  templates:        ()           => get("/settings/notification-templates"),
  updateTemplate:   (type, data) => put(`/settings/notification-templates/${type}`, data),
  stats:            ()           => get("/settings/stats"),
};

async function login(email, password) {
  const data = await auth.login(email, password);
  setToken(data.token);
  return data;
}

function logout() {
  auth.logout().catch(() => {});
  setToken("");
}

const api = {
  login, logout,
  auth, catalogue, patrons, circulation,
  acquisitions, serials, ill, reports, settings,
};

export default api;
