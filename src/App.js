import React, { useState, useEffect } from 'react';

const GMVMaxWorkspace = () => {
  const [currentView, setCurrentView] = useState('dashboard');
  const [currentUser, setCurrentUser] = useState({ id: 1, name: '张三', role: 'operator', avatar: '👨‍💼', color: '#3b82f6' });
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterOwner, setFilterOwner] = useState('mine');
  
  // 详情页状态
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [executionStatus, setExecutionStatus] = useState(null);
  const [showAbnormalModal, setShowAbnormalModal] = useState(false);
  const [abnormalReason, setAbnormalReason] = useState('');
  const [countdown, setCountdown] = useState({ hours: 2, minutes: 15, seconds: 28 });

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

  // 历史数据
  const historyData = [
    { day: 1, date: '12/16', organicOrders: 1, adImpressions: 3051, adOrders: 0, manualOrders: 0, adSpend: 48720, roi: 0, phase: 'A', aiAction: '观察+注入信号', aiReason: '曝光3051，系统试探中，0转化导致信心不足', executed: true, executor: '李四' },
    { day: 2, date: '12/17', organicOrders: 1, adImpressions: 4899, adOrders: 3, manualOrders: 2, adSpend: 70258, roi: 3.37, phase: 'B', aiAction: '维持预算观察', aiReason: 'ROI=3.37突破盈亏线，系统验证稳定性中', executed: true, executor: '李四' },
    { day: 3, date: '12/18', organicOrders: 5, adImpressions: 4505, adOrders: 6, manualOrders: 3, adSpend: 157078, roi: 3.01, phase: null, aiAction: null, aiReason: null, executed: null, executor: null },
    { day: 4, date: '12/19', organicOrders: null, adImpressions: null, adOrders: null, manualOrders: null, adSpend: null, roi: null, phase: null, aiAction: null, aiReason: null, executed: null, executor: null },
    { day: 5, date: '12/20', organicOrders: null, adImpressions: null, adOrders: null, manualOrders: null, adSpend: null, roi: null, phase: null, aiAction: null, aiReason: null, executed: null, executor: null },
    { day: 6, date: '12/21', organicOrders: null, adImpressions: null, adOrders: null, manualOrders: null, adSpend: null, roi: null, phase: null, aiAction: null, aiReason: null, executed: null, executor: null },
    { day: 7, date: '12/22', organicOrders: null, adImpressions: null, adOrders: null, manualOrders: null, adSpend: null, roi: null, phase: null, aiAction: null, aiReason: null, executed: null, executor: null },
  ];

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

  // AI决策生成
  const generateAIDecision = () => {
    return {
      phase: 'B',
      phaseReason: '累计广告曝光12455，累计转化9单，CTR/CVR已成立，系统在验证【成交稳定性】',
      systemConfidence: 'medium',
      confidenceFactors: ['ROI=3.01突破盈亏线', 'CVR达标', 'ATC率健康'],
      coreBlocker: '成交信号连续性不足，系统等待更多"稳定成交"证据',
      manualSignalNeeded: true,
      manualSignalStrategy: '建议自然时段注入1-2单成交信号',
      judgment: 'continue',
      action: '预算维持，强化信号',
      confidence: 68,
      doNots: ['禁止更换素材方向', '禁止大幅调价(>10%)', '禁止连续/集中补单'],
      observe24h: ['曝光是否+30%', 'CVR是否稳定>3%', 'ROI是否守住3.0']
    };
  };

  const aiDecision = generateAIDecision();

  // 渲染工作台
  const renderDashboard = () => (
    <div>
      {/* 统计卡片 */}
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

      {/* 筛选栏 */}
      <div style={{ background: '#fff', borderRadius: '12px', padding: '14px 18px', marginBottom: '16px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '12px', color: '#64748b' }}>显示:</span>
          {[{ value: 'mine', label: '我的产品' }, { value: 'all', label: '全部产品' }].map(opt => (
            <button key={opt.value} onClick={() => setFilterOwner(opt.value)} style={{
              padding: '6px 12px', borderRadius: '6px', border: 'none',
              background: filterOwner === opt.value ? '#1e293b' : '#f1f5f9',
              color: filterOwner === opt.value ? '#fff' : '#64748b',
              fontSize: '11px', fontWeight: '500', cursor: 'pointer'
            }}>{opt.label}</button>
          ))}
        </div>
        <div style={{ width: '1px', height: '24px', background: '#e2e8f0' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '12px', color: '#64748b' }}>状态:</span>
          {[
            { value: 'all', label: '全部' },
            { value: 'pending', label: '待决策', color: '#f59e0b' },
            { value: 'executed', label: '已执行', color: '#10b981' },
            { value: 'abnormal', label: '异常', color: '#ef4444' },
            { value: 'nodata', label: '未提交', color: '#6b7280' }
          ].map(opt => (
            <button key={opt.value} onClick={() => setFilterStatus(opt.value)} style={{
              padding: '6px 12px', borderRadius: '6px',
              border: filterStatus === opt.value ? `2px solid ${opt.color || '#1e293b'}` : '1px solid #e2e8f0',
              background: filterStatus === opt.value ? (opt.color ? opt.color + '15' : '#f8fafc') : '#fff',
              color: filterStatus === opt.value ? (opt.color || '#1e293b') : '#64748b',
              fontSize: '11px', fontWeight: '500', cursor: 'pointer'
            }}>{opt.label}</button>
          ))}
        </div>
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: '12px', color: '#94a3b8' }}>共 {getFilteredProducts().length} 个产品</span>
      </div>

      {/* 产品卡片 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px' }}>
        {getFilteredProducts().map(product => {
          const statusConfig = getStatusConfig(product.status);
          const phaseConfig = getPhaseConfig(product.phase);
          const owner = getOwner(product.owner);
          
          return (
            <div key={product.id} onClick={() => openProductDetail(product)} style={{
              background: '#fff', borderRadius: '12px',
              border: product.needsAction ? '2px solid #f59e0b' : '1px solid #e2e8f0',
              overflow: 'hidden', cursor: 'pointer', position: 'relative'
            }}>
              {product.needsAction && (
                <div style={{ position: 'absolute', top: '12px', right: '12px', width: '10px', height: '10px', background: '#ef4444', borderRadius: '50%', animation: 'pulse 2s infinite' }} />
              )}
              <div style={{ padding: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: '#1e293b', marginBottom: '4px' }}>{product.name}</div>
                    <div style={{ fontSize: '11px', color: '#94a3b8' }}>SKU: {product.sku.slice(-6)} · Rp{product.price.toLocaleString()}</div>
                  </div>
                  <span style={{ padding: '4px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: '600', background: statusConfig.bg, color: statusConfig.color }}>
                    {statusConfig.icon} {statusConfig.label}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {[1,2,3,4,5,6,7].map(d => (
                      <div key={d} style={{ width: '20px', height: '6px', borderRadius: '3px', background: d < product.currentDay ? '#10b981' : d === product.currentDay ? '#f97316' : '#e2e8f0' }} />
                    ))}
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
        {/* 警告条 */}
        <div style={{ background: 'linear-gradient(135deg, #fef2f2, #fee2e2)', border: '2px solid #fca5a5', borderRadius: '10px', padding: '12px 18px', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '20px' }}>⚠️</span>
          <div>
            <div style={{ fontSize: '13px', fontWeight: '700', color: '#dc2626' }}>数据未提交</div>
            <div style={{ fontSize: '11px', color: '#991b1b' }}>无数据 = 无判断 = <strong>自动停投保护</strong></div>
          </div>
        </div>

        {/* 上传区 */}
        <div style={{ background: '#fff', borderRadius: '10px', padding: '12px 18px', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '14px', border: '1px solid #e2e8f0' }}>
          <button style={{ padding: '8px 14px', background: '#f8fafc', border: '2px solid #e2e8f0', borderRadius: '8px', fontSize: '12px', color: '#64748b', cursor: 'pointer', fontWeight: '500' }}>📦 店铺数据</button>
          <button style={{ padding: '8px 14px', background: '#f8fafc', border: '2px solid #e2e8f0', borderRadius: '8px', fontSize: '12px', color: '#64748b', cursor: 'pointer', fontWeight: '500' }}>📢 广告数据</button>
          <div style={{ width: '1px', height: '30px', background: '#e2e8f0' }} />
          <div style={{ flex: 1, padding: '10px 14px', background: '#f8fafc', borderRadius: '8px', fontSize: '12px', color: '#1e293b' }}>
            SKU: {selectedProduct.sku.slice(-6)} · {selectedProduct.name}
          </div>
          <button style={{ background: 'linear-gradient(135deg, #f97316, #ea580c)', border: 'none', borderRadius: '8px', padding: '10px 18px', color: '#fff', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>🔄 提取</button>
        </div>

        {/* 执行链 */}
        <div style={{ background: '#fff', borderRadius: '10px', padding: '14px 18px', marginBottom: '14px', border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: '12px', fontWeight: '600', color: '#1e293b', marginBottom: '12px' }}>🔗 Day {currentDay} 执行追踪链</div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            {[
              { icon: '📊', label: '数据录入', done: false },
              { icon: '🤖', label: 'AI决策', done: isSubmitted },
              { icon: '👆', label: '执行确认', done: executionStatus !== null },
              { icon: '📝', label: '结果回写', done: false }
            ].map((step, i, arr) => (
              <React.Fragment key={i}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ width: '40px', height: '40px', margin: '0 auto', borderRadius: '50%', background: step.done ? '#10b981' : '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', color: step.done ? '#fff' : '#94a3b8' }}>
                    {step.done ? '✓' : step.icon}
                  </div>
                  <div style={{ marginTop: '6px', fontSize: '10px', fontWeight: '600', color: step.done ? '#10b981' : '#94a3b8' }}>{step.label}</div>
                </div>
                {i < arr.length - 1 && <div style={{ flex: 1, height: '3px', background: step.done ? '#10b981' : '#e2e8f0', margin: '0 -8px', marginBottom: '20px' }} />}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* 主内容区 */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1.5fr', gap: '14px' }}>
          {/* 左侧：7天数据表格 */}
          <div style={{ background: '#fff', borderRadius: '10px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            <div style={{ background: 'linear-gradient(135deg, #fef3c7, #fde68a)', padding: '10px 16px', borderBottom: '1px solid #fcd34d' }}>
              <span style={{ fontSize: '14px' }}>📊</span>
              <span style={{ fontSize: '12px', fontWeight: '700', color: '#92400e', marginLeft: '8px' }}>7天数据追踪</span>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                <thead>
                  <tr style={{ background: '#f8fafc' }}>
                    <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: '600', color: '#64748b', borderBottom: '2px solid #e2e8f0' }}>Day</th>
                    <th style={{ padding: '10px 8px', textAlign: 'center', fontWeight: '600', color: '#64748b', borderBottom: '2px solid #e2e8f0' }}>阶段</th>
                    <th style={{ padding: '10px 8px', textAlign: 'center', fontWeight: '600', color: '#059669', borderBottom: '2px solid #e2e8f0' }}>自然单</th>
                    <th style={{ padding: '10px 8px', textAlign: 'center', fontWeight: '600', color: '#ea580c', borderBottom: '2px solid #e2e8f0' }}>广告曝光</th>
                    <th style={{ padding: '10px 8px', textAlign: 'center', fontWeight: '600', color: '#ea580c', borderBottom: '2px solid #e2e8f0' }}>广告单</th>
                    <th style={{ padding: '10px 8px', textAlign: 'center', fontWeight: '600', color: '#7c3aed', borderBottom: '2px solid #e2e8f0' }}>补单</th>
                    <th style={{ padding: '10px 8px', textAlign: 'center', fontWeight: '600', color: '#dc2626', borderBottom: '2px solid #e2e8f0' }}>花费</th>
                    <th style={{ padding: '10px 8px', textAlign: 'center', fontWeight: '600', color: '#2563eb', borderBottom: '2px solid #e2e8f0' }}>ROI</th>
                  </tr>
                </thead>
                <tbody>
                  {historyData.map((row) => (
                    <tr key={row.day} style={{ background: row.day === currentDay ? '#fef3c7' : row.day < currentDay ? '#fff' : '#f8fafc', borderLeft: row.day === currentDay ? '3px solid #f97316' : 'none' }}>
                      <td style={{ padding: '10px 12px', fontWeight: '600', color: row.day === currentDay ? '#ea580c' : '#1e293b', borderBottom: '1px solid #e2e8f0' }}>{row.day === currentDay ? '▶' : ''} {row.date}</td>
                      <td style={{ padding: '10px 8px', textAlign: 'center', borderBottom: '1px solid #e2e8f0' }}>
                        {row.phase ? <span style={{ padding: '2px 6px', background: getPhaseConfig(row.phase).color + '20', color: getPhaseConfig(row.phase).color, borderRadius: '4px', fontSize: '9px', fontWeight: '600' }}>{row.phase}</span> : '-'}
                      </td>
                      <td style={{ padding: '10px 8px', textAlign: 'center', color: '#059669', fontWeight: '600', borderBottom: '1px solid #e2e8f0' }}>{row.organicOrders ?? '-'}</td>
                      <td style={{ padding: '10px 8px', textAlign: 'center', borderBottom: '1px solid #e2e8f0' }}>{row.adImpressions?.toLocaleString() ?? '-'}</td>
                      <td style={{ padding: '10px 8px', textAlign: 'center', color: '#ea580c', fontWeight: '600', borderBottom: '1px solid #e2e8f0' }}>{row.adOrders ?? '-'}</td>
                      <td style={{ padding: '10px 8px', textAlign: 'center', color: '#7c3aed', borderBottom: '1px solid #e2e8f0' }}>{row.manualOrders ?? '-'}</td>
                      <td style={{ padding: '10px 8px', textAlign: 'center', color: '#dc2626', borderBottom: '1px solid #e2e8f0' }}>{row.adSpend ? (row.adSpend/1000).toFixed(0) + 'k' : '-'}</td>
                      <td style={{ padding: '10px 8px', textAlign: 'center', fontWeight: '700', color: row.roi >= 3 ? '#059669' : row.roi > 0 ? '#d97706' : '#dc2626', borderBottom: '1px solid #e2e8f0' }}>{row.roi ?? '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 右侧：AI记忆 + 决策 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* AI历史记忆 */}
            <div style={{ background: '#fff', borderRadius: '10px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
              <div style={{ background: 'linear-gradient(135deg, #fef3c7, #fde68a)', padding: '10px 16px', borderBottom: '1px solid #fcd34d', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div><span style={{ fontSize: '14px' }}>🧠</span><span style={{ fontSize: '12px', fontWeight: '700', color: '#92400e', marginLeft: '8px' }}>AI决策历史记忆</span></div>
                <span style={{ fontSize: '10px', color: '#92400e' }}>前 {currentDay - 1} 天</span>
              </div>
              <div style={{ padding: '12px', maxHeight: '200px', overflowY: 'auto' }}>
                {historyData.filter(d => d.day < currentDay && d.aiAction).map((d) => (
                  <div key={d.day} style={{ background: '#f8fafc', borderRadius: '8px', padding: '12px', border: '1px solid #e2e8f0', marginBottom: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ padding: '3px 8px', background: getPhaseConfig(d.phase).color + '20', color: getPhaseConfig(d.phase).color, borderRadius: '4px', fontSize: '10px', fontWeight: '600' }}>Day {d.day} · {d.date}</span>
                        <span style={{ padding: '2px 6px', background: d.phase === 'B' ? '#eff6ff' : '#fffbeb', color: d.phase === 'B' ? '#2563eb' : '#d97706', borderRadius: '4px', fontSize: '9px' }}>{getPhaseConfig(d.phase).label}</span>
                      </div>
                      <span style={{ fontSize: '12px', fontWeight: '700', color: d.roi >= 3 ? '#059669' : d.roi > 0 ? '#d97706' : '#dc2626' }}>ROI: {d.roi}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '16px', fontSize: '10px', color: '#64748b', marginBottom: '8px' }}>
                      <span>广告单: <strong style={{ color: '#ea580c' }}>{d.adOrders}</strong></span>
                      <span>自然单: <strong style={{ color: '#059669' }}>{d.organicOrders}</strong></span>
                      <span>补单: <strong style={{ color: '#7c3aed' }}>{d.manualOrders}</strong></span>
                      <span>花费: <strong style={{ color: '#dc2626' }}>Rp{(d.adSpend/1000).toFixed(0)}k</strong></span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '8px', borderTop: '1px dashed #e2e8f0' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ padding: '3px 8px', background: '#ecfdf5', border: '1px solid #10b981', borderRadius: '4px', fontSize: '10px', fontWeight: '600', color: '#059669' }}>✓ 已执行</span>
                        <span style={{ fontSize: '11px', color: '#1e293b', fontWeight: '500' }}>{d.aiAction}</span>
                      </div>
                      <span style={{ fontSize: '9px', color: '#94a3b8' }}>执行人: {d.executor}</span>
                    </div>
                    <div style={{ marginTop: '8px', padding: '8px', background: '#fffbeb', borderRadius: '6px', fontSize: '10px', color: '#92400e', lineHeight: '1.4' }}>💡 {d.aiReason}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* AI决策面板 */}
            <div style={{ background: '#fff', borderRadius: '10px', border: '1px solid #e2e8f0', overflow: 'hidden', flex: 1 }}>
              <div style={{ background: 'linear-gradient(135deg, #1e293b, #334155)', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div><span style={{ fontSize: '16px' }}>🤖</span><span style={{ fontSize: '12px', fontWeight: '700', color: '#fff', marginLeft: '8px' }}>Day {currentDay} GMV MAX 专家决策</span></div>
                {!isSubmitted && <button onClick={() => setIsSubmitted(true)} style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)', border: 'none', borderRadius: '6px', padding: '6px 14px', color: '#fff', fontSize: '11px', fontWeight: '600', cursor: 'pointer' }}>▶ 生成决策</button>}
              </div>
              <div style={{ padding: '14px', overflowY: 'auto', maxHeight: '350px' }}>
                {isSubmitted ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {/* 阶段 */}
                    <div style={{ background: '#3b82f615', border: '1px solid #3b82f640', borderRadius: '8px', padding: '10px 12px' }}>
                      <div style={{ fontSize: '9px', color: '#64748b', marginBottom: '4px' }}>📍 当前阶段</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ padding: '4px 10px', background: '#3b82f6', color: '#fff', borderRadius: '6px', fontSize: '12px', fontWeight: '700' }}>阶段 B</span>
                        <span style={{ fontSize: '11px', fontWeight: '600', color: '#3b82f6' }}>放量前观察期</span>
                      </div>
                      <p style={{ margin: '6px 0 0 0', fontSize: '10px', color: '#475569', lineHeight: '1.4' }}>{aiDecision.phaseReason}</p>
                    </div>
                    {/* 系统信心 */}
                    <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '10px 12px' }}>
                      <div style={{ fontSize: '9px', color: '#64748b', marginBottom: '6px' }}>🎯 系统放量信心: <span style={{ padding: '2px 6px', background: '#f59e0b', color: '#fff', borderRadius: '4px', fontSize: '10px', fontWeight: '600' }}>中</span></div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                        {aiDecision.confidenceFactors.map((f, i) => <span key={i} style={{ padding: '2px 6px', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: '4px', fontSize: '9px', color: '#475569' }}>{f}</span>)}
                      </div>
                    </div>
                    {/* 核心卡点 */}
                    <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', padding: '10px 12px' }}>
                      <div style={{ fontSize: '9px', color: '#92400e', marginBottom: '4px' }}>🔒 核心卡点</div>
                      <p style={{ margin: 0, fontSize: '11px', color: '#78350f', fontWeight: '500' }}>{aiDecision.coreBlocker}</p>
                    </div>
                    {/* 补单策略 */}
                    <div style={{ background: '#faf5ff', border: '1px solid #e9d5ff', borderRadius: '8px', padding: '10px 12px' }}>
                      <div style={{ fontSize: '9px', color: '#7c3aed', marginBottom: '4px' }}>💉 补单信号</div>
                      <div style={{ fontSize: '11px', fontWeight: '600', color: '#6b21a8' }}>{aiDecision.manualSignalStrategy}</div>
                    </div>
                    {/* 最终决策 */}
                    <div style={{ background: '#05966915', border: '2px solid #05966940', borderRadius: '10px', padding: '14px' }}>
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
                    {/* 禁止事项 */}
                    <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '10px 12px' }}>
                      <div style={{ fontSize: '9px', color: '#dc2626', marginBottom: '4px', fontWeight: '600' }}>🚫 明确禁止</div>
                      {aiDecision.doNots.map((d, i) => <div key={i} style={{ fontSize: '10px', color: '#991b1b', marginBottom: '2px' }}>• {d}</div>)}
                    </div>
                    {/* 观察重点 */}
                    <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', padding: '10px 12px' }}>
                      <div style={{ fontSize: '9px', color: '#2563eb', marginBottom: '4px', fontWeight: '600' }}>👀 24-48小时观察</div>
                      {aiDecision.observe24h.map((o, i) => <div key={i} style={{ fontSize: '10px', color: '#1e40af', marginBottom: '2px' }}>• {o}</div>)}
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px', color: '#94a3b8' }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '40px', marginBottom: '12px' }}>🧠</div>
                      <p style={{ margin: 0, fontSize: '12px' }}>点击"生成决策"</p>
                      <p style={{ margin: '4px 0 0 0', fontSize: '10px', color: '#64748b' }}>AI将按专家逻辑四步判断</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 异常弹窗 */}
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
      {/* 顶部导航 */}
      <div style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', padding: '10px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '40px', height: '40px', background: 'linear-gradient(135deg, #f97316, #ea580c)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>🧠</div>
            <div>
              <h1 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#fff' }}>Shopee GMV MAX · AI决策中枢</h1>
              <p style={{ margin: 0, fontSize: '10px', color: '#94a3b8' }}>系统博弈专家 · 放量逻辑判断 · 强制闭环</p>
            </div>
          </div>
          {currentView === 'detail' && (
            <button onClick={() => setCurrentView('dashboard')} style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #475569', background: 'transparent', color: '#94a3b8', fontSize: '11px', cursor: 'pointer' }}>← 返回工作台</button>
          )}
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
          {/* 用户菜单 */}
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
                <div style={{ padding: '8px 12px', fontSize: '11px', color: '#94a3b8', borderBottom: '1px solid #e2e8f0', marginBottom: '8px' }}>切换用户 (演示)</div>
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

      {/* 主内容 */}
      <div style={{ padding: '20px 24px', maxWidth: '1400px', margin: '0 auto' }}>
        {currentView === 'dashboard' && renderDashboard()}
        {currentView === 'detail' && renderDetail()}
      </div>

      {showUserMenu && <div onClick={() => setShowUserMenu(false)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 99 }} />}
    </div>
  );
};

export default GMVMaxWorkspace;
