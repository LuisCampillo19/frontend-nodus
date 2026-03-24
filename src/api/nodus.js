const API_BASE = '/api';

let token = localStorage.getItem('nodus_token');

export function setToken(t) {
  token = t;
  localStorage.setItem('nodus_token', t);
}

export function getToken() {
  return token;
}

export function clearToken() {
  token = null;
  localStorage.removeItem('nodus_token');
}

export function isAuthenticated() {
  return !!token;
}

async function request(method, path, body = null) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const opts = { method, headers };
  if (body) opts.body = JSON.stringify(body);

  const res = await fetch(`${API_BASE}${path}`, opts);
  const data = await res.json();

  if (!res.ok) {
    throw { status: res.status, detail: data.detail || 'Error desconocido' };
  }
  return data;
}

export const api = {
  // Auth
  login: (pin) => request('POST', '/auth/login', { pin }),
  changePin: (pin_actual, pin_nuevo) => request('POST', '/auth/change-pin', { pin_actual, pin_nuevo }),

  // Clientes
  getClientes: (q = '') => request('GET', `/clientes/?q=${q}`),
  getCliente: (id) => request('GET', `/clientes/${id}`),
  createCliente: (data) => request('POST', '/clientes/', data),
  updateCliente: (id, data) => request('PUT', `/clientes/${id}`, data),
  deleteCliente: (id) => request('DELETE', `/clientes/${id}`),

  // Cuentas
  getCuentas: () => request('GET', '/cuentas/'),
  getResumenCuentas: () => request('GET', '/cuentas/resumen'),
  createCuenta: (data) => request('POST', '/cuentas/', data),

  // Transacciones
  getTransacciones: (params = '') => request('GET', `/transacciones/?${params}`),
  getTransaccion: (id) => request('GET', `/transacciones/${id}`),
  createTransaccion: (data) => request('POST', '/transacciones/', data),
  cambiarEstado: (id, estado) => request('PUT', `/transacciones/${id}/estado?estado=${estado}`),
  recalcularPlan: (id, params) => request('PUT', `/transacciones/${id}/recalcular?${new URLSearchParams(params)}`),

  // Pagos
  getPagos: (txId = null) => request('GET', `/pagos/${txId ? `?transaccion_id=${txId}` : ''}`),
  pagarCuota: (data) => request('POST', '/pagos/cuota', data),
  abonoCapital: (data) => request('POST', '/pagos/abono-capital', data),

  // Finanzas
  getFinanzas: (params = '') => request('GET', `/finanzas/?${params}`),
  createFinanza: (data) => request('POST', '/finanzas/', data),
  deleteFinanza: (id) => request('DELETE', `/finanzas/${id}`),

  // Dashboard
  getResumen: () => request('GET', '/dashboard/resumen'),
  getCobrosHoy: () => request('GET', '/dashboard/cobros-hoy'),
};
