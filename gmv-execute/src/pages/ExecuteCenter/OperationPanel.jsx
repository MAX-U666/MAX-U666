/**
 * 操作台组件
 * 手动创建执行任务
 */
import React, { useState, useEffect } from 'react';
import { styles } from '../../styles/theme';

const ACTION_TYPES = [
  { 
    action: 'adjust_budget', 
    name: '调整广告预算', 
    icon: '💰',
    description: '修改 GMV MAX 广告的日预算或总预算',
    fields: [
      { key: 'campaign_name', label: '广告计划名称', type: 'text', placeholder: '输入广告名称（模糊匹配）' },
      { key: 'campaign_id', label: '广告计划ID（可选）', type: 'text', placeholder: '精确ID，不填则按名称匹配' },
      { key: 'new_budget', label: '新预算金额', type: 'number', placeholder: '输入金额（印尼盾）', required: true },
      { key: 'budget_type', label: '预算类型', type: 'select', options: [
        { value: 'daily', label: '日预算' },
        { value: 'total', label: '总预算' }
      ]}
    ]
  },
  { 
    action: 'toggle_ad', 
    name: '开/关广告', 
    icon: '🔘',
    description: '开启或关闭指定的广告计划',
    fields: [
      { key: 'campaign_name', label: '广告计划名称', type: 'text', placeholder: '输入广告名称' },
      { key: 'campaign_id', label: '广告计划ID（可选）', type: 'text', placeholder: '精确ID' },
      { key: 'enable', label: '操作', type: 'select', options: [
        { value: true, label: '开启广告' },
        { value: false, label: '关闭广告' }
      ], required: true }
    ]
  },
  { 
    action: 'update_title', 
    name: '修改商品标题', 
    icon: '✏️',
    description: '修改指定商品的标题',
    fields: [
      { key: 'product_name', label: '商品名称', type: 'text', placeholder: '输入商品名称（用于搜索）' },
      { key: 'product_id', label: '商品ID/SKU（可选）', type: 'text', placeholder: '精确ID' },
      { key: 'new_title', label: '新标题', type: 'textarea', placeholder: '输入新的商品标题', required: true }
    ]
  },
  { 
    action: 'update_price', 
    name: '修改商品价格', 
    icon: '💵',
    description: '修改指定商品的售价',
    fields: [
      { key: 'product_name', label: '商品名称', type: 'text', placeholder: '输入商品名称' },
      { key: 'product_id', label: '商品ID/SKU（可选）', type: 'text', placeholder: '精确ID' },
      { key: 'new_price', label: '新价格', type: 'number', placeholder: '输入新价格（印尼盾）', required: true }
    ]
  },
];

const OperationPanel = ({ onTaskCreated }) => {
  const [shops, setShops] = useState([]);
  const [selectedShop, setSelectedShop] = useState(null);
  const [selectedAction, setSelectedAction] = useState(null);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  // 加载店铺列表
  useEffect(() => {
    loadShops();
  }, []);

  const loadShops = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/execute/shops', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setShops(data.shops.filter(s => s.status === 'active'));
      }
    } catch (err) {
      console.error('加载店铺失败:', err);
    }
  };

  const handleActionSelect = (action) => {
    setSelectedAction(action);
    setFormData({});
    setMessage(null);
  };

  const handleFieldChange = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    if (!selectedShop) {
      setMessage({ type: 'error', text: '请选择店铺' });
      return;
    }

    if (!selectedAction) {
      setMessage({ type: 'error', text: '请选择操作类型' });
      return;
    }

    // 验证必填字段
    const action = ACTION_TYPES.find(a => a.action === selectedAction);
    for (const field of action.fields) {
      if (field.required && !formData[field.key]) {
        setMessage({ type: 'error', text: `请填写 ${field.label}` });
        return;
      }
    }

    setLoading(true);
    setMessage(null);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/execute/command', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          shop_id: selectedShop,
          action: selectedAction,
          payload: formData,
          source: 'manual'
        })
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ 
          type: 'success', 
          text: `任务已创建！编号: ${data.task_no}` 
        });
        setFormData({});
        if (onTaskCreated) {
          setTimeout(onTaskCreated, 1500);
        }
      } else {
        setMessage({ type: 'error', text: data.error || '创建失败' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: '网络错误' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '20px' }}>
      {/* 左侧：操作类型选择 */}
      <div style={styles.card}>
        <div style={{ 
          padding: '16px 20px', 
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          fontWeight: '600',
          color: '#E2E8F0'
        }}>
          选择操作类型
        </div>
        <div style={{ padding: '12px' }}>
          {ACTION_TYPES.map(action => (
            <button
              key={action.action}
              onClick={() => handleActionSelect(action.action)}
              style={{
                width: '100%',
                padding: '14px 16px',
                marginBottom: '8px',
                borderRadius: '10px',
                border: selectedAction === action.action 
                  ? '2px solid #8B5CF6' 
                  : '1px solid rgba(255,255,255,0.08)',
                background: selectedAction === action.action 
                  ? 'rgba(139,92,246,0.15)' 
                  : 'rgba(255,255,255,0.02)',
                cursor: 'pointer',
                textAlign: 'left',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}
            >
              <span style={{ fontSize: '24px' }}>{action.icon}</span>
              <div>
                <div style={{ 
                  fontWeight: '600', 
                  color: selectedAction === action.action ? '#A78BFA' : '#E2E8F0',
                  fontSize: '14px',
                  marginBottom: '2px'
                }}>
                  {action.name}
                </div>
                <div style={{ fontSize: '11px', color: '#64748B' }}>
                  {action.description}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* 右侧：参数配置 */}
      <div style={styles.card}>
        <div style={{ 
          padding: '16px 20px', 
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          fontWeight: '600',
          color: '#E2E8F0'
        }}>
          配置参数
        </div>
        <div style={{ padding: '20px' }}>
          {/* 店铺选择 */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ 
              display: 'block', 
              fontSize: '13px', 
              fontWeight: '600', 
              color: '#94A3B8',
              marginBottom: '8px'
            }}>
              选择店铺 <span style={{ color: '#EF4444' }}>*</span>
            </label>
            {shops.length === 0 ? (
              <div style={{ 
                padding: '20px', 
                background: 'rgba(245,158,11,0.1)', 
                borderRadius: '8px',
                color: '#F59E0B',
                fontSize: '13px'
              }}>
                ⚠️ 暂无可用店铺，请先在「店铺管理」中添加
              </div>
            ) : (
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {shops.map(shop => (
                  <button
                    key={shop.id}
                    onClick={() => setSelectedShop(shop.id)}
                    style={{
                      padding: '10px 16px',
                      borderRadius: '8px',
                      border: selectedShop === shop.id 
                        ? '2px solid #10B981' 
                        : '1px solid rgba(255,255,255,0.1)',
                      background: selectedShop === shop.id 
                        ? 'rgba(16,185,129,0.15)' 
                        : 'rgba(255,255,255,0.03)',
                      color: selectedShop === shop.id ? '#10B981' : '#E2E8F0',
                      fontSize: '13px',
                      fontWeight: '500',
                      cursor: 'pointer'
                    }}
                  >
                    🏪 {shop.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 操作参数 */}
          {selectedAction && (
            <>
              <div style={{ 
                height: '1px', 
                background: 'rgba(255,255,255,0.06)', 
                margin: '20px 0' 
              }} />
              
              {ACTION_TYPES.find(a => a.action === selectedAction)?.fields.map(field => (
                <div key={field.key} style={{ marginBottom: '16px' }}>
                  <label style={{ 
                    display: 'block', 
                    fontSize: '13px', 
                    fontWeight: '600', 
                    color: '#94A3B8',
                    marginBottom: '8px'
                  }}>
                    {field.label}
                    {field.required && <span style={{ color: '#EF4444' }}> *</span>}
                  </label>
                  
                  {field.type === 'select' ? (
                    <select
                      value={formData[field.key] ?? ''}
                      onChange={(e) => {
                        let val = e.target.value;
                        // 处理布尔值
                        if (val === 'true') val = true;
                        if (val === 'false') val = false;
                        handleFieldChange(field.key, val);
                      }}
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
                      <option value="">请选择</option>
                      {field.options.map(opt => (
                        <option key={String(opt.value)} value={String(opt.value)}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  ) : field.type === 'textarea' ? (
                    <textarea
                      value={formData[field.key] || ''}
                      onChange={(e) => handleFieldChange(field.key, e.target.value)}
                      placeholder={field.placeholder}
                      rows={3}
                      style={{
                        width: '100%',
                        padding: '12px 14px',
                        borderRadius: '8px',
                        border: '1px solid rgba(255,255,255,0.1)',
                        background: 'rgba(255,255,255,0.05)',
                        color: '#E2E8F0',
                        fontSize: '14px',
                        resize: 'vertical',
                        boxSizing: 'border-box'
                      }}
                    />
                  ) : (
                    <input
                      type={field.type}
                      value={formData[field.key] || ''}
                      onChange={(e) => handleFieldChange(field.key, 
                        field.type === 'number' ? parseFloat(e.target.value) || '' : e.target.value
                      )}
                      placeholder={field.placeholder}
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
                  )}
                </div>
              ))}
            </>
          )}

          {/* 消息提示 */}
          {message && (
            <div style={{
              padding: '12px 16px',
              borderRadius: '8px',
              marginTop: '16px',
              background: message.type === 'success' 
                ? 'rgba(16,185,129,0.1)' 
                : 'rgba(239,68,68,0.1)',
              border: `1px solid ${message.type === 'success' ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
              color: message.type === 'success' ? '#10B981' : '#F87171',
              fontSize: '13px'
            }}>
              {message.type === 'success' ? '✅' : '⚠️'} {message.text}
            </div>
          )}

          {/* 提交按钮 */}
          {selectedAction && (
            <button
              onClick={handleSubmit}
              disabled={loading || shops.length === 0}
              style={{
                width: '100%',
                marginTop: '24px',
                padding: '14px',
                borderRadius: '10px',
                border: 'none',
                background: loading 
                  ? 'rgba(139,92,246,0.5)' 
                  : 'linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%)',
                color: '#fff',
                fontSize: '15px',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: loading ? 'none' : '0 4px 15px rgba(139,92,246,0.3)'
              }}
            >
              {loading ? '⏳ 提交中...' : '🚀 创建执行任务'}
            </button>
          )}

          {/* 未选择操作时的提示 */}
          {!selectedAction && (
            <div style={{
              padding: '60px 20px',
              textAlign: 'center',
              color: '#64748B'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>👈</div>
              <p>请先在左侧选择要执行的操作类型</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OperationPanel;
