/**
 * 店铺管理组件
 */
import React, { useState, useEffect } from 'react';
import { styles } from '../../styles/theme';

const ShopManagement = () => {
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingShop, setEditingShop] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [testing, setTesting] = useState(null); // 正在测试的店铺ID
  const [message, setMessage] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    platform: 'shopee',
    site: 'id',
    browser_id: '',
    browser_name: ''
  });

  useEffect(() => {
    loadShops();
  }, []);

  const getToken = () => localStorage.getItem('token');

  const loadShops = async () => {
    try {
      const response = await fetch('/api/execute/shops', {
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      const data = await response.json();
      if (data.success) {
        setShops(data.shops);
      }
    } catch (err) {
      console.error('加载店铺失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    setMessage(null);
    try {
      const response = await fetch('/api/execute/shops/sync-from-ziniao', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      const data = await response.json();
      if (data.success) {
        setMessage({ type: 'success', text: `同步完成！新增 ${data.synced} 个店铺` });
        loadShops();
      } else {
        setMessage({ type: 'error', text: data.error || '同步失败' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: '网络错误' });
    } finally {
      setSyncing(false);
    }
  };

  const handleTest = async (shopId) => {
    setTesting(shopId);
    try {
      const response = await fetch(`/api/execute/shops/${shopId}/test`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      const data = await response.json();
      if (data.success) {
        setMessage({ 
          type: 'success', 
          text: `连接成功！调试端口: ${data.browserInfo.debuggingPort}` 
        });
        loadShops();
      } else {
        setMessage({ type: 'error', text: data.error || '连接失败' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: '网络错误' });
    } finally {
      setTesting(null);
    }
  };

  const handleSave = async () => {
    if (!formData.name || !formData.browser_id) {
      setMessage({ type: 'error', text: '店铺名称和浏览器ID必填' });
      return;
    }

    try {
      const url = editingShop 
        ? `/api/execute/shops/${editingShop.id}` 
        : '/api/execute/shops';
      const method = editingShop ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getToken()}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      if (data.success) {
        setMessage({ type: 'success', text: editingShop ? '更新成功' : '添加成功' });
        setShowAddModal(false);
        setEditingShop(null);
        setFormData({ name: '', platform: 'shopee', site: 'id', browser_id: '', browser_name: '' });
        loadShops();
      } else {
        setMessage({ type: 'error', text: data.error || '操作失败' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: '网络错误' });
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('确定要删除该店铺吗？')) return;

    try {
      const response = await fetch(`/api/execute/shops/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      const data = await response.json();
      if (data.success) {
        loadShops();
      } else {
        alert(data.error || '删除失败');
      }
    } catch (err) {
      alert('网络错误');
    }
  };

  const openEdit = (shop) => {
    setEditingShop(shop);
    setFormData({
      name: shop.name,
      platform: shop.platform,
      site: shop.site,
      browser_id: shop.browser_id,
      browser_name: shop.browser_name || '',
      status: shop.status
    });
    setShowAddModal(true);
  };

  const getStatusBadge = (status) => {
    const configs = {
      active: { label: '正常', color: '#10B981', bg: 'rgba(16,185,129,0.15)' },
      inactive: { label: '未激活', color: '#F59E0B', bg: 'rgba(245,158,11,0.15)' },
      error: { label: '异常', color: '#EF4444', bg: 'rgba(239,68,68,0.15)' }
    };
    const config = configs[status] || configs.inactive;
    return (
      <span style={{
        padding: '4px 10px',
        borderRadius: '6px',
        fontSize: '11px',
        fontWeight: '600',
        background: config.bg,
        color: config.color
      }}>
        {config.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px', color: '#64748B' }}>
        加载中...
      </div>
    );
  }

  return (
    <div>
      {/* 操作栏 */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '20px'
      }}>
        <div style={{ color: '#94A3B8', fontSize: '13px' }}>
          共 {shops.length} 个店铺
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={handleSync}
            disabled={syncing}
            style={{
              padding: '10px 16px',
              borderRadius: '8px',
              border: '1px solid rgba(59,130,246,0.3)',
              background: 'rgba(59,130,246,0.1)',
              color: '#3B82F6',
              fontSize: '13px',
              fontWeight: '500',
              cursor: syncing ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            {syncing ? '🔄 同步中...' : '🔄 从紫鸟同步'}
          </button>
          <button
            onClick={() => {
              setEditingShop(null);
              setFormData({ name: '', platform: 'shopee', site: 'id', browser_id: '', browser_name: '' });
              setShowAddModal(true);
            }}
            style={{
              ...styles.buttonPrimary,
              background: 'linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%)'
            }}
          >
            + 手动添加
          </button>
        </div>
      </div>

      {/* 消息提示 */}
      {message && (
        <div style={{
          padding: '12px 16px',
          borderRadius: '8px',
          marginBottom: '16px',
          background: message.type === 'success' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
          color: message.type === 'success' ? '#10B981' : '#F87171',
          fontSize: '13px'
        }}>
          {message.text}
        </div>
      )}

      {/* 店铺列表 */}
      {shops.length === 0 ? (
        <div style={{
          ...styles.card,
          padding: '60px 20px',
          textAlign: 'center',
          color: '#64748B'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🏪</div>
          <p>暂无店铺</p>
          <p style={{ fontSize: '12px', marginTop: '8px' }}>
            点击「从紫鸟同步」自动导入，或「手动添加」
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
          {shops.map(shop => (
            <div key={shop.id} style={styles.card}>
              <div style={{ padding: '20px' }}>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'flex-start',
                  marginBottom: '16px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '44px',
                      height: '44px',
                      background: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)',
                      borderRadius: '10px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '20px'
                    }}>
                      🏪
                    </div>
                    <div>
                      <div style={{ fontWeight: '600', color: '#E2E8F0', fontSize: '15px' }}>
                        {shop.name}
                      </div>
                      <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>
                        {shop.platform} · {shop.site.toUpperCase()}
                      </div>
                    </div>
                  </div>
                  {getStatusBadge(shop.status)}
                </div>

                <div style={{ 
                  background: 'rgba(255,255,255,0.03)', 
                  borderRadius: '8px', 
                  padding: '12px',
                  marginBottom: '16px',
                  fontSize: '12px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ color: '#64748B' }}>浏览器ID</span>
                    <span style={{ color: '#94A3B8', fontFamily: 'monospace' }}>
                      {shop.browser_id.substring(0, 16)}...
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748B' }}>最后连接</span>
                    <span style={{ color: '#94A3B8' }}>
                      {shop.last_connected_at 
                        ? new Date(shop.last_connected_at).toLocaleString('zh-CN')
                        : '从未连接'
                      }
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={() => handleTest(shop.id)}
                    disabled={testing === shop.id}
                    style={{
                      flex: 1,
                      padding: '10px',
                      borderRadius: '8px',
                      border: '1px solid rgba(16,185,129,0.3)',
                      background: 'rgba(16,185,129,0.1)',
                      color: '#10B981',
                      fontSize: '12px',
                      fontWeight: '500',
                      cursor: testing === shop.id ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {testing === shop.id ? '⏳ 测试中...' : '🔗 测试连接'}
                  </button>
                  <button
                    onClick={() => openEdit(shop)}
                    style={{
                      padding: '10px 16px',
                      borderRadius: '8px',
                      border: '1px solid rgba(255,255,255,0.1)',
                      background: 'transparent',
                      color: '#94A3B8',
                      fontSize: '12px',
                      cursor: 'pointer'
                    }}
                  >
                    ✏️ 编辑
                  </button>
                  <button
                    onClick={() => handleDelete(shop.id)}
                    style={{
                      padding: '10px 16px',
                      borderRadius: '8px',
                      border: '1px solid rgba(239,68,68,0.3)',
                      background: 'transparent',
                      color: '#EF4444',
                      fontSize: '12px',
                      cursor: 'pointer'
                    }}
                  >
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 添加/编辑弹窗 */}
      {showAddModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)',
            borderRadius: '16px',
            width: '480px',
            border: '1px solid rgba(255,255,255,0.1)'
          }}>
            <div style={{
              padding: '20px 24px',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
              fontWeight: '600',
              color: '#E2E8F0',
              fontSize: '16px'
            }}>
              {editingShop ? '编辑店铺' : '添加店铺'}
            </div>
            
            <div style={{ padding: '24px' }}>
              <FormField 
                label="店铺名称" 
                required
                value={formData.name}
                onChange={(v) => setFormData(prev => ({ ...prev, name: v }))}
                placeholder="例如：印尼主店"
              />
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <FormSelect
                  label="平台"
                  value={formData.platform}
                  onChange={(v) => setFormData(prev => ({ ...prev, platform: v }))}
                  options={[
                    { value: 'shopee', label: 'Shopee' }
                  ]}
                />
                <FormSelect
                  label="站点"
                  value={formData.site}
                  onChange={(v) => setFormData(prev => ({ ...prev, site: v }))}
                  options={[
                    { value: 'id', label: '印尼 (ID)' },
                    { value: 'my', label: '马来西亚 (MY)' },
                    { value: 'th', label: '泰国 (TH)' },
                    { value: 'vn', label: '越南 (VN)' },
                    { value: 'ph', label: '菲律宾 (PH)' },
                    { value: 'sg', label: '新加坡 (SG)' }
                  ]}
                />
              </div>

              <FormField 
                label="紫鸟浏览器ID" 
                required
                value={formData.browser_id}
                onChange={(v) => setFormData(prev => ({ ...prev, browser_id: v }))}
                placeholder="从紫鸟复制 browserOauth 值"
              />

              <FormField 
                label="浏览器备注名（可选）" 
                value={formData.browser_name}
                onChange={(v) => setFormData(prev => ({ ...prev, browser_name: v }))}
                placeholder="用于显示"
              />

              {editingShop && (
                <FormSelect
                  label="状态"
                  value={formData.status}
                  onChange={(v) => setFormData(prev => ({ ...prev, status: v }))}
                  options={[
                    { value: 'active', label: '正常' },
                    { value: 'inactive', label: '未激活' }
                  ]}
                />
              )}
            </div>

            <div style={{
              padding: '16px 24px',
              borderTop: '1px solid rgba(255,255,255,0.06)',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '12px'
            }}>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditingShop(null);
                }}
                style={styles.buttonSecondary}
              >
                取消
              </button>
              <button
                onClick={handleSave}
                style={{
                  ...styles.buttonPrimary,
                  background: 'linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%)'
                }}
              >
                {editingShop ? '保存' : '添加'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// 表单字段组件
const FormField = ({ label, required, value, onChange, placeholder, type = 'text' }) => (
  <div style={{ marginBottom: '16px' }}>
    <label style={{ 
      display: 'block', 
      fontSize: '13px', 
      fontWeight: '600', 
      color: '#94A3B8',
      marginBottom: '8px'
    }}>
      {label}
      {required && <span style={{ color: '#EF4444' }}> *</span>}
    </label>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        width: '100%',
        padding: '12px 14px',
        borderRadius: '8px',
        border: '1px solid rgba(255,255,255,0.1)',
        background: 'rgba(255,255,255,0.05)',
        color: '#E2E8F0',
        fontSize: '14px',
        boxSizing: 'border-box'
      }}
    />
  </div>
);

// 下拉选择组件
const FormSelect = ({ label, value, onChange, options }) => (
  <div style={{ marginBottom: '16px' }}>
    <label style={{ 
      display: 'block', 
      fontSize: '13px', 
      fontWeight: '600', 
      color: '#94A3B8',
      marginBottom: '8px'
    }}>
      {label}
    </label>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        width: '100%',
        padding: '12px 14px',
        borderRadius: '8px',
        border: '1px solid rgba(255,255,255,0.1)',
        background: 'rgba(255,255,255,0.05)',
        color: '#E2E8F0',
        fontSize: '14px'
      }}
    >
      {options.map(opt => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  </div>
);

export default ShopManagement;
