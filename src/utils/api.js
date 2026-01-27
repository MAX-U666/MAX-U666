const API_BASE = '/api';

// =============================================
// 用户相关
// =============================================
export const fetchUsers = () => 
  fetch(`${API_BASE}/users`).then(res => res.json());

// =============================================
// 产品相关
// =============================================
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

// =============================================
// 数据上传
// =============================================
export const uploadFile = (file) => {
  const formData = new FormData();
  formData.append('file', file);
  return fetch(`${API_BASE}/upload-excel`, { method: 'POST', body: formData })
    .then(res => res.json());
};

// =============================================
// 日数据相关 - 26列完整版
// =============================================

/**
 * 更新店铺数据（26列完整版）
 * @param {number} productId 
 * @param {number} dayNumber 
 * @param {object} data - 包含所有26列字段
 */
export const updateShopData = (productId, dayNumber, data) => 
  fetch(`${API_BASE}/daily-data/${productId}/${dayNumber}/shop`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      // 流量数据
      visitors: data.visitors || 0,
      page_views: data.page_views || 0,
      visitors_no_buy: data.visitors_no_buy || 0,
      visitors_no_buy_rate: data.visitors_no_buy_rate || 0,
      clicks: data.clicks || 0,
      likes: data.likes || 0,
      
      // 加购数据
      cart_visitors: data.cart_visitors || 0,
      add_to_cart: data.add_to_cart || 0,
      cart_rate: data.cart_rate || 0,
      
      // 订单数据（已下单）
      orders_created: data.orders_created || 0,
      items_created: data.items_created || 0,
      revenue_created: data.revenue_created || 0,
      
      // 订单数据（待发货）
      orders_ready: data.orders_ready || 0,
      items_ready: data.items_ready || 0,
      revenue_ready: data.revenue_ready || 0,
      ready_rate: data.ready_rate || 0,
      ready_created_rate: data.ready_created_rate || 0,
    })
  }).then(res => res.json());

/**
 * 更新广告数据
 */
export const updateAdData = (productId, dayNumber, data) => 
  fetch(`${API_BASE}/daily-data/${productId}/${dayNumber}/ad`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(res => res.json());

/**
 * 更新补单数据
 */
export const updateManualOrders = (productId, dayNumber, manualOrders) =>
  fetch(`${API_BASE}/daily-data/${productId}/${dayNumber}/manual`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ manual_orders: manualOrders })
  }).then(res => res.json());

// =============================================
// AI决策相关
// =============================================
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
