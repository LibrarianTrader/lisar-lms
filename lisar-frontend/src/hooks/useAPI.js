import { useState, useEffect, useCallback } from "react";
import api from "../api";

function useFetch(fn, deps = []) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try   { setData(await fn()); }
    catch (e) { setError(e.message); }
    finally   { setLoading(false); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => { load(); }, [load]);
  return { data, loading, error, reload: load };
}

export function useAuth(skipAutoLogin = false) {
  const [user,    setUser]    = useState(null);
  const [library, setLibrary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (skipAutoLogin) { setLoading(false); return; }
    
    api.auth.me()
      .then(d => { setUser(d.user); setLibrary(d.library); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [skipAutoLogin]);

  const login = async (email, password) => {
    const d = await api.login(email, password);
    setUser(d.user); setLibrary(d.library);
    return d;
  };

  const logout = () => {
    api.logout();
    setUser(null); setLibrary(null);
  };

  return { user, library, loading, login, logout };
}

export function useDashboard() {
  return useFetch(() => api.reports.dashboard());
}

export function useCatalogue(params = {}) {
  return useFetch(() => api.catalogue.list(params), [JSON.stringify(params)]);
}

export function useBib(id) {
  return useFetch(() => api.catalogue.get(id), [id]);
}

export function usePatrons(params = {}) {
  return useFetch(() => api.patrons.list(params), [JSON.stringify(params)]);
}

export function useLoans(params = {}) {
  return useFetch(() => api.circulation.loans(params), [JSON.stringify(params)]);
}

export function useCircStats() {
  return useFetch(() => api.circulation.stats());
}

export function useHolds() {
  return useFetch(() => api.circulation.holds());
}

export function useFines(params = {}) {
  return useFetch(() => api.circulation.fines(params), [JSON.stringify(params)]);
}

export const circActions = {
  checkout:    (itemBarcode, patronBarcode, notes) =>
               api.circulation.checkout(itemBarcode, patronBarcode, notes),
  checkin:     (itemBarcode) =>
               api.circulation.checkin(itemBarcode),
  renew:       (itemBarcode) =>
               api.circulation.renew(itemBarcode),
  placeHold:   (bibId, patronBarcode) =>
               api.circulation.placeHold(bibId, patronBarcode),
  cancelHold:  (id) =>
               api.circulation.cancelHold(id),
  collectFine: (id, method) =>
               api.circulation.collectFine(id, method),
};

export function useOrders(params = {}) {
  return useFetch(() => api.acquisitions.orders(params), [JSON.stringify(params)]);
}

export function useSerials() {
  return useFetch(() => api.serials.list());
}

export function useILL(params = {}) {
  return useFetch(() => api.ill.list(params), [JSON.stringify(params)]);
}

export function useReports() {
  const [data,    setData]    = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([
      api.reports.dashboard(),
      api.reports.circulation(),
      api.reports.overdue(),
      api.reports.collection(),
    ]).then(([dash, circ, overdue, coll]) => {
      setData({
        dashboard:   dash.status   === "fulfilled" ? dash.value    : null,
        circulation: circ.status   === "fulfilled" ? circ.value    : null,
        overdue:     overdue.status === "fulfilled" ? overdue.value : null,
        collection:  coll.status   === "fulfilled" ? coll.value    : null,
      });
    }).finally(() => setLoading(false));
  }, []);

  return { data, loading };
}

export function useSettings() {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([
      api.settings.getLibrary(),
      api.settings.staff(),
      api.settings.loanRules(),
    ]).then(([lib, staff, rules]) => {
      setData({
        library:   lib.status   === "fulfilled" ? lib.value   : null,
        staff:     staff.status === "fulfilled" ? staff.value : [],
        loanRules: rules.status === "fulfilled" ? rules.value : [],
      });
    }).finally(() => setLoading(false));
  }, []);

  return { data, loading };
}
