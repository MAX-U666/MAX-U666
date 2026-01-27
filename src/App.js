import React, { useState, useEffect, useRef } from 'react';

const API_BASE = '/api';

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

  const [showNewProductModal, setShowNewProductModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showAbnormalModal, setShowAbnormalModal] = useState(false);

  const [newProduct, setNewProduct] = useState({
    sku: '', name: '', price: '', start_date: new Date().toISOString().split('T')[0], target_roi: '3.0'
  });

  // 上传相关 - 分开存储店铺和广告数据
  const [shopData, setShopData] = useState(null);
  const [adData, setAdData] = useState(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState('');
  const [selectedDayNumber, setSelectedDayNumber] = useState(1);
  const shopFileRef = useRef(null);
  const adFileRef = useRef(null);

  const [isSubmitted, setIsSubmitted] = useState(false);
  const [abnormalReason, setAbnormalReason] = useState('');

  useEffect(() => {
    fetch(`${API_BASE}/users`)
      .then(res => res.json())
      .then(data => setUsers(data))
      .catch(err => console.error(err));
  }, []);

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
      .then(data => { setProducts(data); setLoading(false); })
      .catch(err => { console.error(err); setLoading(false); });
  };

  useEffect(() => { loadProducts(); }, [filterOwner, filterStatus, currentUser]);

  const loadProductDetail = (id) => {
    fetch(`${API_BASE}/products/${id}`)
      .then(res => res.json())
      .then(data => {
        setSelectedProduct(data);
        setSelectedDayNumber(data.current_day);
        setIsSubmitted(false);
      })
      .catch(err => console.error(err));
  };

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
        alert('创建成功！');
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

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch(`${API_BASE}/upload-excel`, { method: 'POST', body: formData });
      const result = await res.json();
      if (result.success) {
        setShopData(result.products);
        setUploadMessage(`✅ 店铺数据解析成功！${result.products.length} 个产品`);
      } else {
        setUploadMessage(`❌ 店铺数据解析失败: ${result.error}`);
      }
    } catch (err) {
      setUploadMessage(`❌ 网络错误: ${err.message}`);
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
        setUploadMessage(`✅ 广告数据解析成功！${result.products.length} 个产品`);
      } else {
        setUploadMessage(`❌ 广告数据解析失败: ${result.error}`);
      }
    } catch (err) {
      setUploadMessage(`❌ 网络错误: ${err.message}`);
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
      setUploadMessage(`❌ 未找到 SKU: ${sku} 的数据`);
      return;
    }

    setUploadLoading(true);

    // 合并店铺和广告数据
    const mergedData = {
      visitors: shopProduct?.visitors || 0,
      page_views: shopProduct?.page_views || 0,
      clicks: shopProduct?.clicks || 0,
      add_to_cart: shopProduct?.add_to_cart || 0,
      organic_orders: shopProduct?.orders || 0,
      manual_orders: 0,
      ad_impressions: adProduct?.ad_impressions || 0,
      ad_clicks: adProduct?.ad_clicks || 0,
      ad_orders: adProduct?.ad_conversions || 0,
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
        setUploadMessage(`✅ Day ${selectedDayNumber} 数据导入成功！ROI: ${result.roi}`);
        setTimeout(() => {
          setShowUploadModal(false);
          setShopData(null);
          setAdData(null);
          setUploadMessage('');
          loadProductDetail(selectedProduct.id);
        }, 1500);
      } else {
        setUploadMessage(`❌ ${result.error}`);
      }
    } catch (err) {
      setUploadMessage(`❌ 网络错误: ${err.message}`);
    }
    setUploadLoading(false);
  };

  const handleExecute = async (action, reason, confidence) => {
    try {
      await fetch(`${API_BASE}/daily-data/${selectedProduct.id}/${selectedDayNumber}/execute`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ai_action: action, ai_reason: reason, ai_confidence: confidence, executor_id: currentUser.id })
      });
      loadProductDetail(selectedProduct.id);
    } catch (err) {
      alert('执行失败: ' + err.message);
    }
  };

  const handleAbnormal = async () => {
    try {
      await fetch(`${API_BASE}/daily-data/${selectedProduct.id}/${selectedDayNumber}/abnormal`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ abnormal_reason: abnormalReason, executor_id: currentUser.id })
      });
      setShowAbnormalModal(false);
      setAbnormalReason('');
      loadProductDetail(selectedProduct.id);
    } catch (err) {
      alert('上报失败: ' + err.message);
    }
  };

  const getStatusConfig = (status) => {
    const configs = {
      '进行中': { label: '进行中', color: '#3b82f6', bg: '#eff6ff', icon: '🔄' },
      '已完成': { label: '已完成', color: '#10b981', bg: '#ecfdf5', icon: '✅' },
      '已暂停': { label: '已暂停', color: '#f59e0b', bg: '#fffbeb', icon: '⏸' },
      '已归档': { label: '已归档', color: '#6b7280', bg: '#f3f4f6', icon: '📁' }
    };
    return configs[status] || configs['进行中'];
  };

  const getDayStatus = (dayData) => {
    if (!dayData) return { label: '未提交', color: '#6b7280', bg: '#f3f4f6' };
    const configs = {
      '未提交': { label: '未提交', color: '#6b7280', bg: '#f3f4f6' },
      '待决策': { label: '待决策', color: '#f59e0b', bg: '#fffbeb' },
      '已执行': { label: '已执行', color: '#10b981', bg: '#ecfdf5' },
      '异常': { label: '异常', color: '#ef4444', bg: '#fef2f2' }
    };
    return configs[dayData.status] || configs['未提交'];
  };

  // ========== 新建产品弹窗 ==========
  const renderNewProductModal = () => (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ background: '#fff', borderRadius: '16px', width: '500px', overflow: 'hidden' }}>
        <div style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)', padding: '20px 24px', color: '#fff' }}>
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700' }}>➕ 新建产品任务</h3>
          <p style={{ margin: '8px 0 0 0', fontSize: '12px', opacity: 0.9 }}>创建7天GMV MAX跟踪周期</p>
        </div>
        <div style={{ padding: '24px' }}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '13px', fontWeight: '600', color: '#1e293b', display: 'block', marginBottom: '6px' }}>产品ID (SKU) *</label>
            <input type="text" value={newProduct.sku} onChange={(e) => setNewProduct({...newProduct, sku: e.target.value})} placeholder="从Shopee复制产品ID，如 28835563535" style={{ width: '100%', padding: '12px', border: '2px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
          </div>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '13px', fontWeight: '600', color: '#1e293b', display: 'block', marginBottom: '6px' }}>产品名称 *</label>
            <input type="text" value={newProduct.name} onChange={(e) => setNewProduct({...newProduct, name: e.target.value})} placeholder="输入产品名称" style={{ width: '100%', padding: '12px', border: '2px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div>
              <label style={{ fontSize: '13px', fontWeight: '600', color: '#1e293b', display: 'block', marginBottom: '6px' }}>开始日期 (Day 1)</label>
              <input type="date" value={newProduct.start_date} onChange={(e) => setNewProduct({...newProduct, start_date: e.target.value})} style={{ width: '100%', padding: '12px', border: '2px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ fontSize: '13px', fontWeight: '600', color: '#1e293b', display: 'block', marginBottom: '6px' }}>目标ROI</label>
              <input type="number" step="0.1" value={newProduct.target_roi} onChange={(e) => setNewProduct({...newProduct, target_roi: e.target.value})} style={{ width: '100%', padding: '12px', border: '2px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
            </div>
          </div>
          <div style={{ background: '#f8fafc', borderRadius: '8px', padding: '12px' }}>
            <div style={{ fontSize: '12px', color: '#64748b' }}>📅 系统将自动创建 Day 1 ~ Day 7 的数据表格</div>
            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>👤 负责人: {currentUser.name}</div>
          </div>
        </div>
        <div style={{ padding: '16px 24px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <button onClick={() => setShowNewProductModal(false)} style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#fff', color: '#64748b', fontSize: '14px', cursor: 'pointer' }}>取消</button>
          <button onClick={handleCreateProduct} style={{ padding: '10px 24px', borderRadius: '8px', border: 'none', background: 'linear-gradient(135deg, #3b82f6, #2563eb)', color: '#fff', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>✓ 创建产品</button>
        </div>
      </div>
    </div>
  );

  // ========== 上传数据弹窗 - 分开上传 ==========
  const renderUploadModal = () => {
    const sku = selectedProduct?.sku;
    const matchedShop = shopData?.find(p => p.product_id === sku);
    const matchedAd = adData?.find(p => p.product_id === sku);
    const hasAnyData = matchedShop || matchedAd;

    return (
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
        <div style={{ background: '#fff', borderRadius: '16px', width: '700px', maxHeight: '90vh', overflow: 'hidden' }}>
          <div style={{ background: 'linear-gradient(135deg, #f97316, #ea580c)', padding: '20px 24px', color: '#fff' }}>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700' }}>📊 上传Shopee数据</h3>
            <p style={{ margin: '8px 0 0 0', fontSize: '12px', opacity: 0.9 }}>{selectedProduct?.name} · SKU: {selectedProduct?.sku}</p>
          </div>
          
          <div style={{ padding: '24px', maxHeight: '65vh', overflowY: 'auto' }}>
            {/* 选择Day */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontSize: '13px', fontWeight: '600', color: '#1e293b', display: 'block', marginBottom: '8px' }}>选择录入的Day</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                {[1,2,3,4,5,6,7].map(d => {
                  const dayData = selectedProduct?.daily_data?.find(dd => dd.day_number === d);
                  const dayStatus = getDayStatus(dayData);
                  return (
                    <button key={d} onClick={() => setSelectedDayNumber(d)} style={{ width: '50px', height: '50px', borderRadius: '8px', border: selectedDayNumber === d ? '2px solid #f97316' : '1px solid #e2e8f0', background: selectedDayNumber === d ? '#fff7ed' : dayStatus.bg, color: selectedDayNumber === d ? '#f97316' : dayStatus.color, fontSize: '12px', fontWeight: '600', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                      <span>Day {d}</span>
                      <span style={{ fontSize: '10px' }}>{dayStatus.label.slice(0,2)}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 两列上传区域 */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
              {/* 店铺数据上传 */}
              <div>
                <div style={{ fontSize: '13px', fontWeight: '600', color: '#059669', marginBottom: '8px' }}>📦 店铺数据 (Excel)</div>
                <div onClick={() => shopFileRef.current?.click()} style={{ border: '2px dashed #10b981', borderRadius: '12px', padding: '24px', textAlign: 'center', cursor: 'pointer', background: shopData ? '#ecfdf5' : '#f8fafc', minHeight: '100px' }}>
                  <input ref={shopFileRef} type="file" accept=".xlsx,.xls" onChange={handleShopFileUpload} style={{ display: 'none' }} />
                  {shopData ? (
                    <div>
                      <div style={{ fontSize: '24px', marginBottom: '8px' }}>✅</div>
                      <div style={{ fontSize: '12px', color: '#059669', fontWeight: '600' }}>已上传 {shopData.length} 个产品</div>
                      {matchedShop && <div style={{ fontSize: '11px', color: '#059669', marginTop: '4px' }}>找到匹配: 访客{matchedShop.visitors} 订单{matchedShop.orders}</div>}
                      {!matchedShop && <div style={{ fontSize: '11px', color: '#dc2626', marginTop: '4px' }}>⚠ 未找到SKU匹配</div>}
                    </div>
                  ) : (
                    <div>
                      <div style={{ fontSize: '24px', marginBottom: '8px' }}>📁</div>
                      <div style={{ fontSize: '12px', color: '#64748b' }}>点击上传产品性能.xlsx</div>
                    </div>
                  )}
                </div>
              </div>

              {/* 广告数据上传 */}
              <div>
                <div style={{ fontSize: '13px', fontWeight: '600', color: '#ea580c', marginBottom: '8px' }}>📈 广告数据 (CSV)</div>
                <div onClick={() => adFileRef.current?.click()} style={{ border: '2px dashed #f97316', borderRadius: '12px', padding: '24px', textAlign: 'center', cursor: 'pointer', background: adData ? '#fff7ed' : '#f8fafc', minHeight: '100px' }}>
                  <input ref={adFileRef} type="file" accept=".csv" onChange={handleAdFileUpload} style={{ display: 'none' }} />
                  {adData ? (
                    <div>
                      <div style={{ fontSize: '24px', marginBottom: '8px' }}>✅</div>
                      <div style={{ fontSize: '12px', color: '#ea580c', fontWeight: '600' }}>已上传 {adData.length} 个产品</div>
                      {matchedAd && <div style={{ fontSize: '11px', color: '#ea580c', marginTop: '4px' }}>找到匹配: 曝光{matchedAd.ad_impressions} 花费Rp{(matchedAd.ad_spend/1000).toFixed(0)}k</div>}
                      {!matchedAd && <div style={{ fontSize: '11px', color: '#dc2626', marginTop: '4px' }}>⚠ 未找到SKU匹配</div>}
                    </div>
                  ) : (
                    <div>
                      <div style={{ fontSize: '24px', marginBottom: '8px' }}>📁</div>
                      <div style={{ fontSize: '12px', color: '#64748b' }}>点击上传广告报表.csv</div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 消息提示 */}
            {uploadMessage && (
              <div style={{ marginBottom: '16px', padding: '12px', borderRadius: '8px', background: uploadMessage.includes('✅') ? '#ecfdf5' : '#fef2f2', color: uploadMessage.includes('✅') ? '#059669' : '#dc2626', fontSize: '13px' }}>{uploadMessage}</div>
            )}

            {/* 数据预览 */}
            {hasAnyData && (
              <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '16px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '13px', fontWeight: '600', color: '#1e293b', marginBottom: '12px' }}>📋 数据预览 (SKU: {sku})</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', fontSize: '12px' }}>
                  <div style={{ background: '#fff', padding: '10px', borderRadius: '8px', textAlign: 'center' }}>
                    <div style={{ color: '#64748b', marginBottom: '4px' }}>访客</div>
                    <div style={{ fontSize: '16px', fontWeight: '700', color: '#1e293b' }}>{matchedShop?.visitors || 0}</div>
                  </div>
                  <div style={{ background: '#fff', padding: '10px', borderRadius: '8px', textAlign: 'center' }}>
                    <div style={{ color: '#64748b', marginBottom: '4px' }}>订单</div>
                    <div style={{ fontSize: '16px', fontWeight: '700', color: '#059669' }}>{matchedShop?.orders || 0}</div>
                  </div>
                  <div style={{ background: '#fff', padding: '10px', borderRadius: '8px', textAlign: 'center' }}>
                    <div style={{ color: '#64748b', marginBottom: '4px' }}>加购</div>
                    <div style={{ fontSize: '16px', fontWeight: '700', color: '#1e293b' }}>{matchedShop?.add_to_cart || 0}</div>
                  </div>
                  <div style={{ background: '#fff', padding: '10px', borderRadius: '8px', textAlign: 'center' }}>
                    <div style={{ color: '#64748b', marginBottom: '4px' }}>广告曝光</div>
                    <div style={{ fontSize: '16px', fontWeight: '700', color: '#ea580c' }}>{(matchedAd?.ad_impressions || 0).toLocaleString()}</div>
                  </div>
                  <div style={{ background: '#fff', padding: '10px', borderRadius: '8px', textAlign: 'center' }}>
                    <div style={{ color: '#64748b', marginBottom: '4px' }}>广告点击</div>
                    <div style={{ fontSize: '16px', fontWeight: '700', color: '#ea580c' }}>{matchedAd?.ad_clicks || 0}</div>
                  </div>
                  <div style={{ background: '#fff', padding: '10px', borderRadius: '8px', textAlign: 'center' }}>
                    <div style={{ color: '#64748b', marginBottom: '4px' }}>广告花费</div>
                    <div style={{ fontSize: '16px', fontWeight: '700', color: '#dc2626' }}>Rp{((matchedAd?.ad_spend || 0)/1000).toFixed(0)}k</div>
                  </div>
                  <div style={{ background: '#fff', padding: '10px', borderRadius: '8px', textAlign: 'center' }}>
                    <div style={{ color: '#64748b', marginBottom: '4px' }}>广告收入</div>
                    <div style={{ fontSize: '16px', fontWeight: '700', color: '#059669' }}>Rp{((matchedAd?.ad_revenue || 0)/1000).toFixed(0)}k</div>
                  </div>
                  <div style={{ background: '#fff', padding: '10px', borderRadius: '8px', textAlign: 'center' }}>
                    <div style={{ color: '#64748b', marginBottom: '4px' }}>ROI</div>
                    <div style={{ fontSize: '16px', fontWeight: '700', color: (matchedAd?.ad_roi || 0) >= 3 ? '#059669' : '#dc2626' }}>{matchedAd?.ad_roi?.toFixed(2) || '-'}</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div style={{ padding: '16px 24px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: '12px', color: '#64748b' }}>数据将导入到 Day {selectedDayNumber}</div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => { setShowUploadModal(false); setShopData(null); setAdData(null); setUploadMessage(''); }} style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#fff', color: '#64748b', fontSize: '14px', cursor: 'pointer' }}>取消</button>
              <button onClick={handleImportData} disabled={!hasAnyData || uploadLoading} style={{ padding: '10px 24px', borderRadius: '8px', border: 'none', background: hasAnyData ? 'linear-gradient(135deg, #10b981, #059669)' : '#94a3b8', color: '#fff', fontSize: '14px', fontWeight: '600', cursor: hasAnyData ? 'pointer' : 'not-allowed' }}>
                {uploadLoading ? '导入中...' : '✓ 导入数据'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ========== 7天数据表格 ==========
  const render7DayTable = () => {
    if (!selectedProduct?.daily_data) return null;
    const dailyData = selectedProduct.daily_data;

    const getSummary = () => {
      return {
        totalOrders: dailyData.reduce((sum, d) => sum + (d.organic_orders || 0) + (d.manual_orders || 0), 0),
        totalSpend: dailyData.reduce((sum, d) => sum + (d.ad_spend || 0), 0),
        totalRevenue: dailyData.reduce((sum, d) => sum + (d.ad_revenue || 0), 0),
        avgROI: dailyData.filter(d => d.roi > 0).length > 0 ? (dailyData.filter(d => d.roi > 0).reduce((sum, d) => sum + parseFloat(d.roi), 0) / dailyData.filter(d => d.roi > 0).length).toFixed(2) : 0
      };
    };
    const summary = getSummary();

    return (
      <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <div style={{ background: 'linear-gradient(135deg, #fef3c7, #fde68a)', padding: '12px 16px', borderBottom: '1px solid #fcd34d', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '16px' }}>📊</span>
            <span style={{ fontSize: '14px', fontWeight: '700', color: '#92400e' }}>7天数据追踪</span>
          </div>
          <div style={{ display: 'flex', gap: '16px', fontSize: '11px', color: '#78350f' }}>
            <span>累计订单: <strong style={{ color: '#059669' }}>{summary.totalOrders}</strong></span>
            <span>累计花费: <strong style={{ color: '#dc2626' }}>Rp {(summary.totalSpend/1000).toFixed(0)}k</strong></span>
            <span>累计收入: <strong style={{ color: '#059669' }}>Rp {(summary.totalRevenue/1000).toFixed(0)}k</strong></span>
            <span>整体ROI: <strong style={{ color: summary.avgROI >= 3 ? '#059669' : '#dc2626' }}>{summary.avgROI}</strong></span>
          </div>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', minWidth: '900px' }}>
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                <th style={{ padding: '10px 8px', textAlign: 'center', fontWeight: '600', color: '#64748b', borderBottom: '2px solid #e2e8f0' }}>Day</th>
                <th style={{ padding: '10px 8px', textAlign: 'center', fontWeight: '600', color: '#64748b', borderBottom: '2px solid #e2e8f0' }}>日期</th>
                <th style={{ padding: '10px 8px', textAlign: 'center', fontWeight: '600', color: '#64748b', borderBottom: '2px solid #e2e8f0' }}>状态</th>
                <th style={{ padding: '10px 8px', textAlign: 'center', fontWeight: '600', color: '#059669', borderBottom: '2px solid #e2e8f0' }}>访客</th>
                <th style={{ padding: '10px 8px', textAlign: 'center', fontWeight: '600', color: '#059669', borderBottom: '2px solid #e2e8f0' }}>订单</th>
                <th style={{ padding: '10px 8px', textAlign: 'center', fontWeight: '600', color: '#7c3aed', borderBottom: '2px solid #e2e8f0' }}>补单</th>
                <th style={{ padding: '10px 8px', textAlign: 'center', fontWeight: '600', color: '#ea580c', borderBottom: '2px solid #e2e8f0' }}>广告曝光</th>
                <th style={{ padding: '10px 8px', textAlign: 'center', fontWeight: '600', color: '#ea580c', borderBottom: '2px solid #e2e8f0' }}>广告点击</th>
                <th style={{ padding: '10px 8px', textAlign: 'center', fontWeight: '600', color: '#dc2626', borderBottom: '2px solid #e2e8f0' }}>花费</th>
                <th style={{ padding: '10px 8px', textAlign: 'center', fontWeight: '600', color: '#059669', borderBottom: '2px solid #e2e8f0' }}>收入</th>
                <th style={{ padding: '10px 8px', textAlign: 'center', fontWeight: '600', color: '#3b82f6', borderBottom: '2px solid #e2e8f0' }}>ROI</th>
                <th style={{ padding: '10px 8px', textAlign: 'center', fontWeight: '600', color: '#1e293b', borderBottom: '2px solid #e2e8f0' }}>AI决策</th>
              </tr>
            </thead>
            <tbody>
              {dailyData.map((row) => {
                const isCurrentDay = row.day_number === selectedProduct.current_day;
                const dayStatus = getDayStatus(row);
                return (
                  <tr key={row.day_number} style={{ background: isCurrentDay ? '#fef3c7' : '#fff', borderLeft: isCurrentDay ? '3px solid #f97316' : 'none' }}>
                    <td style={{ padding: '10px 8px', textAlign: 'center', fontWeight: '600', color: isCurrentDay ? '#ea580c' : '#1e293b', borderBottom: '1px solid #e2e8f0' }}>{isCurrentDay ? '▶ ' : ''}Day {row.day_number}</td>
                    <td style={{ padding: '10px 8px', textAlign: 'center', borderBottom: '1px solid #e2e8f0' }}>{new Date(row.date).toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' })}</td>
                    <td style={{ padding: '10px 8px', textAlign: 'center', borderBottom: '1px solid #e2e8f0' }}>
                      <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '10px', background: dayStatus.bg, color: dayStatus.color }}>{dayStatus.label}</span>
                    </td>
                    <td style={{ padding: '10px 8px', textAlign: 'center', borderBottom: '1px solid #e2e8f0' }}>{row.visitors || '-'}</td>
                    <td style={{ padding: '10px 8px', textAlign: 'center', color: '#059669', fontWeight: '600', borderBottom: '1px solid #e2e8f0' }}>{row.organic_orders || '-'}</td>
                    <td style={{ padding: '10px 8px', textAlign: 'center', color: '#7c3aed', borderBottom: '1px solid #e2e8f0' }}>{row.manual_orders || '-'}</td>
                    <td style={{ padding: '10px 8px', textAlign: 'center', borderBottom: '1px solid #e2e8f0' }}>{row.ad_impressions ? row.ad_impressions.toLocaleString() : '-'}</td>
                    <td style={{ padding: '10px 8px', textAlign: 'center', borderBottom: '1px solid #e2e8f0' }}>{row.ad_clicks || '-'}</td>
                    <td style={{ padding: '10px 8px', textAlign: 'center', color: '#dc2626', borderBottom: '1px solid #e2e8f0' }}>{row.ad_spend ? `Rp${(row.ad_spend/1000).toFixed(0)}k` : '-'}</td>
                    <td style={{ padding: '10px 8px', textAlign: 'center', color: '#059669', borderBottom: '1px solid #e2e8f0' }}>{row.ad_revenue ? `Rp${(row.ad_revenue/1000).toFixed(0)}k` : '-'}</td>
                    <td style={{ padding: '10px 8px', textAlign: 'center', fontWeight: '700', color: row.roi >= 3 ? '#059669' : row.roi > 0 ? '#d97706' : '#64748b', borderBottom: '1px solid #e2e8f0' }}>{row.roi > 0 ? row.roi : '-'}</td>
                    <td style={{ padding: '10px 8px', textAlign: 'center', borderBottom: '1px solid #e2e8f0' }}>
                      {row.ai_action ? (
                        <span style={{ padding: '4px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: '600', background: '#ecfdf5', color: '#059669' }}>✓ {row.ai_action}</span>
                      ) : '-'}
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

  // ========== 工作台 ==========
  const renderDashboard = () => (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {[{ value: 'mine', label: '我的产品' }, { value: 'all', label: '全部产品' }].map(opt => (
            <button key={opt.value} onClick={() => setFilterOwner(opt.value)} style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: filterOwner === opt.value ? '#1e293b' : '#f1f5f9', color: filterOwner === opt.value ? '#fff' : '#64748b', fontSize: '13px', fontWeight: '500', cursor: 'pointer' }}>{opt.label}</button>
          ))}
          <div style={{ width: '1px', height: '24px', background: '#e2e8f0' }} />
          {[{ value: 'all', label: '全部' }, { value: '进行中', label: '进行中' }, { value: '已完成', label: '已完成' }].map(opt => (
            <button key={opt.value} onClick={() => setFilterStatus(opt.value)} style={{ padding: '6px 12px', borderRadius: '6px', border: filterStatus === opt.value ? '2px solid #3b82f6' : '1px solid #e2e8f0', background: filterStatus === opt.value ? '#eff6ff' : '#fff', color: filterStatus === opt.value ? '#3b82f6' : '#64748b', fontSize: '12px', cursor: 'pointer' }}>{opt.label}</button>
          ))}
        </div>
        <button onClick={() => setShowNewProductModal(true)} style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: 'linear-gradient(135deg, #3b82f6, #2563eb)', color: '#fff', fontSize: '14px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span>➕</span> 新建产品
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#64748b' }}>加载中...</div>
      ) : products.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#64748b' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📦</div>
          <p>暂无产品，点击"新建产品"开始</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
          {products.map(product => {
            const statusConfig = getStatusConfig(product.status);
            return (
              <div key={product.id} onClick={() => { loadProductDetail(product.id); setCurrentView('detail'); }} style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '20px', cursor: 'pointer', transition: 'all 0.2s' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div>
                    <div style={{ fontSize: '15px', fontWeight: '600', color: '#1e293b', marginBottom: '4px' }}>{product.name}</div>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>SKU: {product.sku}</div>
                  </div>
                  <span style={{ padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '600', background: statusConfig.bg, color: statusConfig.color }}>{statusConfig.icon} {statusConfig.label}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  {[1,2,3,4,5,6,7].map(d => (
                    <div key={d} style={{ flex: 1, height: '6px', borderRadius: '3px', background: d < product.current_day ? '#10b981' : d === product.current_day ? '#f97316' : '#e2e8f0' }} />
                  ))}
                  <span style={{ fontSize: '12px', color: '#64748b', marginLeft: '8px' }}>Day {product.current_day}/7</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '16px' }}>{product.owner_avatar}</span>
                    <span style={{ fontSize: '12px', color: '#64748b' }}>{product.owner_name}</span>
                  </div>
                  <span style={{ fontSize: '11px', color: '#94a3b8' }}>开始: {new Date(product.start_date).toLocaleDateString('zh-CN')}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  // ========== 详情页 ==========
  const renderDetail = () => {
    if (!selectedProduct) return <div style={{ textAlign: 'center', padding: '60px' }}>加载中...</div>;

    const currentDayData = selectedProduct.daily_data?.find(d => d.day_number === selectedProduct.current_day);
    const dayStatus = getDayStatus(currentDayData);

    return (
      <div>
        <div style={{ background: '#fff', borderRadius: '12px', padding: '16px 20px', marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid #e2e8f0' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#1e293b' }}>{selectedProduct.name}</h2>
            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>SKU: {selectedProduct.sku} · 目标ROI: {selectedProduct.target_roi}</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button onClick={() => setShowUploadModal(true)} style={{ padding: '10px 16px', borderRadius: '8px', border: 'none', background: 'linear-gradient(135deg, #f97316, #ea580c)', color: '#fff', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>📊 上传数据</button>
          </div>
        </div>

        {dayStatus.label === '未提交' && (
          <div style={{ background: 'linear-gradient(135deg, #fef2f2, #fee2e2)', border: '2px solid #fca5a5', borderRadius: '10px', padding: '14px 20px', marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '24px' }}>⚠️</span>
              <div>
                <div style={{ fontSize: '14px', fontWeight: '700', color: '#dc2626' }}>Day {selectedProduct.current_day} 数据未提交</div>
                <div style={{ fontSize: '12px', color: '#991b1b' }}>请上传今日Shopee数据</div>
              </div>
            </div>
            <button onClick={() => setShowUploadModal(true)} style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: '#dc2626', color: '#fff', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>立即上传</button>
          </div>
        )}

        {render7DayTable()}

        <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', marginTop: '16px', overflow: 'hidden' }}>
          <div style={{ background: 'linear-gradient(135deg, #1e293b, #334155)', padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '20px' }}>🤖</span>
              <span style={{ fontSize: '14px', fontWeight: '700', color: '#fff' }}>Day {selectedProduct.current_day} AI决策</span>
            </div>
            {dayStatus.label === '待决策' && !isSubmitted && (
              <button onClick={() => setIsSubmitted(true)} style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', background: '#3b82f6', color: '#fff', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>▶ 生成决策</button>
            )}
          </div>
          <div style={{ padding: '20px' }}>
            {dayStatus.label === '未提交' ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                <div style={{ fontSize: '40px', marginBottom: '12px' }}>📭</div>
                <p>请先上传数据，才能生成AI决策</p>
              </div>
            ) : dayStatus.label === '已执行' ? (
              <div style={{ textAlign: 'center', padding: '20px' }}>
                <div style={{ fontSize: '48px', marginBottom: '12px' }}>✅</div>
                <div style={{ fontSize: '16px', fontWeight: '600', color: '#059669' }}>已执行: {currentDayData?.ai_action}</div>
              </div>
            ) : isSubmitted ? (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                  <div style={{ background: '#eff6ff', borderRadius: '10px', padding: '16px' }}>
                    <div style={{ fontSize: '12px', color: '#3b82f6', marginBottom: '8px' }}>📍 当前阶段</div>
                    <div style={{ fontSize: '18px', fontWeight: '700', color: '#1e293b' }}>阶段 {currentDayData?.phase || 'A'}</div>
                  </div>
                  <div style={{ background: '#fef3c7', borderRadius: '10px', padding: '16px' }}>
                    <div style={{ fontSize: '12px', color: '#d97706', marginBottom: '8px' }}>🎯 建议动作</div>
                    <div style={{ fontSize: '18px', fontWeight: '700', color: '#1e293b' }}>维持观察</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button onClick={() => handleExecute('维持观察', '数据稳定，继续观察', 70)} style={{ flex: 1, padding: '14px', borderRadius: '8px', border: 'none', background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>✓ 确认执行</button>
                  <button onClick={() => setShowAbnormalModal(true)} style={{ padding: '14px 24px', borderRadius: '8px', border: '2px solid #fca5a5', background: '#fff', color: '#dc2626', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>⚠ 上报异常</button>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                <div style={{ fontSize: '40px', marginBottom: '12px' }}>🧠</div>
                <p>点击"生成决策"获取AI建议</p>
              </div>
            )}
          </div>
        </div>

        {showAbnormalModal && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', width: '400px' }}>
              <h3 style={{ margin: '0 0 16px 0', fontSize: '18px' }}>⚠️ 上报异常</h3>
              <textarea value={abnormalReason} onChange={(e) => setAbnormalReason(e.target.value)} placeholder="请说明异常原因..." style={{ width: '100%', height: '120px', padding: '12px', border: '2px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', resize: 'none', outline: 'none', boxSizing: 'border-box' }} />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
                <button onClick={() => setShowAbnormalModal(false)} style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#fff', color: '#64748b', fontSize: '14px', cursor: 'pointer' }}>取消</button>
                <button onClick={handleAbnormal} style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: '#ef4444', color: '#fff', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>提交异常</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f1f5f9', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      <div style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', padding: '12px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '40px', height: '40px', background: 'linear-gradient(135deg, #f97316, #ea580c)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>🧠</div>
            <div>
              <h1 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#fff' }}>GMV MAX · AI决策系统</h1>
              <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8' }}>7天周期跟踪 · 智能决策 · 闭环执行</p>
            </div>
          </div>
          {currentView === 'detail' && (
            <button onClick={() => { setCurrentView('dashboard'); setSelectedProduct(null); }} style={{ padding: '6px 14px', borderRadius: '6px', border: '1px solid #475569', background: 'transparent', color: '#94a3b8', fontSize: '12px', cursor: 'pointer' }}>← 返回</button>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {selectedProduct && currentView === 'detail' && (
            <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: '8px', padding: '8px 14px' }}>
              <span style={{ fontSize: '11px', color: '#94a3b8' }}>当前 </span>
              <span style={{ fontSize: '20px', fontWeight: '700', color: '#f97316' }}>Day {selectedProduct.current_day}</span>
              <span style={{ fontSize: '12px', color: '#64748b' }}>/7</span>
            </div>
          )}
          <div style={{ position: 'relative' }}>
            <button onClick={() => setShowUserMenu(!showUserMenu)} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px', borderRadius: '10px', border: 'none', background: 'rgba(255,255,255,0.1)', color: '#fff', cursor: 'pointer' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: currentUser.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>{currentUser.avatar}</div>
              <span style={{ fontSize: '13px', fontWeight: '500' }}>{currentUser.name}</span>
              <span style={{ fontSize: '10px' }}>▼</span>
            </button>
            {showUserMenu && (
              <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: '8px', background: '#fff', borderRadius: '12px', boxShadow: '0 10px 40px rgba(0,0,0,0.15)', padding: '8px', minWidth: '180px', zIndex: 1000 }}>
                {users.map(user => (
                  <button key={user.id} onClick={() => { setCurrentUser(user); setShowUserMenu(false); }} style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', padding: '10px', borderRadius: '8px', border: 'none', background: currentUser.id === user.id ? '#f1f5f9' : 'transparent', cursor: 'pointer' }}>
                    <span style={{ fontSize: '18px' }}>{user.avatar}</span>
                    <span style={{ fontSize: '13px', color: '#1e293b' }}>{user.name}</span>
                    {currentUser.id === user.id && <span style={{ marginLeft: 'auto', color: '#10b981' }}>✓</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
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
