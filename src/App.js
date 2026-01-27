import React, { useState, useEffect } from 'react';

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
  const [countdown, setCountdown] = useState({ hours: 2, minutes: 15, seconds: 28 });

  const [showDataInputModal, setShowDataInputModal] = useState(false);
  const [dataInputForm, setDataInputForm] = useState({
    organic_orders: '', ad_impressions: '', ad_clicks: '', ad_orders: '', manual_orders: '', ad_spend: '', ad_revenue: ''
  });
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');

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
    { id: 3, sku: '23982664306', name: 'LOLA ROSE Sabun Cair', price: 89000, owner: 2, currentDay: 2, phase: 'A', status: 'pending', roi: 0, todaySpend: 45000, todayOrders: 0, needsAction: true, lastUpdate: '11:00' },
    { id: 4, sku: '18273645362', name: 'Serum Wajah Vitamin C', price: 125000, owner: 2, currentDay: 4, phase: 'B', status: 'abnormal', roi: 2.1, todaySpend: 120000, todayOrders: 3, needsAction: true, lastUpdate: '10:15' },
    { id: 5, sku: '98765432101', name: 'Masker Wajah Aloe Vera', price: 45000, owner: 3, currentDay: 6, phase: 'C', status: 'executed', roi: 5.8, todaySpend: 67000, todayOrders: 12, needsAction: false, lastUpdate: '08:30' },
    { id: 6, sku: '11223344556', name: 'Toner Hydrating 100ml', price: 98000, owner: 3, currentDay: 1, phase: 'A', status: 'nodata', roi: null, todaySpend: 0, todayOrders: 0, needsAction: true, lastUpdate: null },
  ]);

  // 7天历史数据 - 完整字段
  const historyData = [
    { day: 1, date: '12/16', organicOrders: 1, manualOrders: 0, impressions: 64, clicks: 4, atc: 13, cvr: 0.25, adImpressions: 3051, adClicks: 34, adCTR: 1.1, adOrders: 0, adCVR: 0, adSpend: 49000, adRevenue: 0, targetROI: '自动竞价4.5→3.2', actualROI: 0, aiDecision: '降低竞价观察', aiStatus: 'executed' },
    { day: 2, date: '12/17', organicOrders: 1, manualOrders: 2, impressions: 149, clicks: 18, atc: 22, cvr: 5.56, adImpressions: 4899, adClicks: 78, adCTR: 1.6, adOrders: 3, adCVR: 3.85, adSpend: 70000, adRevenue: 237000, targetROI: 4.5, actualROI: 3.37, aiDecision: '预算维持', aiStatus: 'executed' },
    { day: 3, date: '12/18', organicOrders: 5, manualOrders: 3, impressions: 175, clicks: 31, atc: 29, cvr: 16.13, adImpressions: 4505, adClicks: 113, adCTR: 2.5, adOrders: 6, adCVR: 5.31, adSpend: 157000, adRevenue: 473000, targetROI: 4.5, actualROI: 3.01, aiDecision: null, aiStatus: 'pending' },
    { day: 4, date: '12/19', organicOrders: null, manualOrders: null, impressions: null, clicks: null, atc: null, cvr: null, adImpressions: null, adClicks: null, adCTR: null, adOrders: null, adCVR: null, adSpend: null, adRevenue: null, targetROI: null, actualROI: null, aiDecision: null, aiStatus: null },
    { day: 5, date: '12/20', organicOrders: null, manualOrders: null, impressions: null, clicks: null, atc: null, cvr: null, adImpressions: null, adClicks: null, adCTR: null, adOrders: null, adCVR: null, adSpend: null, adRevenue: null, targetROI: null, actualROI: null, aiDecision: null, aiStatus: null },
    { day: 6, date: '12/21', organicOrders: null, manualOrders: null, impressions: null, clicks: null, atc: null, cvr: null, adImpressions: null, adClicks: null, adCTR: null, adOrders: null, adCVR: null, adSpend: null, adRevenue: null, targetROI: null, actualROI: null, aiDecision: null, aiStatus: null },
    { day: 7, date: '12/22', organicOrders: null, manualOrders: null, impressions: null, clicks: null, atc: null, cvr: null, adImpressions: null, adClicks: null, adCTR: null, adOrders: null, adCVR: null, adSpend: null, adRevenue: null, targetROI: null, actualROI: null, aiDecision: null, aiStatus: null },
  ];

  // 计算汇总
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
    if (filterOwner === 'mine' && currentUser.role !== 'admin') {
      filtered = filtered.filter(p => p.owner === currentUser.id);
    }
    if (filterStatus !== 'all') {
      filtered = filtered.filter(p => p.status === filterStatus);
    }
    return filtered;
  };

  const getStatusConfig = (status) => {
    const configs = {
      pending: { label: '待决策', color: '#f59e0b', bg: '#fffbeb', icon: '⏳' },
      executed: { label: '已执行', color: '#10b981', bg: '#ecfdf5', icon: '✓' },
      abnormal: { label: '异常上报', color: '#ef4444', bg: '#fef2f2', icon: '⚠' },
      nodata: { label: '未提交', color: '#6b7280', bg: '#f3f4f6', icon: '📭' },
      completed: { label: '已完成', color: '#3b82f6', bg: '#eff6ff', icon: '🏁' }
    };
    return configs[status] || configs.pending;
  };

  const getPhaseConfig = (phase) => {
    const configs = {
      A: { label: '样本不足期', color: '#f59e0b' },
      B: { label: '放量前观察期', color: '#3b82f6' },
      C: { label: '放量确认期', color: '#10b981' }
    };
    return configs[phase] || { label: '-', color: '#6b7280' };
  };

  const getOwner = (ownerId) => users.find(u => u.id === ownerId);

  const openProductDetail = (product) => {
    setSelectedProduct(product);
    setCurrentView('detail');
    setIsSubmitted(false);
    setExecutionStatus(null);
  };

  const handleDataInputSubmit = async () => {
    if (!selectedProduct) return;
    setSubmitLoading(true);
    setSubmitMessage('');
    try {
      const today = new Date().toISOString().split('T')[0];
      const response = await fetch(`${API_BASE}/daily-data`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: selectedProduct.id,
          day_number: selectedProduct.currentDay,
          date: today,
          organic_orders: parseInt(dataInputForm.organic_orders) || 0,
          ad_impressions: parseInt(dataInputForm.ad_impressions) || 0,
          ad_clicks: parseInt(dataInputForm.ad_clicks) || 0,
          ad_orders: parseInt(dataInputForm.ad_orders) || 0,
          manual_orders: parseInt(dataInputForm.manual_orders) || 0,
          ad_spend: parseInt(dataInputForm.ad_spend) || 0,
          ad_revenue: parseInt(dataInputForm.ad_revenue) || 0
        })
      });
      const result = await response.json();
      if (response.ok) {
        setSubmitMessage(`✅ 提交成功！ROI: ${result.roi}, 阶段: ${result.phase}`);
        setTimeout(() => {
          setShowDataInputModal(false);
          setDataInputForm({ organic_orders: '', ad_impressions: '', ad_clicks: '', ad_orders: '', manual_orders: '', ad_spend: '', ad_revenue: '' });
          setSubmitMessage('');
        }, 2000);
      } else {
        setSubmitMessage(`❌ 提交失败: ${result.error}`);
      }
    } catch (err) {
      setSubmitMessage(`❌ 网络错误: ${err.message}`);
    }
    setSubmitLoading(false);
  };

  const previewROI = () => {
    const spend = parseInt(dataInputForm.ad_spend) || 0;
    const revenue = parseInt(dataInputForm.ad_revenue) || 0;
    if (spend === 0) return '-';
    return (revenue / spend).toFixed(2);
  };

  const generateAIDecision = () => ({
    phase: 'B',
    phaseReason: '累计广告曝光12455，累计转化9单，CTR/CVR已成立，系统在验证【成交稳定性】',
    confidenceFactors: ['ROI=3.01突破盈亏线', 'CVR达标', 'ATC率健康'],
    coreBlocker: '成交信号连续性不足，系统等待更多"稳定成交"证据',
    manualSignalStrategy: '建议自然时段注入1-2单成交信号',
    action: '预算维持，强化信号',
    confidence: 68,
    doNots: ['禁止更换素材方向', '禁止大幅调价(>10%)', '禁止连续/集中补单'],
    observe24h: ['曝光是否+30%', 'CVR是否稳定>3%', 'ROI是否守住3.0']
  });

  const aiDecision = generateAIDecision();

  // 数据录入弹窗
  const renderDataInputModal = () => (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ background: '#fff', borderRadius: '16px', width: '500px', maxHeight: '90vh', overflow: 'hidden' }}>
        <div style={{ background: 'linear-gradient(135deg, #f97316, #ea580c)', padding: '20px 24px', color: '#fff' }}>
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700' }}>📊 录入今日数据</h3>
          <p style={{ margin: '8px 0 0 0', fontSize: '12px', opacity: 0.9 }}>{selectedProduct?.name} · Day {selectedProduct?.currentDay}</p>
        </div>
        <div style={{ padding: '24px', maxHeight: '60vh', overflowY: 'auto' }}>
          <div style={{ marginBottom: '20px' }}>
            <div style={{ fontSize: '13px', fontWeight: '600', color: '#059669', marginBottom: '12px' }}>🟢 自然流量</div>
            <div>
              <label style={{ fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '4px' }}>自然订单数</label>
              <input type="number" value={dataInputForm.organic_orders} onChange={(e) => setDataInputForm({...dataInputForm, organic_orders: e.target.value})} placeholder="0" style={{ width: '100%', padding: '10px 12px', border: '2px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
            </div>
          </div>
          <div style={{ marginBottom: '20px' }}>
            <div style={{ fontSize: '13px', fontWeight: '600', color: '#ea580c', marginBottom: '12px' }}>🟠 GMV MAX 广告数据</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              {[['ad_impressions', '广告曝光'], ['ad_clicks', '广告点击'], ['ad_orders', '广告订单'], ['manual_orders', '补单数量'], ['ad_spend', '广告花费 (Rp)'], ['ad_revenue', '广告收入 (Rp)']].map(([key, label]) => (
                <div key={key}>
                  <label style={{ fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '4px' }}>{label}</label>
                  <input type="number" value={dataInputForm[key]} onChange={(e) => setDataInputForm({...dataInputForm, [key]: e.target.value})} placeholder="0" style={{ width: '100%', padding: '10px 12px', border: '2px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
                </div>
              ))}
            </div>
          </div>
          <div style={{ background: previewROI() >= 3 ? '#ecfdf5' : previewROI() > 0 ? '#fffbeb' : '#f8fafc', border: `2px solid ${previewROI() >= 3 ? '#10b981' : previewROI() > 0 ? '#f59e0b' : '#e2e8f0'}`, borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
            <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>预览 ROI</div>
            <div style={{ fontSize: '32px', fontWeight: '800', color: previewROI() >= 3 ? '#059669' : previewROI() > 0 ? '#d97706' : '#64748b' }}>{previewROI()}</div>
            {previewROI() !== '-' && <div style={{ fontSize: '11px', color: previewROI() >= 3 ? '#059669' : '#d97706', marginTop: '4px' }}>{previewROI() >= 3 ? '✅ 达到盈亏线' : '⚠️ 未达盈亏线 (目标≥3)'}</div>}
          </div>
          {submitMessage && <div style={{ marginTop: '16px', padding: '12px', borderRadius: '8px', background: submitMessage.includes('✅') ? '#ecfdf5' : '#fef2f2', color: submitMessage.includes('✅') ? '#059669' : '#dc2626', fontSize: '13px', textAlign: 'center' }}>{submitMessage}</div>}
        </div>
        <div style={{ padding: '16px 24px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <button onClick={() => setShowDataInputModal(false)} style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#fff', color: '#64748b', fontSize: '14px', cursor: 'pointer' }}>取消</button>
          <button onClick={handleDataInputSubmit} disabled={submitLoading} style={{ padding: '10px 24px', borderRadius: '8px', border: 'none', background: submitLoading ? '#94a3b8' : 'linear-gradient(135deg, #f97316, #ea580c)', color: '#fff', fontSize: '14px', fontWeight: '600', cursor: submitLoading ? 'not-allowed' : 'pointer' }}>{submitLoading ? '提交中...' : '✓ 确认提交'}</button>
        </div>
      </div>
    </div>
  );

  // 渲染7天历史数据表格 - 新样式
  const render7DayTable = () => {
    const currentDay = selectedProduct?.currentDay || 3;
    return (
      <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        {/* 表头 */}
        <div style={{ background: 'linear-gradient(135deg, #fef3c7, #fde68a)', padding: '12px 16px', borderBottom: '1px solid #fcd34d', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '16px' }}>📊</span>
            <span style={{ fontSize: '14px', fontWeight: '700', color: '#92400e' }}>7天历史数据追踪</span>
          </div>
          <div style={{ display: 'flex', gap: '16px', fontSize: '11px', color: '#78350f' }}>
            <span>累计订单: <strong style={{ color: '#059669' }}>{summary.totalOrganic + summary.totalManual}</strong></span>
            <span>累计花费: <strong style={{ color: '#dc2626' }}>Rp {(summary.totalAdSpend/1000).toFixed(0)}k</strong></span>
            <span>累计收入: <strong style={{ color: '#059669' }}>Rp {(summary.totalAdRevenue/1000).toFixed(0)}k</strong></span>
            <span>整体ROI: <strong style={{ color: summary.avgROI >= 3 ? '#059669' : '#dc2626' }}>{summary.avgROI}</strong></span>
          </div>
        </div>
        
        {/* 表格 */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', minWidth: '1200px' }}>
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                <th style={{ padding: '10px 8px', textAlign: 'center', fontWeight: '600', color: '#64748b', borderBottom: '2px solid #e2e8f0', position: 'sticky', left: 0, background: '#f8fafc' }}>阶段</th>
                <th style={{ padding: '10px 8px', textAlign: 'center', fontWeight: '600', color: '#64748b', borderBottom: '2px solid #e2e8f0' }}>日期</th>
                <th style={{ padding: '10px 8px', textAlign: 'center', fontWeight: '600', color: '#059669', borderBottom: '2px solid #e2e8f0' }}>实际单量</th>
                <th style={{ padding: '10px 8px', textAlign: 'center', fontWeight: '600', color: '#7c3aed', borderBottom: '2px solid #e2e8f0' }}>补单</th>
                <th style={{ padding: '10px 8px', textAlign: 'center', fontWeight: '600', color: '#64748b', borderBottom: '2px solid #e2e8f0' }}>曝光量</th>
                <th style={{ padding: '10px 8px', textAlign: 'center', fontWeight: '600', color: '#64748b', borderBottom: '2px solid #e2e8f0' }}>点击量</th>
                <th style={{ padding: '10px 8px', textAlign: 'center', fontWeight: '600', color: '#64748b', borderBottom: '2px solid #e2e8f0' }}>加购数</th>
                <th style={{ padding: '10px 8px', textAlign: 'center', fontWeight: '600', color: '#10b981', borderBottom: '2px solid #e2e8f0' }}>转化率</th>
                <th style={{ padding: '10px 8px', textAlign: 'center', fontWeight: '600', color: '#ea580c', borderBottom: '2px solid #e2e8f0' }}>广告曝光</th>
                <th style={{ padding: '10px 8px', textAlign: 'center', fontWeight: '600', color: '#ea580c', borderBottom: '2px solid #e2e8f0' }}>广告点击</th>
                <th style={{ padding: '10px 8px', textAlign: 'center', fontWeight: '600', color: '#ea580c', borderBottom: '2px solid #e2e8f0' }}>广告CTR</th>
                <th style={{ padding: '10px 8px', textAlign: 'center', fontWeight: '600', color: '#ea580c', borderBottom: '2px solid #e2e8f0' }}>广告转化</th>
                <th style={{ padding: '10px 8px', textAlign: 'center', fontWeight: '600', color: '#ea580c', borderBottom: '2px solid #e2e8f0' }}>广告转化率</th>
                <th style={{ padding: '10px 8px', textAlign: 'center', fontWeight: '600', color: '#dc2626', borderBottom: '2px solid #e2e8f0' }}>广告花费</th>
                <th style={{ padding: '10px 8px', textAlign: 'center', fontWeight: '600', color: '#059669', borderBottom: '2px solid #e2e8f0' }}>广告收入</th>
                <th style={{ padding: '10px 8px', textAlign: 'center', fontWeight: '600', color: '#64748b', borderBottom: '2px solid #e2e8f0' }}>设置ROI</th>
                <th style={{ padding: '10px 8px', textAlign: 'center', fontWeight: '600', color: '#3b82f6', borderBottom: '2px solid #e2e8f0' }}>实际ROI</th>
                <th style={{ padding: '10px 8px', textAlign: 'center', fontWeight: '600', color: '#1e293b', borderBottom: '2px solid #e2e8f0' }}>AI决策</th>
              </tr>
            </thead>
            <tbody>
              {historyData.map((row) => (
                <tr key={row.day} style={{ 
                  background: row.day === currentDay ? '#fef3c7' : row.day < currentDay ? '#fff' : '#f8fafc',
                  borderLeft: row.day === currentDay ? '3px solid #f97316' : 'none'
                }}>
                  <td style={{ padding: '10px 8px', textAlign: 'center', fontWeight: '600', color: row.day === currentDay ? '#ea580c' : '#1e293b', borderBottom: '1px solid #e2e8f0', position: 'sticky', left: 0, background: row.day === currentDay ? '#fef3c7' : row.day < currentDay ? '#fff' : '#f8fafc' }}>
                    {row.day === currentDay ? '▶ ' : ''}Day {row.day}
                  </td>
                  <td style={{ padding: '10px 8px', textAlign: 'center', borderBottom: '1px solid #e2e8f0' }}>{row.date}</td>
                  <td style={{ padding: '10px 8px', textAlign: 'center', color: '#059669', fontWeight: '600', borderBottom: '1px solid #e2e8f0' }}>{row.organicOrders ?? '-'}</td>
                  <td style={{ padding: '10px 8px', textAlign: 'center', color: '#7c3aed', fontWeight: '600', borderBottom: '1px solid #e2e8f0' }}>{row.manualOrders ?? '-'}</td>
                  <td style={{ padding: '10px 8px', textAlign: 'center', borderBottom: '1px solid #e2e8f0' }}>{row.impressions ?? '-'}</td>
                  <td style={{ padding: '10px 8px', textAlign: 'center', borderBottom: '1px solid #e2e8f0' }}>{row.clicks ?? '-'}</td>
                  <td style={{ padding: '10px 8px', textAlign: 'center', borderBottom: '1px solid #e2e8f0' }}>{row.atc ?? '-'}</td>
                  <td style={{ padding: '10px 8px', textAlign: 'center', color: '#10b981', fontWeight: '600', borderBottom: '1px solid #e2e8f0' }}>{row.cvr ? `${row.cvr}%` : '-'}</td>
                  <td style={{ padding: '10px 8px', textAlign: 'center', borderBottom: '1px solid #e2e8f0' }}>{row.adImpressions?.toLocaleString() ?? '-'}</td>
                  <td style={{ padding: '10px 8px', textAlign: 'center', borderBottom: '1px solid #e2e8f0' }}>{row.adClicks ?? '-'}</td>
                  <td style={{ padding: '10px 8px', textAlign: 'center', borderBottom: '1px solid #e2e8f0' }}>{row.adCTR ? `${row.adCTR}%` : '-'}</td>
                  <td style={{ padding: '10px 8px', textAlign: 'center', color: '#ea580c', fontWeight: '600', borderBottom: '1px solid #e2e8f0' }}>{row.adOrders ?? '-'}</td>
                  <td style={{ padding: '10px 8px', textAlign: 'center', color: '#ea580c', borderBottom: '1px solid #e2e8f0' }}>{row.adCVR ? `${row.adCVR}%` : '-'}</td>
                  <td style={{ padding: '10px 8px', textAlign: 'center', color: '#dc2626', fontWeight: '600', borderBottom: '1px solid #e2e8f0' }}>{row.adSpend ? `Rp ${(row.adSpend/1000).toFixed(0)}k` : '-'}</td>
                  <td style={{ padding: '10px 8px', textAlign: 'center', color: '#059669', fontWeight: '600', borderBottom: '1px solid #e2e8f0' }}>{row.adRevenue ? `Rp ${(row.adRevenue/1000).toFixed(0)}k` : '-'}</td>
                  <td style={{ padding: '10px 8px', textAlign: 'center', borderBottom: '1px solid #e2e8f0' }}>{row.targetROI ?? '-'}</td>
                  <td style={{ padding: '10px 8px', textAlign: 'center', fontWeight: '700', color: row.actualROI >= 3 ? '#059669' : row.actualROI > 0 ? '#d97706' : '#dc2626', borderBottom: '1px solid #e2e8f0' }}>{row.actualROI || '-'}</td>
                  <td style={{ padding: '10px 8px', textAlign: 'center', borderBottom: '1px solid #e2e8f0' }}>
                    {row.aiDecision ? (
                      <span style={{ 
                        padding: '4px 8px', 
                        borderRadius: '6px', 
                        fontSize: '10px', 
                        fontWeight: '600',
                        background: row.aiStatus === 'executed' ? '#ecfdf5' : '#fffbeb',
                        color: row.aiStatus === 'executed' ? '#059669' : '#d97706',
                        border: `1px solid ${row.aiStatus === 'executed' ? '#10b981' : '#f59e0b'}`
                      }}>
                        {row.aiStatus === 'executed' ? '✓ ' : '→ '}{row.aiDecision}
                      </span>
                    ) : '-'}
                  </td>
                </tr>
              ))}
              {/* 汇总行 */}
              <tr style={{ background: '#f1f5f9', fontWeight: '600' }}>
                <td style={{ padding: '12px 8px', textAlign: 'center', borderBottom: '1px solid #e2e8f0', position: 'sticky', left: 0, background: '#f1f5f9' }}>汇总</td>
                <td style={{ padding: '12px 8px', textAlign: 'center', borderBottom: '1px solid #e2e8f0' }}>-</td>
                <td style={{ padding: '12px 8px', textAlign: 'center', color: '#059669', borderBottom: '1px solid #e2e8f0' }}>{summary.totalOrganic}</td>
                <td style={{ padding: '12px 8px', textAlign: 'center', color: '#7c3aed', borderBottom: '1px solid #e2e8f0' }}>{summary.totalManual}</td>
                <td style={{ padding: '12px 8px', textAlign: 'center', borderBottom: '1px solid #e2e8f0' }}>{summary.totalImpressions}</td>
                <td style={{ padding: '12px 8px', textAlign: 'center', borderBottom: '1px solid #e2e8f0' }}>{summary.totalClicks}</td>
                <td style={{ padding: '12px 8px', textAlign: 'center', borderBottom: '1px solid #e2e8f0' }}>-</td>
                <td style={{ padding: '12px 8px', textAlign: 'center', color: '#10b981', borderBottom: '1px solid #e2e8f0' }}>{summary.avgCVR}%</td>
                <td style={{ padding: '12px 8px', textAlign: 'center', borderBottom: '1px solid #e2e8f0' }}>-</td>
                <td style={{ padding: '12px 8px', textAlign: 'center', borderBottom: '1px solid #e2e8f0' }}>-</td>
                <td style={{ padding: '12px 8px', textAlign: 'center', borderBottom: '1px solid #e2e8f0' }}>-</td>
                <td style={{ padding: '12px 8px', textAlign: 'center', borderBottom: '1px solid #e2e8f0' }}>-</td>
                <td style={{ padding: '12px 8px', textAlign: 'center', borderBottom: '1px solid #e2e8f0' }}>-</td>
                <td style={{ padding: '12px 8px', textAlign: 'center', color: '#dc2626', borderBottom: '1px solid #e2e8f0' }}>Rp {(summary.totalAdSpend/1000).toFixed(0)}k</td>
                <td style={{ padding: '12px 8px', textAlign: 'center', color: '#059669', borderBottom: '1px solid #e2e8f0' }}>Rp {(summary.totalAdRevenue/1000).toFixed(0)}k</td>
                <td style={{ padding: '12px 8px', textAlign: 'center', borderBottom: '1px solid #e2e8f0' }}>-</td>
                <td style={{ padding: '12px 8px', textAlign: 'center', color: summary.avgROI >= 3 ? '#059669' : '#dc2626', borderBottom: '1px solid #e2e8f0' }}>{summary.avgROI}</td>
                <td style={{ padding: '12px 8px', textAlign: 'center', borderBottom: '1px solid #e2e8f0' }}>-</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // 渲染工作台
  const renderDashboard = () => (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '12px', marginBottom: '20px' }}>
        {[
          { label: '管理产品', value: stats.total, icon: '📦', color: '#1e293b' },
          { label: '待决策', value: stats.pending, icon: '⏳', color: '#f59e0b' },
          { label: '已执行', value: stats.executed, icon: '✓', color: '#10b981' },
          { label: '异常中', value: stats.abnormal, icon: '⚠', color: '#ef4444' },
          { label: '今日花费', value: `Rp${(stats.totalSpend/1000).toFixed(0)}k`, icon: '💰', color: '#dc2626' },
          { label: '今日订单', value: stats.totalOrders, icon: '🛒', color: '#059669' }
        ].map((item, i) => (
          <div key={i} style={{ background: '#fff', borderRadius: '12px', padding: '16px', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '11px', color: '#64748b' }}>{item.label}</span>
              <span style={{ fontSize: '16px' }}>{item.icon}</span>
            </div>
            <div style={{ fontSize: '24px', fontWeight: '700', color: item.color }}>{item.value}</div>
          </div>
        ))}
      </div>
      <div style={{ background: '#fff', borderRadius: '12px', padding: '14px 18px', marginBottom: '16px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '12px', color: '#64748b' }}>显示:</span>
          {[{ value: 'mine', label: '我的产品' }, { value: 'all', label: '全部产品' }].map(opt => (
            <button key={opt.value} onClick={() => setFilterOwner(opt.value)} style={{ padding: '6px 12px', borderRadius: '6px', border: 'none', background: filterOwner === opt.value ? '#1e293b' : '#f1f5f9', color: filterOwner === opt.value ? '#fff' : '#64748b', fontSize: '11px', fontWeight: '500', cursor: 'pointer' }}>{opt.label}</button>
          ))}
        </div>
        <div style={{ width: '1px', height: '24px', background: '#e2e8f0' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '12px', color: '#64748b' }}>状态:</span>
          {[{ value: 'all', label: '全部' }, { value: 'pending', label: '待决策', color: '#f59e0b' }, { value: 'executed', label: '已执行', color: '#10b981' }, { value: 'abnormal', label: '异常', color: '#ef4444' }, { value: 'nodata', label: '未提交', color: '#6b7280' }].map(opt => (
            <button key={opt.value} onClick={() => setFilterStatus(opt.value)} style={{ padding: '6px 12px', borderRadius: '6px', border: filterStatus === opt.value ? `2px solid ${opt.color || '#1e293b'}` : '1px solid #e2e8f0', background: filterStatus === opt.value ? (opt.color ? opt.color + '15' : '#f8fafc') : '#fff', color: filterStatus === opt.value ? (opt.color || '#1e293b') : '#64748b', fontSize: '11px', fontWeight: '500', cursor: 'pointer' }}>{opt.label}</button>
          ))}
        </div>
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: '12px', color: '#94a3b8' }}>共 {getFilteredProducts().length} 个产品</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px' }}>
        {getFilteredProducts().map(product => {
          const statusConfig = getStatusConfig(product.status);
          const phaseConfig = getPhaseConfig(product.phase);
          const owner = getOwner(product.owner);
          return (
            <div key={product.id} onClick={() => openProductDetail(product)} style={{ background: '#fff', borderRadius: '12px', border: product.needsAction ? '2px solid #f59e0b' : '1px solid #e2e8f0', overflow: 'hidden', cursor: 'pointer', position: 'relative' }}>
              {product.needsAction && <div style={{ position: 'absolute', top: '12px', right: '12px', width: '10px', height: '10px', background: '#ef4444', borderRadius: '50%', animation: 'pulse 2s infinite' }} />}
              <div style={{ padding: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: '#1e293b', marginBottom: '4px' }}>{product.name}</div>
                    <div style={{ fontSize: '11px', color: '#94a3b8' }}>SKU: {product.sku.slice(-6)} · Rp{product.price.toLocaleString()}</div>
                  </div>
                  <span style={{ padding: '4px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: '600', background: statusConfig.bg, color: statusConfig.color }}>{statusConfig.icon} {statusConfig.label}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {[1,2,3,4,5,6,7].map(d => <div key={d} style={{ width: '20px', height: '6px', borderRadius: '3px', background: d < product.currentDay ? '#10b981' : d === product.currentDay ? '#f97316' : '#e2e8f0' }} />)}
                  </div>
                  <span style={{ fontSize: '11px', color: '#64748b' }}>Day {product.currentDay}/7</span>
                  {product.phase && <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: '600', background: phaseConfig.color + '15', color: phaseConfig.color }}>{phaseConfig.label.slice(0,4)}</span>}
                </div>
                <div style={{ display: 'flex', gap: '16px', padding: '12px', background: '#f8fafc', borderRadius: '8px', marginBottom: '12px' }}>
                  <div><div style={{ fontSize: '10px', color: '#64748b' }}>ROI</div><div style={{ fontSize: '16px', fontWeight: '700', color: product.roi >= 3 ? '#10b981' : product.roi > 0 ? '#f59e0b' : '#ef4444' }}>{product.roi ?? '-'}</div></div>
                  <div><div style={{ fontSize: '10px', color: '#64748b' }}>花费</div><div style={{ fontSize: '14px', fontWeight: '600', color: '#dc2626' }}>Rp{(product.todaySpend/1000).toFixed(0)}k</div></div>
                  <div><div style={{ fontSize: '10px', color: '#64748b' }}>订单</div><div style={{ fontSize: '14px', fontWeight: '600', color: '#059669' }}>{product.todayOrders}</div></div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: owner?.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}>{owner?.avatar}</div>
                    <span style={{ fontSize: '11px', color: '#64748b' }}>{owner?.name}</span>
                  </div>
                  <span style={{ fontSize: '10px', color: '#94a3b8' }}>{product.lastUpdate ? `更新于 ${product.lastUpdate}` : '暂无'}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }`}</style>
    </div>
  );

  // 渲染详情页
  const renderDetail = () => {
    if (!selectedProduct) return null;
    const currentDay = selectedProduct.currentDay;
    return (
      <div>
        <div style={{ background: 'linear-gradient(135deg, #fef2f2, #fee2e2)', border: '2px solid #fca5a5', borderRadius: '10px', padding: '12px 18px', marginBottom: '14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '20px' }}>⚠️</span>
            <div>
              <div style={{ fontSize: '13px', fontWeight: '700', color: '#dc2626' }}>数据未提交</div>
              <div style={{ fontSize: '11px', color: '#991b1b' }}>无数据 = 无判断 = <strong>自动停投保护</strong></div>
            </div>
          </div>
          <button onClick={() => setShowDataInputModal(true)} style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: 'linear-gradient(135deg, #3b82f6, #2563eb)', color: '#fff', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>📊 立即录入数据</button>
        </div>
        <div style={{ background: '#fff', borderRadius: '10px', padding: '12px 18px', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '14px', border: '1px solid #e2e8f0' }}>
          <button onClick={() => setShowDataInputModal(true)} style={{ padding: '8px 14px', background: 'linear-gradient(135deg, #f97316, #ea580c)', border: 'none', borderRadius: '8px', fontSize: '12px', color: '#fff', cursor: 'pointer', fontWeight: '600' }}>📊 录入数据</button>
          <button style={{ padding: '8px 14px', background: '#f8fafc', border: '2px solid #e2e8f0', borderRadius: '8px', fontSize: '12px', color: '#64748b', cursor: 'pointer', fontWeight: '500' }}>📝 结果回写</button>
          <div style={{ width: '1px', height: '30px', background: '#e2e8f0' }} />
          <div style={{ flex: 1, padding: '10px 14px', background: '#f8fafc', borderRadius: '8px', fontSize: '12px', color: '#1e293b' }}>SKU: {selectedProduct.sku.slice(-6)} · {selectedProduct.name}</div>
          <button style={{ padding: '8px 14px', background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none', borderRadius: '8px', fontSize: '12px', color: '#fff', cursor: 'pointer', fontWeight: '600' }}>🔄 提取数据</button>
        </div>

        {/* 7天历史数据表格 - 新样式 */}
        <div style={{ marginBottom: '14px' }}>
          {render7DayTable()}
        </div>

        {/* AI决策面板 */}
        <div style={{ background: '#fff', borderRadius: '10px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          <div style={{ background: 'linear-gradient(135deg, #1e293b, #334155)', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div><span style={{ fontSize: '16px' }}>🤖</span><span style={{ fontSize: '12px', fontWeight: '700', color: '#fff', marginLeft: '8px' }}>Day {currentDay} GMV MAX 专家决策</span></div>
            {!isSubmitted && <button onClick={() => setIsSubmitted(true)} style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)', border: 'none', borderRadius: '6px', padding: '6px 14px', color: '#fff', fontSize: '11px', fontWeight: '600', cursor: 'pointer' }}>▶ 生成决策</button>}
          </div>
          <div style={{ padding: '14px' }}>
            {isSubmitted ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                <div style={{ background: '#3b82f615', border: '1px solid #3b82f640', borderRadius: '8px', padding: '12px' }}>
                  <div style={{ fontSize: '9px', color: '#64748b', marginBottom: '4px' }}>📍 当前阶段</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ padding: '4px 10px', background: '#3b82f6', color: '#fff', borderRadius: '6px', fontSize: '12px', fontWeight: '700' }}>阶段 B</span>
                    <span style={{ fontSize: '11px', fontWeight: '600', color: '#3b82f6' }}>放量前观察期</span>
                  </div>
                </div>
                <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', padding: '12px' }}>
                  <div style={{ fontSize: '9px', color: '#92400e', marginBottom: '4px' }}>🔒 核心卡点</div>
                  <p style={{ margin: 0, fontSize: '11px', color: '#78350f', fontWeight: '500' }}>{aiDecision.coreBlocker}</p>
                </div>
                <div style={{ background: '#faf5ff', border: '1px solid #e9d5ff', borderRadius: '8px', padding: '12px' }}>
                  <div style={{ fontSize: '9px', color: '#7c3aed', marginBottom: '4px' }}>💉 补单策略</div>
                  <div style={{ fontSize: '11px', fontWeight: '600', color: '#6b21a8' }}>{aiDecision.manualSignalStrategy}</div>
                </div>
                <div style={{ gridColumn: 'span 2', background: '#05966915', border: '2px solid #05966940', borderRadius: '10px', padding: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <div>
                      <div style={{ fontSize: '9px', color: '#64748b' }}>🤖 今日判断</div>
                      <div style={{ fontSize: '22px', fontWeight: '800', color: '#059669' }}>维持观察</div>
                    </div>
                    <div style={{ width: '44px', height: '44px', background: 'conic-gradient(#059669 68%, #e2e8f0 0)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <div style={{ width: '36px', height: '36px', background: '#fff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: '700', color: '#059669' }}>68%</div>
                    </div>
                  </div>
                  <div style={{ background: '#059669', borderRadius: '6px', padding: '10px', textAlign: 'center', marginBottom: '10px' }}>
                    <div style={{ fontSize: '8px', color: 'rgba(255,255,255,0.8)' }}>【明日唯一动作】</div>
                    <div style={{ fontSize: '14px', fontWeight: '700', color: '#fff' }}>{aiDecision.action}</div>
                  </div>
                  {executionStatus === null ? (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      <button onClick={() => setExecutionStatus('executed')} style={{ background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none', borderRadius: '6px', padding: '10px', color: '#fff', fontSize: '11px', fontWeight: '600', cursor: 'pointer' }}>✓ 确认执行</button>
                      <button onClick={() => setShowAbnormalModal(true)} style={{ background: '#fff', border: '2px solid #fca5a5', borderRadius: '6px', padding: '10px', color: '#dc2626', fontSize: '11px', fontWeight: '600', cursor: 'pointer' }}>⚠ 上报异常</button>
                    </div>
                  ) : (
                    <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '6px', padding: '10px', textAlign: 'center' }}>
                      <span style={{ fontSize: '11px', fontWeight: '600', color: '#059669' }}>✓ 已确认执行</span>
                    </div>
                  )}
                </div>
                <div>
                  <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '10px', marginBottom: '8px' }}>
                    <div style={{ fontSize: '9px', color: '#dc2626', marginBottom: '4px', fontWeight: '600' }}>🚫 禁止</div>
                    {aiDecision.doNots.map((d, i) => <div key={i} style={{ fontSize: '9px', color: '#991b1b' }}>• {d}</div>)}
                  </div>
                  <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', padding: '10px' }}>
                    <div style={{ fontSize: '9px', color: '#2563eb', marginBottom: '4px', fontWeight: '600' }}>👀 观察</div>
                    {aiDecision.observe24h.map((o, i) => <div key={i} style={{ fontSize: '9px', color: '#1e40af' }}>• {o}</div>)}
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '150px', color: '#94a3b8' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '40px', marginBottom: '12px' }}>🧠</div>
                  <p style={{ margin: 0, fontSize: '12px' }}>点击"生成决策" AI将按专家逻辑四步判断</p>
                </div>
              </div>
            )}
          </div>
        </div>
        {showAbnormalModal && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', width: '400px' }}>
              <h3 style={{ margin: '0 0 12px 0', fontSize: '18px' }}>⚠️ 上报异常</h3>
              <textarea value={abnormalReason} onChange={(e) => setAbnormalReason(e.target.value)} placeholder="请说明异常原因..." style={{ width: '100%', height: '100px', background: '#f8fafc', border: '2px solid #e2e8f0', borderRadius: '8px', padding: '12px', fontSize: '13px', resize: 'none', outline: 'none', boxSizing: 'border-box' }} />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
                <button onClick={() => setShowAbnormalModal(false)} style={{ background: '#f1f5f9', border: 'none', borderRadius: '8px', padding: '10px 20px', color: '#64748b', fontSize: '13px', cursor: 'pointer' }}>取消</button>
                <button onClick={() => { setShowAbnormalModal(false); setExecutionStatus('abnormal'); }} style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', border: 'none', borderRadius: '8px', padding: '10px 20px', color: '#fff', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>提交</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f1f5f9', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      <div style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', padding: '10px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '40px', height: '40px', background: 'linear-gradient(135deg, #f97316, #ea580c)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>🧠</div>
            <div>
              <h1 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#fff' }}>Shopee GMV MAX · AI决策中枢</h1>
              <p style={{ margin: 0, fontSize: '10px', color: '#94a3b8' }}>系统博弈专家 · 放量逻辑判断 · 强制闭环</p>
            </div>
          </div>
          {currentView === 'detail' && <button onClick={() => setCurrentView('dashboard')} style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #475569', background: 'transparent', color: '#94a3b8', fontSize: '11px', cursor: 'pointer' }}>← 返回工作台</button>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: '10px', padding: '8px 14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '14px' }}>⏰</span>
            <div>
              <div style={{ fontSize: '9px', color: '#64748b' }}>数据截止</div>
              <div style={{ fontSize: '16px', fontWeight: '700', color: '#f97316', fontFamily: 'monospace' }}>{String(countdown.hours).padStart(2, '0')}:{String(countdown.minutes).padStart(2, '0')}:{String(countdown.seconds).padStart(2, '0')}</div>
            </div>
          </div>
          {selectedProduct && currentView === 'detail' && (
            <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: '10px', padding: '8px 14px' }}>
              <span style={{ fontSize: '10px', color: '#64748b' }}>执行 </span>
              <span style={{ fontSize: '20px', fontWeight: '700', color: '#f97316' }}>Day {selectedProduct.currentDay}</span>
              <span style={{ fontSize: '12px', color: '#475569' }}>/7</span>
            </div>
          )}
          <div style={{ position: 'relative' }}>
            <button onClick={() => setShowUserMenu(!showUserMenu)} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '6px 12px', borderRadius: '10px', border: 'none', background: 'rgba(255,255,255,0.1)', color: '#fff', cursor: 'pointer' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: currentUser.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>{currentUser.avatar}</div>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: '12px', fontWeight: '600' }}>{currentUser.name}</div>
                <div style={{ fontSize: '10px', color: '#94a3b8' }}>{currentUser.role === 'admin' ? '管理员' : '运营'}</div>
              </div>
              <span style={{ fontSize: '10px', marginLeft: '4px' }}>▼</span>
            </button>
            {showUserMenu && (
              <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: '8px', background: '#fff', borderRadius: '12px', boxShadow: '0 10px 40px rgba(0,0,0,0.15)', padding: '8px', minWidth: '200px', zIndex: 1000 }}>
                <div style={{ padding: '8px 12px', fontSize: '11px', color: '#94a3b8', borderBottom: '1px solid #e2e8f0', marginBottom: '8px' }}>切换用户</div>
                {users.map(user => (
                  <button key={user.id} onClick={() => { setCurrentUser(user); setShowUserMenu(false); setFilterOwner('mine'); }} style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', padding: '10px 12px', borderRadius: '8px', border: 'none', background: currentUser.id === user.id ? '#f1f5f9' : 'transparent', cursor: 'pointer', textAlign: 'left' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: user.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>{user.avatar}</div>
                    <div><div style={{ fontSize: '12px', fontWeight: '500', color: '#1e293b' }}>{user.name}</div><div style={{ fontSize: '10px', color: '#94a3b8' }}>{user.role === 'admin' ? '管理员' : '运营'}</div></div>
                    {currentUser.id === user.id && <span style={{ marginLeft: 'auto', color: '#10b981' }}>✓</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      <div style={{ padding: '20px 24px', maxWidth: '1600px', margin: '0 auto' }}>
        {currentView === 'dashboard' && renderDashboard()}
        {currentView === 'detail' && renderDetail()}
      </div>
      {showDataInputModal && renderDataInputModal()}
      {showUserMenu && <div onClick={() => setShowUserMenu(false)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 99 }} />}
    </div>
  );
};

export default GMVMaxWorkspace;
