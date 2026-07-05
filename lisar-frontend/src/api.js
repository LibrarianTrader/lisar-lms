// ═══════════════════════════════════════════════════════════
//  api.js — Frontend API client for LISAR LMS
//  Drop this file alongside your LISAR-LMS-4.jsx and import it.
//  Usage:
//    import api, { setToken } from "./api";
//    const { token, user, library } = await api.login(email, password);
//    setToken(token);
//    const catalogue = await api.catalogue.list({ q: "achebe" });
// ═══════════════════════════════════════════════════════════

const BASE = import.meta.env?.VITE_API_URL || "http://localhost:4000/api";

let _token = localStorage.getItem("lisar_token") || "";

export function setToken(t) {
  _token = t;
  if (t) localStorage.setItem("lisar_token", t);
  else    localStorage.removeItem("lisar_token");
}
export function getToken() { return _token; }

// ── Core fetch wrapper ──
async function req(method, path, body, opts = {}) {
  const headers = { "Content-Type": "application/json" };
  if (_token) headers["Authorization"] = `Bearer ${_token}`;

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    ...opts,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(data.error || "Request failed"), { status: res.status, data });
  return data;
}

const get    = (path, params) => {
  const qs = params ? "?" + new URLSearchParams(params).toString() : "";
  return req("GET", path + qs);
};
const post   = (path, body) => req("POST", path, body);
const put    = (path, body) => req("PUT",  path, body);
const del    = (path)       => req("DELETE", path);

// ═══════════════════════════════════════════════════════════
//  AUTH
// ═══════════════════════════════════════════════════════════
const auth = {
  login:          (email, password)   => post("/auth/login", { email, password }),
  logout:         ()                  => post("/auth/logout"),
  me:             ()                  => get("/auth/me"),
  changePassword: (currentPassword, newPassword) =>
                  post("/auth/change-password", { currentPassword, newPassword }),
};

// ═══════════════════════════════════════════════════════════
//  CATALOGUE
// ═══════════════════════════════════════════════════════════
const catalogue = {
  list:      (params)  => get("/catalogue", params),
  get:       (id)      => get(`/catalogue/${id}`),
  create:    (data)    => post("/catalogue", data),
  update:    (id,data) => put(`/catalogue/${id}`, data),
  delete:    (id)      => del(`/catalogue/${id}`),
  resolve:   (barcode) => get(`/catalogue/items/resolve/${barcode}`),
  addItem:   (bibId, data) => post(`/catalogue/${bibId}/items`, data),
};

// ═══════════════════════════════════════════════════════════
//  PATRONS
// ═══════════════════════════════════════════════════════════
const patrons = {
  list:      (params)  => get("/patrons", params),
  get:       (id)      => get(`/patrons/${id}`),
  resolve:   (barcode) => get(`/patrons/resolve/${barcode}`),
  create:    (data)    => post("/patrons", data),
  update:    (id,data) => put(`/patrons/${id}`, data),
  delete:    (id)      => del(`/patrons/${id}`),
};

// ═══════════════════════════════════════════════════════════
//  CIRCULATION
// ═══════════════════════════════════════════════════════════
const circulation = {
  loans:         (params) => get("/circulation/loans", params),
  checkout:      (item_barcode, patron_barcode, notes) =>
                 post("/circulation/checkout", { item_barcode, patron_barcode, notes }),
  checkin:       (item_barcode, notes) =>
                 post("/circulation/checkin", { item_barcode, notes }),
  renew:         (item_barcode) =>
                 post("/circulation/renew", { item_barcode }),
  holds:         ()       => get("/circulation/holds"),
  placeHold:     (bib_id, patron_barcode) =>
                 post("/circulation/holds", { bib_id, patron_barcode }),
  cancelHold:    (id)     => del(`/circulation/holds/${id}`),
  fines:         (params) => get("/circulation/fines", params),
  collectFine:   (id, method) => post(`/circulation/fines/${id}/collect`, { method }),
  stats:         ()       => get("/circulation/stats"),
};

// ═══════════════════════════════════════════════════════════
//  ACQUISITIONS
// ═══════════════════════════════════════════════════════════
const acquisitions = {
  orders:       (params) => get("/acquisitions/orders", params),
  createOrder:  (data)   => post("/acquisitions/orders", data),
  updateOrder:  (id,data)=> put(`/acquisitions/orders/${id}`, data),
  vendors:      ()       => get("/acquisitions/vendors"),
  createVendor: (data)   => post("/acquisitions/vendors", data),
};

// ═══════════════════════════════════════════════════════════
//  SERIALS
// ═══════════════════════════════════════════════════════════
const serials = {
  list:        ()        => get("/serials"),
  get:         (id)      => get(`/serials/${id}`),
  create:      (data)    => post("/serials", data),
  update:      (id,data) => put(`/serials/${id}`, data),
  receiveIssue:(id,data) => post(`/serials/${id}/issues`, data),
};

// ═══════════════════════════════════════════════════════════
//  ILL
// ═══════════════════════════════════════════════════════════
const ill = {
  list:    (params) => get("/ill", params),
  create:  (data)   => post("/ill", data),
  update:  (id,data)=> put(`/ill/${id}`, data),
};

// ═══════════════════════════════════════════════════════════
//  REPORTS
// ═══════════════════════════════════════════════════════════
const reports = {
  dashboard:   () => get("/reports/dashboard"),
  circulation: () => get("/reports/circulation"),
  overdue:     () => get("/reports/overdue"),
  collection:  () => get("/reports/collection"),
  patrons:     () => get("/reports/patrons"),
  audit:       (params) => get("/reports/audit", params),
};

// ═══════════════════════════════════════════════════════════
//  SETTINGS
// ═══════════════════════════════════════════════════════════
const settings = {
  getLibrary:        ()        => get("/settings/library"),
  updateLibrary:     (data)    => put("/settings/library", data),
  staff:             ()        => get("/settings/staff"),
  createStaff:       (data)    => post("/settings/staff", data),
  updateStaff:       (id,data) => put(`/settings/staff/${id}`, data),
  loanRules:         ()        => get("/settings/loan-rules"),
  updateLoanRules:   (data)    => put("/settings/loan-rules", data),
  templates:         ()        => get("/settings/notification-templates"),
  updateTemplate:    (type,data)=> put(`/settings/notification-templates/${type}`, data),
  stats:             ()        => get("/settings/stats"),
};

// ═══════════════════════════════════════════════════════════
//  Convenience: login + auto set token
// ═══════════════════════════════════════════════════════════
async function login(email, password) {
  const data = await auth.login(email, password);
  setToken(data.token);
  return data; // { token, user, library }
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
