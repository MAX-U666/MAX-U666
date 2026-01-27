import React, { useState, useEffect, useRef } from 'react';

const API_BASE = '/api';

// 自定义Logo组件
const GMVLogo = ({ size = 40 }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
    <defs>
      <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FF6B35" />
        <stop offset="50%" stopColor="#F7931E" />
        <stop offset="100%" stopColor="#FFB347" />
      </linearGradient>
      <filter id="glow">
        <feGaussianBlur stdDeviation="1.5" result="coloredBlur"/>
        <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
    </defs>
    <rect width="48" height="48" rx="12" fill="url(#logoGrad)"/>
    <g filter="url(#glow)">
      <path d="M12 32 Q18 28, 24 24 Q30 20, 36 14" stroke="white" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.9"/>
      <path d="M12 36 Q20 30, 28 26 Q34 23, 38 20" stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.6"/>
      <circle cx="36" cy="14" r="3" fill="white"/>
    </g>
  </svg>
);

const MiniLogo = ({ size = 24, color = "#FF6B35" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M4 16 Q8 13, 12 11 Q16 9, 20 6" stroke={color} strokeWidth="2.5" strokeLinecap="round" fill="none"/>
    <circle cx="20" cy="6" r="2" fill={color}/>
  </svg>
);

const GMVMaxWorkspace = () => {
  const [currentView, setCurrentView] = useState('dashboard');
  const [currentUser, setCurrentUser] = useState({ id: 1, name: '张三', role: 'operator', avatar: '👨‍💼', color: '#3b82f6' });
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [products, setProducts] = useState([]);
  const [users, setUsers] = useState([]);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterOwner, setFilterOwner] = useState('mine');
  const [loading, setLoading] = useState(false);
  
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [executionStatus, setExecutionStatus] = useState(null);
  const [showAbnormalModal, setShowAbnormalModal] = useState(false);
  const [showNewProductModal, setShowNewProductModal] = useState(false);
  const [abnormalReason, setAbnormalReason] = useState('');
  const [countdown, setCountdown] = useState({ hours: 2, minutes: 10, seconds: 23 });

  // 新建产品表单
  const [newProduct, setNewProduct] = useState({
    sku: '', name: '', price: '', start_date: new Date().toISOString().split('T')[0], target_roi: '3.0'
  });

  // 上传相关 - 分开存储店铺和广告数据
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [shopData, setShopData] = useState(null);
  const [adData, setAdData] = useState(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState('');
  const [selectedDayNumber, setSelectedDayNumber] = useState(1);
  const shopFileRef = useRef(null);
  const adFileRef = useRef(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        if (prev.hours > 0) return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
        return prev;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // 加载用户列表
  useEffect(() => {
    fetch(`${API_BASE}/users`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setUsers(data);
          setCurrentUser(data[0]);
        }
      })
      .catch(err => console.error(err));
  }, []);

  // 加载产品列表
  const loadProducts = () => {
    setLoading(true);
    let url = `${API_BASE}/products`;
    const params = [];
    if (filterOwner === 'mine' && currentUser.role !== 'admin') {
      params.push(`owner_id=${currentUser.id}`);
    }
    if (filterStatus !== 'all') {
      params.push(`status=${encodeURIComponent(filterStatus)}`);
    }
    if (params.length > 0) url += '?' + params.join('&');

    fetch(url)
      .then(res => res.json())
      .then(data => { 
        if (Array.isArray(data)) setProducts(data); 
        setLoading(false); 
      })
      .catch(err => { console.error(err); setLoading(false); });
  };

  useEffect(() => { loadProducts(); }, [filterOwner, filterStatus, currentUser]);

  // 加载产品详情
  const loadProductDetail = (id) => {
    fetch(`${API_BASE}/products/${id}`)
      .then(res => res.json())
      .then(data => {
        setSelectedProduct(data);
        setSelectedDayNumber(data.current_day || 1);
        setIsSubmitted(false);
        setExecutionStatus(null);
      })
      .catch(err => console.error(err));
  };

  // 新建产品
  const handleCreateProduct = async () => {
    if (!newProduct.sku || !newProduct.name) {
      alert('请填写产品ID和名称');
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newProduct, owner_id: currentUser.id })
      });
      const data = await res.json();
      if (res.ok) {
        setShowNewProductModal(false);
        setNewProduct({ sku: '', name: '', price: '', start_date: new Date().toISOString().split('T')[0], target_roi: '3.0' });
        loadProducts();
      } else {
        alert(data.error || '创建失败');
      }
    } catch (err) {
      alert('网络错误: ' + err.message);
    }
  };

  // 上传店铺数据
  const handleShopFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadLoading(true);
    setUploadMessage('');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch(`${API_BASE}/upload-excel`, { method: 'POST', body: formData });
      const result = await res.json();
      if (result.success) {
        setShopData(result.products);
        setUploadMessage(`店铺数据: ${result.products.length} 个产品`);
      } else {
        setUploadMessage(`店铺解析失败: ${result.error || result.errors?.join(',')}`);
      }
    } catch (err) {
      setUploadMessage(`网络错误: ${err.message}`);
    }
    setUploadLoading(false);
    e.target.value = '';
  };

  // 上传广告数据
  const handleAdFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadLoading(true);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch(`${API_BASE}/upload-excel`, { method: 'POST', body: formData });
      const result = await res.json();
      if (result.success) {
        setAdData(result.products);
        setUploadMessage(prev => (prev ? prev + ' | ' : '') + `广告数据: ${result.products.length} 个产品`);
      } else {
        setUploadMessage(prev => (prev ? prev + ' | ' : '') + `广告解析失败: ${result.error || result.errors?.join(',')}`);
      }
    } catch (err) {
      setUploadMessage(prev => (prev ? prev + ' | ' : '') + `网络错误: ${err.message}`);
    }
    setUploadLoading(false);
    e.target.value = '';
  };

  // 合并数据并导入
  const handleImportData = async () => {
    if (!selectedProduct) return;
    
    const sku = selectedProduct.sku;
    const shopProduct = shopData?.find(p => p.product_id === sku);
    const adProduct = adData?.find(p => p.product_id === sku);

    if (!shopProduct && !adProduct) {
      setUploadMessage(`未找到 SKU: ${sku} 的数据`);
      return;
    }

    setUploadLoading(true);

    const mergedData = {
      visitors: shopProduct?.visitors || 0,
      page_views: shopProduct?.page_views || 0,
      clicks: shopProduct?.clicks || 0,
      add_to_cart: shopProduct?.add_to_cart || 0,
      likes: shopProduct?.likes || 0,
      organic_orders: shopProduct?.orders || 0,
      conversion_rate: shopProduct?.conversion_rate || 0,
      manual_orders: 0,
      ad_impressions: adProduct?.ad_impressions || 0,
      ad_clicks: adProduct?.ad_clicks || 0,
      ad_ctr: adProduct?.ad_ctr || 0,
      ad_orders: adProduct?.ad_conversions || 0,
      ad_cvr: adProduct?.ad_cvr || 0,
      ad_spend: adProduct?.ad_spend || 0,
      ad_revenue: adProduct?.ad_revenue || 0
    };

    try {
      const res = await fetch(`${API_BASE}/daily-data/${selectedProduct.id}/${selectedDayNumber}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mergedData)
      });
      const result = await res.json();
      if (result.success) {
        setUploadMessage(`Day ${selectedDayNumber} 导入成功！ROI: ${result.roi}`);
        setTimeout(() => {
          setShowUploadModal(false);
          setShopData(null);
          setAdData(null);
          setUploadMessage('');
          loadProductDetail(selectedProduct.id);
        }, 1500);
      } else {
        setUploadMessage(`导入失败: ${result.error}`);
      }
    } catch (err) {
      setUploadMessage(`网络错误: ${err.message}`);
    }
    setUploadLoading(false);
  };

  // 执行决策
  const handleExecute = async (action, reason, confidence) => {
    if (!selectedProduct) return;
    try {
      await fetch(`${API_BASE}/daily-data/${selectedProduct.id}/${selectedDayNumber}/execute`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ai_action: action, ai_reason: reason, ai_confidence: confidence, executor_id: currentUser.id })
      });
      setExecutionStatus('executed');
      loadProductDetail(selectedProduct.id);
    } catch (err) {
      alert('执行失败: ' + err.message);
    }
  };

  // 上报异常
  const handleAbnormal = async () => {
    if (!selectedProduct) return;
    try {
      await fetch(`${API_BASE}/daily-data/${selectedProduct.id}/${selectedDayNumber}/abnormal`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ abnormal_reason: abnormalReason, executor_id: currentUser.id })
      });
      setShowAbnormalModal(false);
      setAbnormalReason('');
      setExecutionStatus('abnormal');
      loadProductDetail(selectedProduct.id);
    } catch (err) {
      alert('上报失败: ' + err.message);
    }
  };

  const getStatusConfig = (status) => {
    const configs = {
      '进行中': { label: '进行中', color: '#3B82F6', bg: 'linear-gradient(135deg, #DBEAFE 0%, #BFDBFE 100%)', icon: '◐' },
      '已完成': { label: '已完成', color: '#10B981', bg: 'linear-gradient(135deg, #D1FAE5 0%, #A7F3D0 100%)', icon: '✓' },
      '已暂停': { label: '已暂停', color: '#F59E0B', bg: 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)', icon: '⏸' },
      '已归档': { label: '已归档', color: '#6B7280', bg: 'linear-gradient(135deg, #F3F4F6 0%, #E5E7EB 100%)', icon: '📁' },
      'pending': { label: '待决策', color: '#F59E0B', bg: 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)', icon: '◐' },
      'executed': { label: '已执行', color: '#10B981', bg: 'linear-gradient(135deg, #D1FAE5 0%, #A7F3D0 100%)', icon: '✓' },
      'abnormal': { label: '异常', color: '#EF4444', bg: 'linear-gradient(135deg, #FEE2E2 0%, #FECACA 100%)', icon: '!' },
      'nodata': { label: '未提交', color: '#6B7280', bg: 'linear-gradient(135deg, #F3F4F6 0%, #E5E7EB 100%)', icon: '○' }
    };
    return configs[status] || configs['进行中'];
  };

  const getDayStatus = (dayData) => {
    if (!dayData) return { label: '未提交', color: '#6B7280', bg: '#374151' };
    const configs = {
      '未提交': { label: '未提交', color: '#6B7280', bg: '#374151' },
      '待决策': { label: '待决策', color: '#F59E0B', bg: '#78350F' },
      '已执行': { label: '已执行', color: '#10B981', bg: '#064E3B' },
      '异常': { label: '异常', color: '#EF4444', bg: '#7F1D1D' }
    };
    return configs[dayData.status] || configs['未提交'];
  };

  const getPhaseConfig = (phase) => {
    const configs = {
      A: { label: '样本不足期', color: '#F59E0B', bg: '#FEF3C7' },
      B: { label: '放量观察期', color: '#3B82F6', bg: '#DBEAFE' },
      C: { label: '放量确认期', color: '#10B981', bg: '#D1FAE5' }
    };
    return configs[phase] || { label: '-', color: '#6B7280', bg: '#F3F4F6' };
  };

  // =============== 全局样式 ===============
  const styles = {
    container: {
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #0F172A 0%, #1E293B 100%)',
      fontFamily: '"SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    },
    header: {
      background: 'rgba(15, 23, 42, 0.95)',
      backdropFilter: 'blur(20px)',
      borderBottom: '1px solid rgba(255,255,255,0.06)',
      padding: '12px 32px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      position: 'sticky',
      top: 0,
      zIndex: 100,
    },
    content: {
      padding: '24px 32px',
      maxWidth: '1600px',
      margin: '0 auto',
    },
    card: {
      background: 'rgba(255,255,255,0.03)',
      backdropFilter: 'blur(10px)',
      border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: '16px',
      overflow: 'hidden',
    },
    buttonPrimary: {
      background: 'linear-gradient(135deg, #FF6B35 0%, #F7931E 100%)',
      border: 'none',
      borderRadius: '10px',
      padding: '10px 20px',
      color: '#fff',
      fontSize: '13px',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      boxShadow: '0 4px 15px rgba(255,107,53,0.3)',
    },
    buttonSecondary: {
      background: 'rgba(255,255,255,0.05)',
      border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: '10px',
      padding: '10px 20px',
      color: '#94A3B8',
      fontSize: '13px',
      fontWeight: '500',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
    },
  };

  // =============== 渲染新建产品弹窗 ===============
  const renderNewProductModal = () => (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ background: 'linear-gradient(180deg, #1E293B 0%, #0F172A 100%)', borderRadius: '24px', width: '500px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 25px 80px rgba(0,0,0,0.5)' }}>
        <div style={{ background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)', padding: '24px 28px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '44px', height: '44px', background: 'rgba(255,255,255,0.2)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#fff' }}>新建产品任务</h3>
            <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'rgba(255,255,255,0.8)' }}>创建7天GMV MAX跟踪周期</p>
          </div>
        </div>
        
        <div style={{ padding: '28px' }}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ fontSize: '13px', fontWeight: '600', color: '#E2E8F0', display: 'block', marginBottom: '8px' }}>产品ID (SKU) *</label>
            <input type="text" value={newProduct.sku} onChange={(e) => setNewProduct({...newProduct, sku: e.target.value})} placeholder="从Shopee复制产品ID" style={{ width: '100%', padding: '14px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', fontSize: '14px', color: '#E2E8F0', outline: 'none', boxSizing: 'border-box' }} />
          </div>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ fontSize: '13px', fontWeight: '600', color: '#E2E8F0', display: 'block', marginBottom: '8px' }}>产品名称 *</label>
            <input type="text" value={newProduct.name} onChange={(e) => setNewProduct({...newProduct, name: e.target.value})} placeholder="输入产品名称" style={{ width: '100%', padding: '14px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', fontSize: '14px', color: '#E2E8F0', outline: 'none', boxSizing: 'border-box' }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
            <div>
              <label style={{ fontSize: '13px', fontWeight: '600', color: '#E2E8F0', display: 'block', marginBottom: '8px' }}>开始日期 (Day 1)</label>
              <input type="date" value={newProduct.start_date} onChange={(e) => setNewProduct({...newProduct, start_date: e.target.value})} style={{ width: '100%', padding: '14px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', fontSize: '14px', color: '#E2E8F0', outline: 'none', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ fontSize: '13px', fontWeight: '600', color: '#E2E8F0', display: 'block', marginBottom: '8px' }}>目标ROI</label>
              <input type="number" step="0.1" value={newProduct.target_roi} onChange={(e) => setNewProduct({...newProduct, target_roi: e.target.value})} style={{ width: '100%', padding: '14px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', fontSize: '14px', color: '#E2E8F0', outline: 'none', boxSizing: 'border-box' }} />
            </div>
          </div>
          <div style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: '10px', padding: '14px' }}>
            <div style={{ fontSize: '12px', color: '#60A5FA' }}>📅 系统将自动创建 Day 1 ~ Day 7 的数据表格</div>
            <div style={{ fontSize: '12px', color: '#60A5FA', marginTop: '4px' }}>👤 负责人: {currentUser.name}</div>
          </div>
        </div>
        
        <div style={{ padding: '20px 28px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <button onClick={() => setShowNewProductModal(false)} style={styles.buttonSecondary}>取消</button>
          <button onClick={handleCreateProduct} style={{ ...styles.buttonPrimary, background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)' }}>创建产品</button>
        </div>
      </div>
    </div>
  );

  // =============== 渲染上传弹窗 ===============
  const renderUploadModal = () => {
    const sku = selectedProduct?.sku;
    const matchedShop = shopData?.find(p => p.product_id === sku);
    const matchedAd = adData?.find(p => p.product_id === sku);
    const hasAnyData = matchedShop || matchedAd;

    return (
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
        <div style={{ background: 'linear-gradient(180deg, #1E293B 0%, #0F172A 100%)', borderRadius: '24px', width: '720px', maxHeight: '90vh', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 25px 80px rgba(0,0,0,0.5)' }}>
          <div style={{ background: 'linear-gradient(135deg, #FF6B35 0%, #F7931E 100%)', padding: '24px 28px', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <MiniLogo size={28} color="#fff" />
            <div>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#fff' }}>上传Shopee数据</h3>
              <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'rgba(255,255,255,0.8)' }}>{selectedProduct?.name} · SKU: {selectedProduct?.sku}</p>
            </div>
          </div>
          
          <div style={{ padding: '28px', maxHeight: '60vh', overflowY: 'auto' }}>
            {/* 选择Day */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{ fontSize: '13px', fontWeight: '600', color: '#E2E8F0', display: 'block', marginBottom: '12px' }}>选择录入的 Day</label>
              <div style={{ display: 'flex', gap: '10px' }}>
                {[1,2,3,4,5,6,7].map(d => {
                  const dayData = selectedProduct?.daily_data?.find(dd => dd.day_number === d);
                  const dayStatus = getDayStatus(dayData);
                  return (
                    <button key={d} onClick={() => setSelectedDayNumber(d)} style={{
                      width: '56px', height: '56px', borderRadius: '12px',
                      border: selectedDayNumber === d ? '2px solid #FF6B35' : '1px solid rgba(255,255,255,0.1)',
                      background: selectedDayNumber === d ? 'rgba(255,107,53,0.15)' : `rgba(${dayStatus.color === '#10B981' ? '16,185,129' : dayStatus.color === '#F59E0B' ? '245,158,11' : '100,116,139'},0.1)`,
                      color: selectedDayNumber === d ? '#FF6B35' : dayStatus.color,
                      fontSize: '12px', fontWeight: '600', cursor: 'pointer',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '2px'
                    }}>
                      <span style={{ fontSize: '14px', fontWeight: '700' }}>{d}</span>
                      <span style={{ fontSize: '9px', opacity: 0.8 }}>{dayStatus.label.slice(0,2)}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 两列上传 */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
              {/* 店铺数据 */}
              <div>
                <div style={{ fontSize: '13px', fontWeight: '600', color: '#10B981', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>
                  店铺数据 (Excel)
                </div>
                <div onClick={() => shopFileRef.current?.click()} style={{ border: '2px dashed rgba(16,185,129,0.3)', borderRadius: '14px', padding: '28px', textAlign: 'center', cursor: 'pointer', background: shopData ? 'rgba(16,185,129,0.08)' : 'rgba(255,255,255,0.02)', minHeight: '100px', transition: 'all 0.2s' }}>
                  <input ref={shopFileRef} type="file" accept=".xlsx,.xls" onChange={handleShopFileUpload} style={{ display: 'none' }} />
                  {shopData ? (
                    <div>
                      <div style={{ fontSize: '28px', marginBottom: '8px' }}>✅</div>
                      <div style={{ fontSize: '12px', color: '#10B981', fontWeight: '600' }}>{shopData.length} 个产品</div>
                      {matchedShop && <div style={{ fontSize: '11px', color: '#10B981', marginTop: '6px', opacity: 0.8 }}>匹配: 访客{matchedShop.visitors} 订单{matchedShop.orders}</div>}
                      {!matchedShop && shopData.length > 0 && <div style={{ fontSize: '11px', color: '#EF4444', marginTop: '6px' }}>⚠ SKU未匹配</div>}
                    </div>
                  ) : (
                    <div>
                      <div style={{ fontSize: '28px', marginBottom: '8px', opacity: 0.5 }}>📊</div>
                      <div style={{ fontSize: '12px', color: '#64748B' }}>点击上传 .xlsx</div>
                    </div>
                  )}
                </div>
              </div>

              {/* 广告数据 */}
              <div>
                <div style={{ fontSize: '13px', fontWeight: '600', color: '#F97316', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22,12 18,12 15,21 9,3 6,12 2,12"/></svg>
                  广告数据 (CSV)
                </div>
                <div onClick={() => adFileRef.current?.click()} style={{ border: '2px dashed rgba(249,115,22,0.3)', borderRadius: '14px', padding: '28px', textAlign: 'center', cursor: 'pointer', background: adData ? 'rgba(249,115,22,0.08)' : 'rgba(255,255,255,0.02)', minHeight: '100px', transition: 'all 0.2s' }}>
                  <input ref={adFileRef} type="file" accept=".csv" onChange={handleAdFileUpload} style={{ display: 'none' }} />
                  {adData ? (
                    <div>
                      <div style={{ fontSize: '28px', marginBottom: '8px' }}>✅</div>
                      <div style={{ fontSize: '12px', color: '#F97316', fontWeight: '600' }}>{adData.length} 个产品</div>
                      {matchedAd && <div style={{ fontSize: '11px', color: '#F97316', marginTop: '6px', opacity: 0.8 }}>匹配: 曝光{matchedAd.ad_impressions?.toLocaleString()} 花费Rp{(matchedAd.ad_spend/1000).toFixed(0)}k</div>}
                      {!matchedAd && adData.length > 0 && <div style={{ fontSize: '11px', color: '#EF4444', marginTop: '6px' }}>⚠ SKU未匹配</div>}
                    </div>
                  ) : (
                    <div>
                      <div style={{ fontSize: '28px', marginBottom: '8px', opacity: 0.5 }}>📈</div>
                      <div style={{ fontSize: '12px', color: '#64748B' }}>点击上传 .csv</div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 消息 */}
            {uploadMessage && (
              <div style={{ marginBottom: '16px', padding: '14px 18px', borderRadius: '12px', background: uploadMessage.includes('成功') ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', border: `1px solid ${uploadMessage.includes('成功') ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`, color: uploadMessage.includes('成功') ? '#10B981' : '#F87171', fontSize: '13px' }}>
                {uploadMessage}
              </div>
            )}

            {/* 数据预览 */}
            {hasAnyData && (
              <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '14px', padding: '18px', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ fontSize: '13px', fontWeight: '600', color: '#E2E8F0', marginBottom: '14px' }}>📋 数据预览 (SKU: {sku})</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
                  {[
                    { label: '访客', value: matchedShop?.visitors || 0, color: '#E2E8F0' },
                    { label: '订单', value: matchedShop?.orders || 0, color: '#10B981' },
                    { label: '加购', value: matchedShop?.add_to_cart || 0, color: '#E2E8F0' },
                    { label: '广告曝光', value: (matchedAd?.ad_impressions || 0).toLocaleString(), color: '#F97316' },
                    { label: '广告点击', value: matchedAd?.ad_clicks || 0, color: '#F97316' },
                    { label: '广告花费', value: `Rp${((matchedAd?.ad_spend || 0)/1000).toFixed(0)}k`, color: '#EF4444' },
                    { label: '广告收入', value: `Rp${((matchedAd?.ad_revenue || 0)/1000).toFixed(0)}k`, color: '#10B981' },
                    { label: 'ROI', value: matchedAd?.ad_roi?.toFixed(2) || '-', color: (matchedAd?.ad_roi || 0) >= 3 ? '#10B981' : '#F59E0B' },
                  ].map((item, i) => (
                    <div key={i} style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '10px', textAlign: 'center' }}>
                      <div style={{ fontSize: '10px', color: '#64748B', marginBottom: '4px' }}>{item.label}</div>
                      <div style={{ fontSize: '16px', fontWeight: '700', color: item.color }}>{item.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <div style={{ padding: '20px 28px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', color: '#64748B' }}>数据将导入到 Day {selectedDayNumber}</span>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => { setShowUploadModal(false); setShopData(null); setAdData(null); setUploadMessage(''); }} style={styles.buttonSecondary}>取消</button>
              <button onClick={handleImportData} disabled={!hasAnyData || uploadLoading} style={{ ...styles.buttonPrimary, opacity: hasAnyData ? 1 : 0.5, cursor: hasAnyData ? 'pointer' : 'not-allowed' }}>
                {uploadLoading ? '导入中...' : '导入数据'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // =============== 渲染7天表格 ===============
  const render7DayTable = () => {
    if (!selectedProduct?.daily_data) return null;
    const dailyData = selectedProduct.daily_data;
    const currentDay = selectedProduct.current_day || 1;

    const getSummary = () => {
      return {
        totalOrganic: dailyData.reduce((sum, d) => sum + (d.organic_orders || 0), 0),
        totalManual: dailyData.reduce((sum, d) => sum + (d.manual_orders || 0), 0),
        totalImpressions: dailyData.reduce((sum, d) => sum + (d.visitors || 0), 0),
        totalClicks: dailyData.reduce((sum, d) => sum + (d.clicks || 0), 0),
        avgCVR: dailyData.filter(d => d.visitors > 0).length > 0 ? (dailyData.filter(d => d.visitors > 0).reduce((sum, d) => sum + (d.organic_orders / d.visitors * 100), 0) / dailyData.filter(d => d.visitors > 0).length).toFixed(2) : 0,
        totalAdSpend: dailyData.reduce((sum, d) => sum + (d.ad_spend || 0), 0),
        totalAdRevenue: dailyData.reduce((sum, d) => sum + (d.ad_revenue || 0), 0),
        avgROI: dailyData.filter(d => d.roi > 0).length > 0 ? (dailyData.filter(d => d.roi > 0).reduce((sum, d) => sum + parseFloat(d.roi), 0) / dailyData.filter(d => d.roi > 0).length).toFixed(2) : 0
      };
    };
    const summary = getSummary();

    return (
      <div style={{ ...styles.card, background: 'rgba(255,255,255,0.02)' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <MiniLogo size={20} color="#FF6B35" />
            <span style={{ fontSize: '14px', fontWeight: '700', color: '#E2E8F0' }}>7天数据追踪</span>
          </div>
          <div style={{ display: 'flex', gap: '20px', fontSize: '12px', color: '#94A3B8' }}>
            <span>累计订单 <strong style={{ color: '#10B981' }}>{summary.totalOrganic + summary.totalManual}</strong></span>
            <span>累计花费 <strong style={{ color: '#EF4444' }}>Rp {(summary.totalAdSpend/1000).toFixed(0)}k</strong></span>
            <span>累计收入 <strong style={{ color: '#10B981' }}>Rp {(summary.totalAdRevenue/1000).toFixed(0)}k</strong></span>
            <span>整体ROI <strong style={{ color: summary.avgROI >= 3 ? '#10B981' : '#F59E0B' }}>{summary.avgROI}</strong></span>
          </div>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', minWidth: '1300px' }}>
            <thead>
              <tr>
                {['阶段', '日期', '实际单', '补单', '曝光', '点击', '加购', '转化率', '广告曝光', '广告点击', 'CTR', '广告单', '广告转化', '花费', '收入', '设置ROI', '实际ROI', 'AI决策'].map((h, i) => (
                  <th key={i} style={{ padding: '14px 10px', textAlign: 'center', fontWeight: '600', color: '#64748B', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {dailyData.map((row) => {
                const isCurrentDay = row.day_number === currentDay;
                const cvr = row.visitors > 0 ? (row.organic_orders / row.visitors * 100).toFixed(2) : 0;
                const adCTR = row.ad_impressions > 0 ? (row.ad_clicks / row.ad_impressions * 100).toFixed(2) : 0;
                const adCVR = row.ad_clicks > 0 ? (row.ad_orders / row.ad_clicks * 100).toFixed(2) : 0;
                
                return (
                  <tr key={row.day_number} style={{ 
                    background: isCurrentDay ? 'rgba(255,107,53,0.08)' : 'transparent',
                    borderLeft: isCurrentDay ? '3px solid #FF6B35' : '3px solid transparent'
                  }}>
                    <td style={{ padding: '12px 10px', textAlign: 'center', fontWeight: '700', color: isCurrentDay ? '#FF6B35' : '#E2E8F0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      {isCurrentDay && <span style={{ marginRight: '4px' }}>▸</span>}Day {row.day_number}
                    </td>
                    <td style={{ padding: '12px 10px', textAlign: 'center', color: '#94A3B8', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>{new Date(row.date).toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' })}</td>
                    <td style={{ padding: '12px 10px', textAlign: 'center', color: '#10B981', fontWeight: '600', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>{row.organic_orders || '-'}</td>
                    <td style={{ padding: '12px 10px', textAlign: 'center', color: '#8B5CF6', fontWeight: '600', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>{row.manual_orders || '-'}</td>
                    <td style={{ padding: '12px 10px', textAlign: 'center', color: '#94A3B8', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>{row.visitors || '-'}</td>
                    <td style={{ padding: '12px 10px', textAlign: 'center', color: '#94A3B8', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>{row.clicks || '-'}</td>
                    <td style={{ padding: '12px 10px', textAlign: 'center', color: '#94A3B8', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>{row.add_to_cart || '-'}</td>
                    <td style={{ padding: '12px 10px', textAlign: 'center', color: '#10B981', fontWeight: '600', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>{cvr > 0 ? `${cvr}%` : '-'}</td>
                    <td style={{ padding: '12px 10px', textAlign: 'center', color: '#94A3B8', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>{row.ad_impressions?.toLocaleString() || '-'}</td>
                    <td style={{ padding: '12px 10px', textAlign: 'center', color: '#94A3B8', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>{row.ad_clicks || '-'}</td>
                    <td style={{ padding: '12px 10px', textAlign: 'center', color: '#94A3B8', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>{adCTR > 0 ? `${adCTR}%` : '-'}</td>
                    <td style={{ padding: '12px 10px', textAlign: 'center', color: '#F97316', fontWeight: '600', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>{row.ad_orders || '-'}</td>
                    <td style={{ padding: '12px 10px', textAlign: 'center', color: '#F97316', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>{adCVR > 0 ? `${adCVR}%` : '-'}</td>
                    <td style={{ padding: '12px 10px', textAlign: 'center', color: '#EF4444', fontWeight: '600', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>{row.ad_spend ? `Rp ${(row.ad_spend/1000).toFixed(0)}k` : '-'}</td>
                    <td style={{ padding: '12px 10px', textAlign: 'center', color: '#10B981', fontWeight: '600', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>{row.ad_revenue ? `Rp ${(row.ad_revenue/1000).toFixed(0)}k` : '-'}</td>
                    <td style={{ padding: '12px 10px', textAlign: 'center', color: '#94A3B8', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>{selectedProduct.target_roi || '-'}</td>
                    <td style={{ padding: '12px 10px', textAlign: 'center', fontWeight: '700', color: row.roi >= 3 ? '#10B981' : row.roi > 0 ? '#F59E0B' : '#64748B', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>{row.roi > 0 ? row.roi : '-'}</td>
                    <td style={{ padding: '12px 10px', textAlign: 'center', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      {row.ai_action ? (
                        <span style={{ padding: '5px 10px', borderRadius: '6px', fontSize: '10px', fontWeight: '600', background: row.status === '已执行' ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)', color: row.status === '已执行' ? '#10B981' : '#F59E0B', border: `1px solid ${row.status === '已执行' ? 'rgba(16,185,129,0.3)' : 'rgba(245,158,11,0.3)'}` }}>
                          {row.status === '已执行' ? '✓ ' : '→ '}{row.ai_action}
                        </span>
                      ) : <span style={{ color: '#475569' }}>-</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // =============== 渲染工作台 ===============
  const renderDashboard = () => {
    const getStats = () => {
      const myProducts = currentUser.role === 'admin' ? products : products.filter(p => p.owner_id === currentUser.id);
      return {
        total: myProducts.length,
        pending: myProducts.filter(p => p.status === '进行中').length,
        executed: myProducts.filter(p => p.status === '已完成').length,
        abnormal: myProducts.filter(p => p.status === '已暂停').length,
      };
    };
    const stats = getStats();

    return (
      <div>
        {/* 统计卡片 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
          {[
            { label: '管理产品', value: stats.total, icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>, color: '#E2E8F0' },
            { label: '进行中', value: stats.pending, icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>, color: '#3B82F6' },
            { label: '已完成', value: stats.executed, icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>, color: '#10B981' },
            { label: '已暂停', value: stats.abnormal, icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>, color: '#F59E0B' },
          ].map((item, i) => (
            <div key={i} style={{ ...styles.card, padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <span style={{ fontSize: '12px', color: '#64748B', fontWeight: '500' }}>{item.label}</span>
                {item.icon}
              </div>
              <div style={{ fontSize: '28px', fontWeight: '800', color: item.color, letterSpacing: '-1px' }}>{item.value}</div>
            </div>
          ))}
        </div>

        {/* 筛选栏 */}
        <div style={{ ...styles.card, padding: '14px 20px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '12px', color: '#64748B' }}>显示</span>
            {[{ value: 'mine', label: '我的产品' }, { value: 'all', label: '全部产品' }].map(opt => (
              <button key={opt.value} onClick={() => setFilterOwner(opt.value)} style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: filterOwner === opt.value ? 'linear-gradient(135deg, #FF6B35 0%, #F7931E 100%)' : 'rgba(255,255,255,0.05)', color: filterOwner === opt.value ? '#fff' : '#94A3B8', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>{opt.label}</button>
            ))}
          </div>
          <div style={{ width: '1px', height: '28px', background: 'rgba(255,255,255,0.1)' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '12px', color: '#64748B' }}>状态</span>
            {[
              { value: 'all', label: '全部', color: '#E2E8F0' }, 
              { value: '进行中', label: '进行中', color: '#3B82F6' }, 
              { value: '已完成', label: '已完成', color: '#10B981' }, 
              { value: '已暂停', label: '已暂停', color: '#F59E0B' }
            ].map(opt => (
              <button key={opt.value} onClick={() => setFilterStatus(opt.value)} style={{ padding: '8px 16px', borderRadius: '8px', border: filterStatus === opt.value ? `1px solid ${opt.color}` : '1px solid transparent', background: filterStatus === opt.value ? `${opt.color}15` : 'transparent', color: filterStatus === opt.value ? opt.color : '#64748B', fontSize: '12px', fontWeight: '500', cursor: 'pointer' }}>{opt.label}</button>
            ))}
          </div>
          <div style={{ flex: 1 }} />
          <button onClick={() => setShowNewProductModal(true)} style={{ ...styles.buttonPrimary, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            新建产品
          </button>
        </div>

        {/* 产品列表 */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: '#64748B' }}>加载中...</div>
        ) : products.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px', color: '#64748B' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.5 }}>📦</div>
            <p style={{ fontSize: '14px', marginBottom: '20px' }}>暂无产品，点击"新建产品"开始</p>
            <button onClick={() => setShowNewProductModal(true)} style={styles.buttonPrimary}>新建产品</button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
            {products.map(product => {
              const statusConfig = getStatusConfig(product.status);
              const phaseConfig = getPhaseConfig(product.phase);
              return (
                <div key={product.id} onClick={() => { loadProductDetail(product.id); setCurrentView('detail'); }} style={{ ...styles.card, cursor: 'pointer', position: 'relative', transition: 'all 0.3s ease' }}>
                  <div style={{ padding: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                      <div>
                        <div style={{ fontSize: '15px', fontWeight: '700', color: '#E2E8F0', marginBottom: '6px' }}>{product.name}</div>
                        <div style={{ fontSize: '12px', color: '#64748B' }}>SKU: {product.sku}</div>
                      </div>
                      <span style={{ padding: '6px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: '600', background: statusConfig.bg, color: statusConfig.color }}>
                        {statusConfig.icon} {statusConfig.label}
                      </span>
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        {[1,2,3,4,5,6,7].map(d => (
                          <div key={d} style={{ width: '24px', height: '6px', borderRadius: '3px', background: d < product.current_day ? '#10B981' : d === product.current_day ? '#FF6B35' : 'rgba(255,255,255,0.1)', boxShadow: d === product.current_day ? '0 0 8px rgba(255,107,53,0.5)' : 'none' }} />
                        ))}
                      </div>
                      <span style={{ fontSize: '12px', color: '#94A3B8', fontWeight: '500' }}>Day {product.current_day}/7</span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px' }}>{product.owner_avatar || '👤'}</div>
                        <span style={{ fontSize: '12px', color: '#94A3B8' }}>{product.owner_name || '未知'}</span>
                      </div>
                      <span style={{ fontSize: '11px', color: '#475569' }}>开始: {new Date(product.start_date).toLocaleDateString('zh-CN')}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  // =============== 渲染详情页 ===============
  const renderDetail = () => {
    if (!selectedProduct) return <div style={{ textAlign: 'center', padding: '60px', color: '#64748B' }}>加载中...</div>;
    
    const currentDay = selectedProduct.current_day || 1;
    const currentDayData = selectedProduct.daily_data?.find(d => d.day_number === currentDay);
    const dayStatus = getDayStatus(currentDayData);
    
    return (
      <div>
        {/* 警告条 */}
        {dayStatus.label === '未提交' && (
          <div style={{ background: 'linear-gradient(135deg, rgba(239,68,68,0.1) 0%, rgba(239,68,68,0.05) 100%)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '14px', padding: '16px 20px', marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ width: '40px', height: '40px', background: 'rgba(239,68,68,0.15)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
              </div>
              <div>
                <div style={{ fontSize: '14px', fontWeight: '700', color: '#EF4444' }}>Day {currentDay} 数据未提交</div>
                <div style={{ fontSize: '12px', color: '#F87171' }}>无数据 = 无判断 = <strong>自动停投保护</strong></div>
              </div>
            </div>
            <button onClick={() => setShowUploadModal(true)} style={styles.buttonPrimary}>立即上传数据</button>
          </div>
        )}
        
        {/* 操作栏 */}
        <div style={{ ...styles.card, padding: '14px 20px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={() => setShowUploadModal(true)} style={{ ...styles.buttonPrimary, background: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17,8 12,3 7,8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
            上传数据
          </button>
          <button style={styles.buttonSecondary}>结果回写</button>
          <div style={{ width: '1px', height: '32px', background: 'rgba(255,255,255,0.1)' }} />
          <div style={{ flex: 1, padding: '10px 16px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', fontSize: '13px', color: '#E2E8F0' }}>
            <span style={{ color: '#64748B' }}>SKU:</span> {selectedProduct.sku} · {selectedProduct.name}
          </div>
        </div>

        {/* 7天表格 */}
        <div style={{ marginBottom: '16px' }}>
          {render7DayTable()}
        </div>

        {/* AI决策面板 */}
        <div style={{ ...styles.card }}>
          <div style={{ background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '36px', height: '36px', background: 'linear-gradient(135deg, #FF6B35 0%, #F7931E 100%)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <MiniLogo size={20} color="#fff" />
              </div>
              <span style={{ fontSize: '14px', fontWeight: '700', color: '#E2E8F0' }}>Day {currentDay} AI决策</span>
            </div>
            {dayStatus.label === '待决策' && !isSubmitted && (
              <button onClick={() => setIsSubmitted(true)} style={styles.buttonPrimary}>生成决策</button>
            )}
          </div>
          <div style={{ padding: '20px' }}>
            {dayStatus.label === '未提交' ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '120px', color: '#64748B' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ width: '56px', height: '56px', background: 'rgba(100,116,139,0.1)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>
                  </div>
                  <p style={{ margin: 0, fontSize: '13px' }}>请先上传数据</p>
                </div>
              </div>
            ) : dayStatus.label === '已执行' || executionStatus === 'executed' ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '120px' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ width: '64px', height: '64px', background: 'rgba(16,185,129,0.15)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                  </div>
                  <div style={{ fontSize: '16px', fontWeight: '700', color: '#10B981' }}>已执行: {currentDayData?.ai_action || '维持观察'}</div>
                </div>
              </div>
            ) : isSubmitted ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px' }}>
                <div style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: '12px', padding: '16px' }}>
                  <div style={{ fontSize: '10px', color: '#64748B', marginBottom: '8px', textTransform: 'uppercase' }}>当前阶段</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ padding: '6px 14px', background: '#3B82F6', color: '#fff', borderRadius: '8px', fontSize: '13px', fontWeight: '700' }}>阶段 {currentDayData?.phase || 'A'}</span>
                  </div>
                </div>
                <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: '12px', padding: '16px' }}>
                  <div style={{ fontSize: '10px', color: '#64748B', marginBottom: '8px', textTransform: 'uppercase' }}>核心卡点</div>
                  <p style={{ margin: 0, fontSize: '12px', color: '#F59E0B', fontWeight: '500' }}>成交信号连续性不足</p>
                </div>
                <div style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: '12px', padding: '16px' }}>
                  <div style={{ fontSize: '10px', color: '#64748B', marginBottom: '8px', textTransform: 'uppercase' }}>补单策略</div>
                  <div style={{ fontSize: '12px', fontWeight: '600', color: '#8B5CF6' }}>建议注入1-2单</div>
                </div>
                <div style={{ gridColumn: 'span 3', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '14px', padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '10px', color: '#64748B', marginBottom: '8px', textTransform: 'uppercase' }}>今日判断</div>
                    <div style={{ fontSize: '28px', fontWeight: '800', color: '#10B981' }}>维持观察</div>
                    <div style={{ background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', borderRadius: '8px', padding: '10px 20px', marginTop: '12px', display: 'inline-block' }}>
                      <div style={{ fontSize: '13px', fontWeight: '700', color: '#fff' }}>预算维持，强化信号</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={() => handleExecute('维持观察', '数据稳定，继续观察', 70)} style={{ ...styles.buttonPrimary, background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', boxShadow: '0 4px 15px rgba(16,185,129,0.3)' }}>✓ 确认执行</button>
                    <button onClick={() => setShowAbnormalModal(true)} style={{ ...styles.buttonSecondary, border: '1px solid rgba(239,68,68,0.3)', color: '#EF4444' }}>上报异常</button>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '120px', color: '#64748B' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ width: '56px', height: '56px', background: 'rgba(255,107,53,0.1)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                    <MiniLogo size={28} color="#FF6B35" />
                  </div>
                  <p style={{ margin: 0, fontSize: '13px' }}>点击"生成决策" AI将按专家逻辑判断</p>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* 异常弹窗 */}
        {showAbnormalModal && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <div style={{ background: 'linear-gradient(180deg, #1E293B 0%, #0F172A 100%)', borderRadius: '20px', padding: '28px', width: '420px', border: '1px solid rgba(255,255,255,0.1)' }}>
              <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', color: '#E2E8F0', fontWeight: '700' }}>上报异常</h3>
              <textarea value={abnormalReason} onChange={(e) => setAbnormalReason(e.target.value)} placeholder="请说明异常原因..." style={{ width: '100%', height: '120px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '14px', fontSize: '14px', color: '#E2E8F0', resize: 'none', outline: 'none', boxSizing: 'border-box' }} />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
                <button onClick={() => setShowAbnormalModal(false)} style={styles.buttonSecondary}>取消</button>
                <button onClick={handleAbnormal} style={{ ...styles.buttonPrimary, background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)' }}>提交</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // =============== 主渲染 ===============
  return (
    <div style={styles.container}>
      {/* 顶部导航 */}
      <div style={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <GMVLogo size={44} />
            <div>
              <h1 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#E2E8F0' }}>Shopee GMV MAX</h1>
              <p style={{ margin: 0, fontSize: '11px', color: '#64748B' }}>AI决策中枢 · 系统博弈专家</p>
            </div>
          </div>
          {currentView === 'detail' && (
            <button onClick={() => { setCurrentView('dashboard'); setSelectedProduct(null); }} style={styles.buttonSecondary}>← 返回工作台</button>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ background: 'rgba(255,107,53,0.1)', border: '1px solid rgba(255,107,53,0.2)', borderRadius: '12px', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FF6B35" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            <div>
              <div style={{ fontSize: '10px', color: '#64748B' }}>数据截止</div>
              <div style={{ fontSize: '18px', fontWeight: '800', color: '#FF6B35', fontFamily: '"SF Mono", monospace' }}>{String(countdown.hours).padStart(2, '0')}:{String(countdown.minutes).padStart(2, '0')}:{String(countdown.seconds).padStart(2, '0')}</div>
            </div>
          </div>
          
          {selectedProduct && currentView === 'detail' && (
            <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '12px', padding: '10px 16px', border: '1px solid rgba(255,255,255,0.06)' }}>
              <span style={{ fontSize: '11px', color: '#64748B' }}>执行 </span>
              <span style={{ fontSize: '22px', fontWeight: '800', color: '#FF6B35' }}>Day {selectedProduct.current_day}</span>
              <span style={{ fontSize: '13px', color: '#475569' }}>/7</span>
            </div>
          )}
          
          <div style={{ position: 'relative' }}>
            <button onClick={() => setShowUserMenu(!showUserMenu)} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 14px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.03)', color: '#fff', cursor: 'pointer' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: `linear-gradient(135deg, ${currentUser.color}60, ${currentUser.color}30)`, border: `1px solid ${currentUser.color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>{currentUser.avatar}</div>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: '13px', fontWeight: '600' }}>{currentUser.name}</div>
                <div style={{ fontSize: '10px', color: '#64748B' }}>{currentUser.role === 'admin' ? '管理员' : '运营'}</div>
              </div>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
            </button>
            {showUserMenu && (
              <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: '8px', background: 'linear-gradient(180deg, #1E293B 0%, #0F172A 100%)', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 20px 60px rgba(0,0,0,0.5)', padding: '10px', minWidth: '220px', zIndex: 1000 }}>
                <div style={{ padding: '10px 14px', fontSize: '11px', color: '#64748B', borderBottom: '1px solid rgba(255,255,255,0.06)', marginBottom: '8px' }}>切换用户</div>
                {users.map(user => (
                  <button key={user.id} onClick={() => { setCurrentUser(user); setShowUserMenu(false); setFilterOwner('mine'); }} style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%', padding: '12px 14px', borderRadius: '10px', border: 'none', background: currentUser.id === user.id ? 'rgba(255,107,53,0.1)' : 'transparent', cursor: 'pointer', textAlign: 'left' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: `linear-gradient(135deg, ${user.color}50, ${user.color}20)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>{user.avatar}</div>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: '600', color: '#E2E8F0' }}>{user.name}</div>
                      <div style={{ fontSize: '10px', color: '#64748B' }}>{user.role === 'admin' ? '管理员' : '运营'}</div>
                    </div>
                    {currentUser.id === user.id && <span style={{ marginLeft: 'auto', color: '#FF6B35' }}>✓</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div style={styles.content}>
        {currentView === 'dashboard' && renderDashboard()}
        {currentView === 'detail' && renderDetail()}
      </div>
      
      {showNewProductModal && renderNewProductModal()}
      {showUploadModal && renderUploadModal()}
      {showUserMenu && <div onClick={() => setShowUserMenu(false)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 99 }} />}
    </div>
  );
};

export default GMVMaxWorkspace;
