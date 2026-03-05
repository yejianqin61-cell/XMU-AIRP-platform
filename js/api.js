const API_BASE = '';

async function apiRequest(path, options = {}) {
  const token = localStorage.getItem('airp_token');
  const username = localStorage.getItem('airp_username');

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  if (username) {
    headers['x-username'] = username;
  }

  const res = await fetch(API_BASE + path, {
    ...options,
    headers
  });

  let data;
  try {
    data = await res.json();
  } catch {
    data = null;
  }

  if (!res.ok) {
    throw new Error((data && data.message) || '请求失败');
  }
  return data;
}

function apiGet(path) {
  return apiRequest(path);
}

function apiPost(path, body) {
  return apiRequest(path, {
    method: 'POST',
    body: JSON.stringify(body)
  });
}

