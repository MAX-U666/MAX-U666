// API 基础配置
const API_BASE = '/api';

// 获取 token
const getToken = () => localStorage.getItem('token');

// 通用请求函数
const request = async (url, options = {}) => {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers
  };

  const response = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers
  });

  if (response.status === 401) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.reload();
    throw new Error('登录已过期');
  }

  return response.json();
};

// 登录
export const login = (username, password) => 
  request('/login', {
    method: 'POST',
    body: JSON.stringify({ username, password })
  });

// 登出
export const logout = () => 
  request('/logout', { method: 'POST' });

// 验证 token
export const verifyToken = () => 
  request('/verify-token');

// 获取用户列表
export const getUsers = () => 
  request('/users');

// 添加用户
export const addUser = (userData) => 
  request('/users', {
    method: 'POST',
    body: JSON.stringify(userData)
  });

// 删除用户
export const deleteUser = (id) => 
  request(`/users/${id}`, { method: 'DELETE' });

// 重置密码
export const resetPassword = (id) => 
  request(`/users/${id}/reset-password`, { method: 'POST' });

// 获取产品列表
export const getProducts = (params = {}) => {
  const query = new URLSearchParams(params).toString();
  return request(`/products${query ? `?${query}` : ''}`);
};

// 获取产品详情
export const getProduct = (id) => 
  request(`/products/${id}`);

// 创建产品
export const createProduct = (productData) => 
  request('/products', {
    method: 'POST',
    body: JSON.stringify(productData)
  });

// 更新店铺数据
export const updateShopData = (productId, dayNumber, data) => 
  request(`/daily-data/${productId}/${dayNumber}/shop`, {
    method: 'PUT',
    body: JSON.stringify(data)
  });

// 更新广告数据
export const updateAdData = (productId, dayNumber, data) => 
  request(`/daily-data/${productId}/${dayNumber}/ad`, {
    method: 'PUT',
    body: JSON.stringify(data)
  });

// 更新补单数据
export const updateManualData = (productId, dayNumber, data) => 
  request(`/daily-data/${productId}/${dayNumber}/manual`, {
    method: 'PUT',
    body: JSON.stringify(data)
  });

// AI 分析
export const getAIAnalysis = (productId, dayNumber, useAI = true) => 
  request(`/ai-analysis/${productId}/${dayNumber}`, {
    method: 'POST',
    body: JSON.stringify({ useAI })
  });

// 执行决策
export const executeDecision = (productId, dayNumber, data) => 
  request(`/daily-data/${productId}/${dayNumber}/execute`, {
    method: 'PUT',
    body: JSON.stringify(data)
  });

// 上报异常
export const reportAbnormal = (productId, dayNumber, data) => 
  request(`/daily-data/${productId}/${dayNumber}/abnormal`, {
    method: 'PUT',
    body: JSON.stringify(data)
  });

// 上传 Excel
export const uploadExcel = async (file) => {
  const token = getToken();
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE}/upload-excel`, {
    method: 'POST',
    headers: {
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    },
    body: formData
  });

  return response.json();
};

export default {
  login,
  logout,
  verifyToken,
  getUsers,
  addUser,
  deleteUser,
  resetPassword,
  getProducts,
  getProduct,
  createProduct,
  updateShopData,
  updateAdData,
  updateManualData,
  getAIAnalysis,
  executeDecision,
  reportAbnormal,
  uploadExcel
};
