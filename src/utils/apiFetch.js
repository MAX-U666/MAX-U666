/**
 * 全局API辅助 - 自动注入用户权限头
 * 所有 /api/easyboss/* 请求使用此方法
 */

function getAuthHeaders() {
  const headers = {};
  try {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (userStr) {
      const user = JSON.parse(userStr);
      headers['X-User-Id'] = String(user.id);
      headers['X-User-Role'] = user.role || '';
    }
  } catch (e) {}
  return headers;
}

export async function apiFetch(path, options = {}) {
  const authHeaders = getAuthHeaders();
  const res = await fetch(path, {
    ...options,
    headers: {
      ...authHeaders,
      ...(options.headers || {}),
    },
  });
  return res.json();
}

export async function apiGet(path, params = {}) {
  const query = new URLSearchParams(params).toString();
  const url = query ? `${path}?${query}` : path;
  return apiFetch(url);
}

export async function apiPost(path, body = {}) {
  return apiFetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}
