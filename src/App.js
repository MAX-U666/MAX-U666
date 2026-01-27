import React, { useState, useEffect, useRef } from 'react';

// 自定义Logo组件 - 替代emoji
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
        <feMerge>
          <feMergeNode in="coloredBlur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    </defs>
    <rect width="48" height="48" rx="12" fill="url(#logoGrad)"/>
    <g filter="url(#glow)">
      {/* 抽象的上升曲线 - 代表增长 */}
      <path d="M12 32 Q18 28, 24 24 Q30 20, 36 14" stroke="white" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.9"/>
      <path d="M12 36 Q20 30, 28 26 Q34 23, 38 20" stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.6"/>
      {/* 顶部光点 */}
      <circle cx="36" cy="14" r="3" fill="white"/>
    </g>
  </svg>
);

// 小型Logo用于卡片等
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
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterOwner, setFilterOwner] = useState('mine');
  
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [executionStatus, setExecutionStatus] = useState(null);
  const [showAbnormalModal, setShowAbnormalModal] = useState(false);
  const [abnormalReason, setAbnormalReason] = useState('');
  const [countdown, setCountdown] = useState({ hours: 2, minutes: 10, seconds: 23 });

  // 上传解析状态
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadType, setUploadType] = useState('shop');
  const [parsedData, setParsedData] = useState(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState('');
  const [selectedDayNumber, setSelectedDayNumber] = useState(1);
  const fileInputRef = useRef(null);

  const API_BASE = '/api';

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

  const users = [
    { id: 1, name: '张三', role: 'operator', avatar: '👨‍💼', color: '#3b82f6' },
    { id: 2, name: '李四', role: 'operator', avatar: '👩‍💼', color: '#8b5cf6' },
    { id: 3, name: '王五', role: 'operator', avatar: '👨‍💻', color: '#10b981' },
    { id: 4, name: '赵六', role: 'operator', avatar: '👩‍💻', color: '#f59e0b' },
    { id: 5, name: '陈七', role: 'operator', avatar: '👨‍🔧', color: '#ef4444' },
    { id: 0, name: '老板', role: 'admin', avatar: '👑', color: '#1e293b' }
  ];

  const [products] = useState([
    { id: 1, sku: '28835563535', name: 'Pelumas Wanita Dingin 15ml', price: 78900, owner: 1, currentDay: 3, phase: 'B', status: 'pending', roi: 3.01, todaySpend: 157078, todayOrders: 6, needsAction: true, lastUpdate: '10:30' },
    { id: 2, sku: '50952535261', name: 'Sabun Mandi Pemutih Badan', price: 65000, owner: 1, currentDay: 5, phase: 'C', status: 'executed', roi: 4.2, todaySpend: 89000, todayOrders: 8, needsAction: false, lastUpdate: '09:45' },
  ]);

  const historyData = [
    { day: 1, date: '12/16', organicOrders: 1, manualOrders: 0, impressions: 64, clicks: 4, atc: 13, cvr: 0.25, adImpressions: 3051, adClicks: 34, adCTR: 1.1, adOrders: 0, adCVR: 0, adSpend: 49000, adRevenue: 0, targetROI: '自动竞价4.5→3.2', actualROI: 0, aiDecision: '降低竞价观察', aiStatus: 'executed' },
    { day: 2, date: '12/17', organicOrders: 1, manualOrders: 2, impressions: 149, clicks: 18, atc: 22, cvr: 5.56, adImpressions: 4899, adClicks: 78, adCTR: 1.6, adOrders: 3, adCVR: 3.85, adSpend: 70000, adRevenue: 237000, targetROI: 4.5, actualROI: 3.37, aiDecision: '预算维持', aiStatus: 'executed' },
    { day: 3, date: '12/18', organicOrders: 5, manualOrders: 3, impressions: 175, clicks: 31, atc: 29, cvr: 16.13, adImpressions: 4505, adClicks: 113, adCTR: 2.5, adOrders: 6, adCVR: 5.31, adSpend: 157000, adRevenue: 473000, targetROI: 4.5, actualROI: 3.01, aiDecision: null, aiStatus: 'pending' },
    { day: 4, date: '12/19', organicOrders: null, manualOrders: null, impressions: null, clicks: null, atc: null, cvr: null, adImpressions: null, adClicks: null, adCTR: null, adOrders: null, adCVR: null, adSpend: null, adRevenue: null, targetROI: null, actualROI: null, aiDecision: null, aiStatus: null },
    { day: 5, date: '12/20', organicOrders: null, manualOrders: null, impressions: null, clicks: null, atc: null, cvr: null, adImpressions: null, adClicks: null, adCTR: null, adOrders: null, adCVR: null, adSpend: null, adRevenue: null, targetROI: null, actualROI: null, aiDecision: null, aiStatus: null },
    { day: 6, date: '12/21', organicOrders: null, manualOrders: null, impressions: null, clicks: null, atc: null, cvr: null, adImpressions: null, adClicks: null, adCTR: null, adOrders: null, adCVR: null, adSpend: null, adRevenue: null, targetROI: null, actualROI: null, aiDecision: null, aiStatus: null },
    { day: 7, date: '12/22', organicOrders: null, manualOrders: null, impressions: null, clicks: null, atc: null, cvr: null, adImpressions: null, adClicks: null, adCTR: null, adOrders: null, adCVR: null, adSpend: null, adRevenue: null, targetROI: null, actualROI: null, aiDecision: null, aiStatus: null },
  ];

  const getSummary = () => {
    const validData = historyData.filter(d => d.organicOrders !== null);
    return {
      totalOrganic: validData.reduce((sum, d) => sum + (d.organicOrders || 0), 0),
      totalManual: validData.reduce((sum, d) => sum + (d.manualOrders || 0), 0),
      totalImpressions: validData.reduce((sum, d) => sum + (d.impressions || 0), 0),
      totalClicks: validData.reduce((sum, d) => sum + (d.clicks || 0), 0),
      avgCVR: validData.length > 0 ? (validData.reduce((sum, d) => sum + (d.cvr || 0), 0) / validData.length).toFixed(2) : 0,
      totalAdSpend: validData.reduce((sum, d) => sum + (d.adSpend || 0), 0),
      totalAdRevenue: validData.reduce((sum, d) => sum + (d.adRevenue || 0), 0),
      avgROI: validData.filter(d => d.actualROI > 0).length > 0 
        ? (validData.filter(d => d.actualROI > 0).reduce((sum, d) => sum + d.actualROI, 0) / validData.filter(d => d.actualROI > 0).length).toFixed(2) 
        : 0
    };
  };

  const summary = getSummary();

  const getStats = () => {
    const myProducts = currentUser.role === 'admin' ? products : products.filter(p => p.owner === currentUser.id);
    return {
      total: myProducts.length,
      pending: myProducts.filter(p => p.status === 'pending').length,
      executed: myProducts.filter(p => p.status === 'executed').length,
      abnormal: myProducts.filter(p => p.status === 'abnormal').length,
      nodata: myProducts.filter(p => p.status === 'nodata').length,
      totalSpend: myProducts.reduce((sum, p) => sum + (p.todaySpend || 0), 0),
      totalOrders: myProducts.reduce((sum, p) => sum + (p.todayOrders || 0), 0),
    };
  };

  const stats = getStats();

  const getFilteredProducts = () => {
    let filtered = products;
    if (filterOwner === 'mine' && currentUser.role !== 'admin') filtered = filtered.filter(p => p.owner === currentUser.id);
    if (filterStatus !== 'all') filtered = filtered.filter(p => p.status === filterStatus);
    return filtered;
  };

  const getStatusConfig = (status) => {
    const configs = {
      pending: { label: '待决策', color: '#F59E0B', bg: 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)', icon: '◐' },
      executed: { label: '已执行', color: '#10B981', bg: 'linear-gradient(135deg, #D1FAE5 0%, #A7F3D0 100%)', icon: '✓' },
      abnormal: { label: '异常', color: '#EF4444', bg: 'linear-gradient(135deg, #FEE2E2 0%, #FECACA 100%)', icon: '!' },
      nodata: { label: '未提交', color: '#6B7280', bg: 'linear-gradient(135deg, #F3F4F6 0%, #E5E7EB 100%)', icon: '○' }
    };
    return configs[status] || configs.pending;
  };

  const getPhaseConfig = (phase) => {
    const configs = {
      A: { label: '样本不足期', color: '#F59E0B', bg: '#FEF3C7' },
      B: { label: '放量观察期', color: '#3B82F6', bg: '#DBEAFE' },
      C: { label: '放量确认期', color: '#10B981', bg: '#D1FAE5' }
    };
    return configs[phase] || { label: '-', color: '#6B7280', bg: '#F3F4F6' };
  };

  const getOwner = (ownerId) => users.find(u => u.id === ownerId);

  const openProductDetail = (product) => {
    setSelectedProduct(product);
    setCurrentView('detail');
    setIsSubmitted(false);
    setExecutionStatus(null);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setUploadLoading(true);
    setUploadMessage('');
    setParsedData(null);
    
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const response = await fetch(`${API_BASE}/upload-excel`, {
        method: 'POST',
        body: formData
      });
      
      const result = await response.json();
      
      if (result.success) {
        setParsedData(result.products);
        setUploadMessage(`解析成功，共 ${result.products.length} 个产品`);
      } else {
        setUploadMessage(`解析失败: ${result.error}`);
      }
    } catch (err) {
      setUploadMessage(`网络错误: ${err.message}`);
    }
    
    setUploadLoading(false);
    e.target.value = '';
  };

  const handleSaveParsedData = async () => {
    if (!parsedData || parsedData.length === 0) return;
    
    setUploadLoading(true);
    const today = new Date().toISOString().split('T')[0];
    
    try {
      const response = await fetch(`${API_BASE}/save-parsed-data`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          products: parsedData,
          day_number: selectedDayNumber,
          date: today
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        setUploadMessage(`保存成功！已保存 ${result.saved}/${result.total} 条`);
        setTimeout(() => {
          setShowUploadModal(false);
          setParsedData(null);
          setUploadMessage('');
        }, 2000);
      } else {
        setUploadMessage(`保存失败: ${result.error}`);
      }
    } catch (err) {
      setUploadMessage(`网络错误: ${err.message}`);
    }
    
    setUploadLoading(false);
  };

  // =============== 全局样式 ===============
  const styles = {
    // 主容器
    container: {
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #0F172A 0%, #1E293B 100%)',
      fontFamily: '"SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    },
    // 顶部导航
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
    // 内容区
    content: {
      padding: '24px 32px',
      maxWidth: '1600px',
      margin: '0 auto',
    },
    // 卡片基础样式
    card: {
      background: 'rgba(255,255,255,0.03)',
      backdropFilter: 'blur(10px)',
      border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: '16px',
      overflow: 'hidden',
    },
    // 按钮基础样式
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

  // =============== 渲染上传弹窗 ===============
  const renderUploadModal = () => (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ background: 'linear-gradient(180deg, #1E293B 0%, #0F172A 100%)', borderRadius: '24px', width: '800px', maxHeight: '90vh', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 25px 80px rgba(0,0,0,0.5)' }}>
        <div style={{ background: 'linear-gradient(135deg, #FF6B35 0%, #F7931E 100%)', padding: '24px 28px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <MiniLogo size={28} color="#fff" />
          <div>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#fff', letterSpacing: '-0.3px' }}>上传数据</h3>
            <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'rgba(255,255,255,0.8)' }}>支持 Excel (.xlsx) 格式</p>
          </div>
        </div>
        
        <div style={{ padding: '28px', maxHeight: '60vh', overflowY: 'auto' }}>
          <div style={{ marginBottom: '24px' }}>
            <label style={{ fontSize: '13px', fontWeight: '600', color: '#E2E8F0', display: 'block', marginBottom: '12px' }}>选择对应的 Day</label>
            <div style={{ display: 'flex', gap: '10px' }}>
              {[1,2,3,4,5,6,7].map(d => (
                <button
                  key={d}
                  onClick={() => setSelectedDayNumber(d)}
                  style={{
                    width: '48px', height: '48px', borderRadius: '12px',
                    border: selectedDayNumber === d ? '2px solid #FF6B35' : '1px solid rgba(255,255,255,0.1)',
                    background: selectedDayNumber === d ? 'rgba(255,107,53,0.15)' : 'rgba(255,255,255,0.03)',
                    color: selectedDayNumber === d ? '#FF6B35' : '#64748B',
                    fontSize: '16px', fontWeight: '700', cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
          
          <div 
            onClick={() => fileInputRef.current?.click()}
            style={{ 
              border: '2px dashed rgba(255,255,255,0.15)', 
              borderRadius: '16px', 
              padding: '48px', 
              textAlign: 'center',
              cursor: 'pointer',
              background: 'rgba(255,255,255,0.02)',
              transition: 'all 0.3s ease'
            }}
          >
            <input 
              ref={fileInputRef}
              type="file" 
              accept=".xlsx,.xls" 
              onChange={handleFileUpload}
              style={{ display: 'none' }}
            />
            <div style={{ width: '64px', height: '64px', background: 'rgba(255,107,53,0.1)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#FF6B35" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="17,8 12,3 7,8"/>
                <line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
            </div>
            <div style={{ fontSize: '15px', fontWeight: '600', color: '#E2E8F0', marginBottom: '8px' }}>
              {uploadLoading ? '解析中...' : '点击上传文件'}
            </div>
            <div style={{ fontSize: '13px', color: '#64748B' }}>或拖拽文件到此处</div>
          </div>
          
          {uploadMessage && (
            <div style={{ 
              marginTop: '20px', 
              padding: '14px 18px', 
              borderRadius: '12px', 
              background: uploadMessage.includes('成功') ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', 
              border: `1px solid ${uploadMessage.includes('成功') ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
              color: uploadMessage.includes('成功') ? '#10B981' : '#EF4444', 
              fontSize: '13px',
              fontWeight: '500'
            }}>
              {uploadMessage}
            </div>
          )}
          
          {parsedData && parsedData.length > 0 && (
            <div style={{ marginTop: '24px' }}>
              <div style={{ fontSize: '13px', fontWeight: '600', color: '#E2E8F0', marginBottom: '14px' }}>
                解析结果 · {parsedData.length} 个产品
              </div>
              <div style={{ maxHeight: '280px', overflowY: 'auto', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                  <thead>
                    <tr style={{ background: 'rgba(255,255,255,0.05)' }}>
                      <th style={{ padding: '12px 10px', textAlign: 'left', color: '#94A3B8', fontWeight: '600', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>产品ID</th>
                      <th style={{ padding: '12px 10px', textAlign: 'left', color: '#94A3B8', fontWeight: '600', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>名称</th>
                      <th style={{ padding: '12px 10px', textAlign: 'center', color: '#10B981', fontWeight: '600', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>订单</th>
                      <th style={{ padding: '12px 10px', textAlign: 'center', color: '#EF4444', fontWeight: '600', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>花费</th>
                      <th style={{ padding: '12px 10px', textAlign: 'center', color: '#3B82F6', fontWeight: '600', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>ROI</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedData.slice(0, 15).map((p, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <td style={{ padding: '10px', color: '#94A3B8', fontFamily: 'SF Mono, monospace' }}>{p.product_id?.slice(-8)}</td>
                        <td style={{ padding: '10px', color: '#E2E8F0', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.product_name || '-'}</td>
                        <td style={{ padding: '10px', textAlign: 'center', color: '#10B981', fontWeight: '700' }}>{p.orders || 0}</td>
                        <td style={{ padding: '10px', textAlign: 'center', color: '#EF4444' }}>Rp{((p.ad_spend || 0)/1000).toFixed(0)}k</td>
                        <td style={{ padding: '10px', textAlign: 'center', fontWeight: '700', color: p.ad_roi >= 3 ? '#10B981' : '#F59E0B' }}>{p.ad_roi?.toFixed(2) || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
        
        <div style={{ padding: '20px 28px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '12px', color: '#64748B' }}>数据将保存到 Day {selectedDayNumber}</span>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button onClick={() => { setShowUploadModal(false); setParsedData(null); setUploadMessage(''); }} style={styles.buttonSecondary}>取消</button>
            <button 
              onClick={handleSaveParsedData} 
              disabled={!parsedData || parsedData.length === 0 || uploadLoading}
              style={{ 
                ...styles.buttonPrimary,
                opacity: (!parsedData || parsedData.length === 0) ? 0.5 : 1,
                cursor: (!parsedData || parsedData.length === 0) ? 'not-allowed' : 'pointer'
              }}
            >
              {uploadLoading ? '保存中...' : `保存 (${parsedData?.length || 0}条)`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // =============== 渲染7天表格 ===============
  const render7DayTable = () => {
    const currentDay = selectedProduct?.currentDay || 3;
    return (
      <div style={{ ...styles.card, background: 'rgba(255,255,255,0.02)' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <MiniLogo size={20} color="#FF6B35" />
            <span style={{ fontSize: '14px', fontWeight: '700', color: '#E2E8F0', letterSpacing: '-0.3px' }}>7天数据追踪</span>
          </div>
          <div style={{ display: 'flex', gap: '20px', fontSize: '12px', color: '#94A3B8' }}>
            <span>累计订单 <strong style={{ color: '#10B981' }}>{summary.totalOrganic + summary.totalManual}</strong></span>
            <span>累计花费 <strong style={{ color: '#EF4444' }}>Rp {(summary.totalAdSpend/1000).toFixed(0)}k</strong></span>
            <span>整体ROI <strong style={{ color: summary.avgROI >= 3 ? '#10B981' : '#F59E0B' }}>{summary.avgROI}</strong></span>
          </div>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', minWidth: '1200px' }}>
            <thead>
              <tr>
                {['阶段', '日期', '实际单', '补单', '曝光', '点击', '加购', '转化率', '广告曝光', '广告点击', 'CTR', '广告单', '广告转化', '花费', '收入', '设置ROI', '实际ROI', 'AI决策'].map((h, i) => (
                  <th key={i} style={{ padding: '14px 10px', textAlign: 'center', fontWeight: '600', color: '#64748B', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {historyData.map((row) => (
                <tr key={row.day} style={{ 
                  background: row.day === currentDay ? 'rgba(255,107,53,0.08)' : 'transparent',
                  borderLeft: row.day === currentDay ? '3px solid #FF6B35' : '3px solid transparent'
                }}>
                  <td style={{ padding: '12px 10px', textAlign: 'center', fontWeight: '700', color: row.day === currentDay ? '#FF6B35' : '#E2E8F0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    {row.day === currentDay && <span style={{ marginRight: '4px' }}>▸</span>}Day {row.day}
                  </td>
                  <td style={{ padding: '12px 10px', textAlign: 'center', color: '#94A3B8', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>{row.date}</td>
                  <td style={{ padding: '12px 10px', textAlign: 'center', color: '#10B981', fontWeight: '600', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>{row.organicOrders ?? '-'}</td>
                  <td style={{ padding: '12px 10px', textAlign: 'center', color: '#8B5CF6', fontWeight: '600', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>{row.manualOrders ?? '-'}</td>
                  <td style={{ padding: '12px 10px', textAlign: 'center', color: '#94A3B8', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>{row.impressions ?? '-'}</td>
                  <td style={{ padding: '12px 10px', textAlign: 'center', color: '#94A3B8', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>{row.clicks ?? '-'}</td>
                  <td style={{ padding: '12px 10px', textAlign: 'center', color: '#94A3B8', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>{row.atc ?? '-'}</td>
                  <td style={{ padding: '12px 10px', textAlign: 'center', color: '#10B981', fontWeight: '600', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>{row.cvr ? `${row.cvr}%` : '-'}</td>
                  <td style={{ padding: '12px 10px', textAlign: 'center', color: '#94A3B8', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>{row.adImpressions?.toLocaleString() ?? '-'}</td>
                  <td style={{ padding: '12px 10px', textAlign: 'center', color: '#94A3B8', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>{row.adClicks ?? '-'}</td>
                  <td style={{ padding: '12px 10px', textAlign: 'center', color: '#94A3B8', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>{row.adCTR ? `${row.adCTR}%` : '-'}</td>
                  <td style={{ padding: '12px 10px', textAlign: 'center', color: '#F97316', fontWeight: '600', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>{row.adOrders ?? '-'}</td>
                  <td style={{ padding: '12px 10px', textAlign: 'center', color: '#F97316', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>{row.adCVR ? `${row.adCVR}%` : '-'}</td>
                  <td style={{ padding: '12px 10px', textAlign: 'center', color: '#EF4444', fontWeight: '600', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>{row.adSpend ? `Rp ${(row.adSpend/1000).toFixed(0)}k` : '-'}</td>
                  <td style={{ padding: '12px 10px', textAlign: 'center', color: '#10B981', fontWeight: '600', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>{row.adRevenue ? `Rp ${(row.adRevenue/1000).toFixed(0)}k` : '-'}</td>
                  <td style={{ padding: '12px 10px', textAlign: 'center', color: '#94A3B8', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>{row.targetROI ?? '-'}</td>
                  <td style={{ padding: '12px 10px', textAlign: 'center', fontWeight: '700', color: row.actualROI >= 3 ? '#10B981' : row.actualROI > 0 ? '#F59E0B' : '#EF4444', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>{row.actualROI || '-'}</td>
                  <td style={{ padding: '12px 10px', textAlign: 'center', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    {row.aiDecision ? (
                      <span style={{ 
                        padding: '5px 10px', 
                        borderRadius: '6px', 
                        fontSize: '10px', 
                        fontWeight: '600', 
                        background: row.aiStatus === 'executed' ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)', 
                        color: row.aiStatus === 'executed' ? '#10B981' : '#F59E0B',
                        border: `1px solid ${row.aiStatus === 'executed' ? 'rgba(16,185,129,0.3)' : 'rgba(245,158,11,0.3)'}`
                      }}>
                        {row.aiStatus === 'executed' ? '✓ ' : '→ '}{row.aiDecision}
                      </span>
                    ) : <span style={{ color: '#475569' }}>-</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // =============== 渲染工作台 ===============
  const renderDashboard = () => (
    <div>
      {/* 统计卡片 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '16px', marginBottom: '24px' }}>
        {[
          { label: '管理产品', value: stats.total, icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>, color: '#E2E8F0' },
          { label: '待决策', value: stats.pending, icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>, color: '#F59E0B' },
          { label: '已执行', value: stats.executed, icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>, color: '#10B981' },
          { label: '异常中', value: stats.abnormal, icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>, color: '#EF4444' },
          { label: '今日花费', value: `Rp${(stats.totalSpend/1000).toFixed(0)}k`, icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F97316" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/><path d="M12 18V6"/></svg>, color: '#F97316' },
          { label: '今日订单', value: stats.totalOrders, icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>, color: '#10B981' }
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
            <button key={opt.value} onClick={() => setFilterOwner(opt.value)} style={{ 
              padding: '8px 16px', 
              borderRadius: '8px', 
              border: 'none', 
              background: filterOwner === opt.value ? 'linear-gradient(135deg, #FF6B35 0%, #F7931E 100%)' : 'rgba(255,255,255,0.05)', 
              color: filterOwner === opt.value ? '#fff' : '#94A3B8', 
              fontSize: '12px', 
              fontWeight: '600', 
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}>{opt.label}</button>
          ))}
        </div>
        <div style={{ width: '1px', height: '28px', background: 'rgba(255,255,255,0.1)' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '12px', color: '#64748B' }}>状态</span>
          {[
            { value: 'all', label: '全部', color: '#E2E8F0' }, 
            { value: 'pending', label: '待决策', color: '#F59E0B' }, 
            { value: 'executed', label: '已执行', color: '#10B981' }, 
            { value: 'abnormal', label: '异常', color: '#EF4444' }, 
            { value: 'nodata', label: '未提交', color: '#6B7280' }
          ].map(opt => (
            <button key={opt.value} onClick={() => setFilterStatus(opt.value)} style={{ 
              padding: '8px 16px', 
              borderRadius: '8px', 
              border: filterStatus === opt.value ? `1px solid ${opt.color}` : '1px solid transparent', 
              background: filterStatus === opt.value ? `${opt.color}15` : 'transparent', 
              color: filterStatus === opt.value ? opt.color : '#64748B', 
              fontSize: '12px', 
              fontWeight: '500', 
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}>{opt.label}</button>
          ))}
        </div>
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: '12px', color: '#475569' }}>共 {getFilteredProducts().length} 个产品</span>
      </div>

      {/* 产品卡片 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
        {getFilteredProducts().map(product => {
          const statusConfig = getStatusConfig(product.status);
          const phaseConfig = getPhaseConfig(product.phase);
          const owner = getOwner(product.owner);
          return (
            <div key={product.id} onClick={() => openProductDetail(product)} style={{ 
              ...styles.card, 
              cursor: 'pointer', 
              position: 'relative',
              border: product.needsAction ? '1px solid rgba(245,158,11,0.4)' : '1px solid rgba(255,255,255,0.06)',
              transition: 'all 0.3s ease'
            }}>
              {product.needsAction && (
                <div style={{ 
                  position: 'absolute', 
                  top: '16px', 
                  right: '16px', 
                  width: '10px', 
                  height: '10px', 
                  background: '#EF4444', 
                  borderRadius: '50%',
                  boxShadow: '0 0 12px rgba(239,68,68,0.6)',
                  animation: 'pulse 2s infinite'
                }} />
              )}
              <div style={{ padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                  <div>
                    <div style={{ fontSize: '15px', fontWeight: '700', color: '#E2E8F0', marginBottom: '6px', letterSpacing: '-0.3px' }}>{product.name}</div>
                    <div style={{ fontSize: '12px', color: '#64748B' }}>SKU: {product.sku.slice(-6)} · Rp{product.price.toLocaleString()}</div>
                  </div>
                  <span style={{ 
                    padding: '6px 12px', 
                    borderRadius: '8px', 
                    fontSize: '11px', 
                    fontWeight: '600', 
                    background: statusConfig.bg, 
                    color: statusConfig.color 
                  }}>
                    {statusConfig.icon} {statusConfig.label}
                  </span>
                </div>
                
                {/* 进度条 */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {[1,2,3,4,5,6,7].map(d => (
                      <div key={d} style={{ 
                        width: '24px', 
                        height: '6px', 
                        borderRadius: '3px', 
                        background: d < product.currentDay ? '#10B981' : d === product.currentDay ? '#FF6B35' : 'rgba(255,255,255,0.1)',
                        boxShadow: d === product.currentDay ? '0 0 8px rgba(255,107,53,0.5)' : 'none'
                      }} />
                    ))}
                  </div>
                  <span style={{ fontSize: '12px', color: '#94A3B8', fontWeight: '500' }}>Day {product.currentDay}/7</span>
                  {product.phase && (
                    <span style={{ 
                      padding: '4px 10px', 
                      borderRadius: '6px', 
                      fontSize: '10px', 
                      fontWeight: '600', 
                      background: phaseConfig.bg, 
                      color: phaseConfig.color 
                    }}>{phaseConfig.label}</span>
                  )}
                </div>

                {/* 数据行 */}
                <div style={{ display: 'flex', gap: '24px', padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', marginBottom: '16px' }}>
                  <div>
                    <div style={{ fontSize: '10px', color: '#64748B', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>ROI</div>
                    <div style={{ fontSize: '22px', fontWeight: '800', color: product.roi >= 3 ? '#10B981' : product.roi > 0 ? '#F59E0B' : '#EF4444', letterSpacing: '-0.5px' }}>{product.roi ?? '-'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '10px', color: '#64748B', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>花费</div>
                    <div style={{ fontSize: '16px', fontWeight: '700', color: '#EF4444' }}>Rp{(product.todaySpend/1000).toFixed(0)}k</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '10px', color: '#64748B', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>订单</div>
                    <div style={{ fontSize: '16px', fontWeight: '700', color: '#10B981' }}>{product.todayOrders}</div>
                  </div>
                </div>

                {/* 底部 */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ 
                      width: '28px', 
                      height: '28px', 
                      borderRadius: '8px', 
                      background: `linear-gradient(135deg, ${owner?.color}40, ${owner?.color}20)`,
                      border: `1px solid ${owner?.color}30`,
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      fontSize: '13px' 
                    }}>{owner?.avatar}</div>
                    <span style={{ fontSize: '12px', color: '#94A3B8' }}>{owner?.name}</span>
                  </div>
                  <span style={{ fontSize: '11px', color: '#475569' }}>{product.lastUpdate ? `更新于 ${product.lastUpdate}` : '暂无'}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <style>{`@keyframes pulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.5; transform: scale(0.9); } }`}</style>
    </div>
  );

  // =============== 渲染详情页 ===============
  const renderDetail = () => {
    if (!selectedProduct) return null;
    const currentDay = selectedProduct.currentDay;
    return (
      <div>
        {/* 警告条 */}
        <div style={{ 
          background: 'linear-gradient(135deg, rgba(239,68,68,0.1) 0%, rgba(239,68,68,0.05) 100%)', 
          border: '1px solid rgba(239,68,68,0.2)', 
          borderRadius: '14px', 
          padding: '16px 20px', 
          marginBottom: '16px', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between' 
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: '40px', height: '40px', background: 'rgba(239,68,68,0.15)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
            </div>
            <div>
              <div style={{ fontSize: '14px', fontWeight: '700', color: '#EF4444' }}>数据未提交</div>
              <div style={{ fontSize: '12px', color: '#F87171' }}>无数据 = 无判断 = <strong>自动停投保护</strong></div>
            </div>
          </div>
          <button onClick={() => setShowUploadModal(true)} style={styles.buttonPrimary}>
            立即录入数据
          </button>
        </div>
        
        {/* 操作栏 */}
        <div style={{ ...styles.card, padding: '14px 20px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={() => setShowUploadModal(true)} style={{ 
            ...styles.buttonPrimary, 
            background: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)',
            display: 'flex', alignItems: 'center', gap: '8px'
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="17,8 12,3 7,8"/>
              <line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
            上传店铺数据
          </button>
          <button onClick={() => setShowUploadModal(true)} style={{ 
            ...styles.buttonPrimary, 
            background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
            display: 'flex', alignItems: 'center', gap: '8px'
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="22,12 18,12 15,21 9,3 6,12 2,12"/>
            </svg>
            上传广告数据
          </button>
          <button style={styles.buttonSecondary}>结果回写</button>
          <div style={{ width: '1px', height: '32px', background: 'rgba(255,255,255,0.1)' }} />
          <div style={{ flex: 1, padding: '10px 16px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', fontSize: '13px', color: '#E2E8F0' }}>
            <span style={{ color: '#64748B' }}>SKU:</span> {selectedProduct.sku.slice(-6)} · {selectedProduct.name}
          </div>
        </div>

        {/* 7天表格 */}
        <div style={{ marginBottom: '16px' }}>
          {render7DayTable()}
        </div>

        {/* AI决策面板 */}
        <div style={{ ...styles.card }}>
          <div style={{ 
            background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)', 
            padding: '16px 20px', 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            borderBottom: '1px solid rgba(255,255,255,0.06)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '36px', height: '36px', background: 'linear-gradient(135deg, #FF6B35 0%, #F7931E 100%)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <MiniLogo size={20} color="#fff" />
              </div>
              <span style={{ fontSize: '14px', fontWeight: '700', color: '#E2E8F0' }}>Day {currentDay} GMV MAX 专家决策</span>
            </div>
            {!isSubmitted && (
              <button onClick={() => setIsSubmitted(true)} style={styles.buttonPrimary}>
                生成决策
              </button>
            )}
          </div>
          <div style={{ padding: '20px' }}>
            {isSubmitted ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px' }}>
                <div style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: '12px', padding: '16px' }}>
                  <div style={{ fontSize: '10px', color: '#64748B', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>当前阶段</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ padding: '6px 14px', background: '#3B82F6', color: '#fff', borderRadius: '8px', fontSize: '13px', fontWeight: '700' }}>阶段 B</span>
                    <span style={{ fontSize: '12px', fontWeight: '600', color: '#3B82F6' }}>放量观察期</span>
                  </div>
                </div>
                <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: '12px', padding: '16px' }}>
                  <div style={{ fontSize: '10px', color: '#64748B', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>核心卡点</div>
                  <p style={{ margin: 0, fontSize: '12px', color: '#F59E0B', fontWeight: '500', lineHeight: 1.5 }}>成交信号连续性不足，系统等待更多"稳定成交"证据</p>
                </div>
                <div style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: '12px', padding: '16px' }}>
                  <div style={{ fontSize: '10px', color: '#64748B', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>补单策略</div>
                  <div style={{ fontSize: '12px', fontWeight: '600', color: '#8B5CF6', lineHeight: 1.5 }}>建议自然时段注入1-2单成交信号</div>
                </div>
                <div style={{ gridColumn: 'span 3', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '14px', padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '10px', color: '#64748B', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>今日判断</div>
                    <div style={{ fontSize: '28px', fontWeight: '800', color: '#10B981', letterSpacing: '-1px' }}>维持观察</div>
                    <div style={{ 
                      background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', 
                      borderRadius: '8px', 
                      padding: '10px 20px', 
                      marginTop: '12px', 
                      display: 'inline-block' 
                    }}>
                      <div style={{ fontSize: '13px', fontWeight: '700', color: '#fff' }}>预算维持，强化信号</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={() => setExecutionStatus('executed')} style={{ 
                      ...styles.buttonPrimary, 
                      background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                      boxShadow: '0 4px 15px rgba(16,185,129,0.3)'
                    }}>
                      ✓ 确认执行
                    </button>
                    <button onClick={() => setShowAbnormalModal(true)} style={{ 
                      ...styles.buttonSecondary, 
                      border: '1px solid rgba(239,68,68,0.3)',
                      color: '#EF4444'
                    }}>
                      上报异常
                    </button>
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
        
        {showAbnormalModal && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <div style={{ background: 'linear-gradient(180deg, #1E293B 0%, #0F172A 100%)', borderRadius: '20px', padding: '28px', width: '420px', border: '1px solid rgba(255,255,255,0.1)' }}>
              <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', color: '#E2E8F0', fontWeight: '700' }}>上报异常</h3>
              <textarea value={abnormalReason} onChange={(e) => setAbnormalReason(e.target.value)} placeholder="请说明异常原因..." style={{ 
                width: '100%', 
                height: '120px', 
                background: 'rgba(255,255,255,0.03)', 
                border: '1px solid rgba(255,255,255,0.1)', 
                borderRadius: '12px', 
                padding: '14px', 
                fontSize: '14px', 
                color: '#E2E8F0',
                resize: 'none', 
                outline: 'none', 
                boxSizing: 'border-box' 
              }} />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
                <button onClick={() => setShowAbnormalModal(false)} style={styles.buttonSecondary}>取消</button>
                <button onClick={() => { setShowAbnormalModal(false); setExecutionStatus('abnormal'); }} style={{ 
                  ...styles.buttonPrimary, 
                  background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)'
                }}>提交</button>
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
              <h1 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#E2E8F0', letterSpacing: '-0.5px' }}>
                Shopee GMV MAX
              </h1>
              <p style={{ margin: 0, fontSize: '11px', color: '#64748B', letterSpacing: '0.5px' }}>
                AI决策中枢 · 系统博弈专家
              </p>
            </div>
          </div>
          {currentView === 'detail' && (
            <button onClick={() => setCurrentView('dashboard')} style={styles.buttonSecondary}>
              ← 返回工作台
            </button>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {/* 倒计时 */}
          <div style={{ 
            background: 'rgba(255,107,53,0.1)', 
            border: '1px solid rgba(255,107,53,0.2)',
            borderRadius: '12px', 
            padding: '10px 16px', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '12px' 
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FF6B35" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
            <div>
              <div style={{ fontSize: '10px', color: '#64748B' }}>数据截止</div>
              <div style={{ fontSize: '18px', fontWeight: '800', color: '#FF6B35', fontFamily: '"SF Mono", monospace', letterSpacing: '-0.5px' }}>
                {String(countdown.hours).padStart(2, '0')}:{String(countdown.minutes).padStart(2, '0')}:{String(countdown.seconds).padStart(2, '0')}
              </div>
            </div>
          </div>
          
          {selectedProduct && currentView === 'detail' && (
            <div style={{ 
              background: 'rgba(255,255,255,0.05)', 
              borderRadius: '12px', 
              padding: '10px 16px',
              border: '1px solid rgba(255,255,255,0.06)'
            }}>
              <span style={{ fontSize: '11px', color: '#64748B' }}>执行 </span>
              <span style={{ fontSize: '22px', fontWeight: '800', color: '#FF6B35' }}>Day {selectedProduct.currentDay}</span>
              <span style={{ fontSize: '13px', color: '#475569' }}>/7</span>
            </div>
          )}
          
          {/* 用户菜单 */}
          <div style={{ position: 'relative' }}>
            <button onClick={() => setShowUserMenu(!showUserMenu)} style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '12px', 
              padding: '8px 14px', 
              borderRadius: '12px', 
              border: '1px solid rgba(255,255,255,0.1)', 
              background: 'rgba(255,255,255,0.03)', 
              color: '#fff', 
              cursor: 'pointer' 
            }}>
              <div style={{ 
                width: '36px', 
                height: '36px', 
                borderRadius: '10px', 
                background: `linear-gradient(135deg, ${currentUser.color}60, ${currentUser.color}30)`,
                border: `1px solid ${currentUser.color}40`,
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                fontSize: '16px' 
              }}>{currentUser.avatar}</div>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: '13px', fontWeight: '600' }}>{currentUser.name}</div>
                <div style={{ fontSize: '10px', color: '#64748B' }}>{currentUser.role === 'admin' ? '管理员' : '运营'}</div>
              </div>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2">
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </button>
            {showUserMenu && (
              <div style={{ 
                position: 'absolute', 
                top: '100%', 
                right: 0, 
                marginTop: '8px', 
                background: 'linear-gradient(180deg, #1E293B 0%, #0F172A 100%)', 
                borderRadius: '14px', 
                border: '1px solid rgba(255,255,255,0.1)',
                boxShadow: '0 20px 60px rgba(0,0,0,0.5)', 
                padding: '10px', 
                minWidth: '220px', 
                zIndex: 1000 
              }}>
                <div style={{ padding: '10px 14px', fontSize: '11px', color: '#64748B', borderBottom: '1px solid rgba(255,255,255,0.06)', marginBottom: '8px' }}>切换用户</div>
                {users.map(user => (
                  <button key={user.id} onClick={() => { setCurrentUser(user); setShowUserMenu(false); setFilterOwner('mine'); }} style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '12px', 
                    width: '100%', 
                    padding: '12px 14px', 
                    borderRadius: '10px', 
                    border: 'none', 
                    background: currentUser.id === user.id ? 'rgba(255,107,53,0.1)' : 'transparent', 
                    cursor: 'pointer', 
                    textAlign: 'left' 
                  }}>
                    <div style={{ 
                      width: '32px', 
                      height: '32px', 
                      borderRadius: '8px', 
                      background: `linear-gradient(135deg, ${user.color}50, ${user.color}20)`,
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      fontSize: '14px' 
                    }}>{user.avatar}</div>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: '600', color: '#E2E8F0' }}>{user.name}</div>
                      <div style={{ fontSize: '10px', color: '#64748B' }}>{user.role === 'admin' ? '管理员' : '运营'}</div>
                    </div>
                    {currentUser.id === user.id && <span style={{ marginLeft: 'auto', color: '#FF6B35', fontSize: '14px' }}>✓</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* 内容区 */}
      <div style={styles.content}>
        {currentView === 'dashboard' && renderDashboard()}
        {currentView === 'detail' && renderDetail()}
      </div>
      
      {showUploadModal && renderUploadModal()}
      {showUserMenu && <div onClick={() => setShowUserMenu(false)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 99 }} />}
    </div>
  );
};

export default GMVMaxWorkspace;
