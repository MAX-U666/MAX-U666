const API_BASE = '/api';

// 用户相关
export const fetchUsers = () => 
  fetch(`${API_BASE}/users`).then(res => res.json());

// 产品相关
export const fetchProducts = (params = {}) => {
  let url = `${API_BASE}/products`;
  const queryParams = [];
  if (params.owner_id) queryParams.push(`owner_id=${params.owner_id}`);
  if (params.status) queryParams.push(`status=${encodeURIComponent(params.status)}`);
  if (queryParams.length > 0) url += '?' + queryParams.join('&');
  return fetch(url).then(res => res.json());
};

export const fetchProductDetail = (id) => 
  fetch(`${API_BASE}/products/${id}`).then(res => res.json());

export const createProduct = (data) => 
  fetch(`${API_BASE}/products`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(res => res.json());

// 数据上传
export const uploadFile = (file) => {
  const formData = new FormData();
  formData.append('file', file);
  return fetch(`${API_BASE}/upload-excel`, { method: 'POST', body: formData })
    .then(res => res.json());
};

// 日数据相关
export const updateShopData = (productId, dayNumber, data) => 
  fetch(`${API_BASE}/daily-data/${productId}/${dayNumber}/shop`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(res => res.json());

export const updateAdData = (productId, dayNumber, data) => 
  fetch(`${API_BASE}/daily-data/${productId}/${dayNumber}/ad`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(res => res.json());

export const executeDecision = (productId, dayNumber, data) => 
  fetch(`${API_BASE}/daily-data/${productId}/${dayNumber}/execute`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(res => res.json());

export const reportAbnormal = (productId, dayNumber, data) => 
  fetch(`${API_BASE}/daily-data/${productId}/${dayNumber}/abnormal`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(res => res.json());
