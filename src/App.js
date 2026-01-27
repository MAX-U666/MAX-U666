import React, { useState } from 'react';
import { Header, DayTable, NewProductModal, UploadModal, AbnormalModal } from './components';
import { styles, getStatusConfig, getDayStatus } from './styles/theme';
import { useCountdown, useUsers, useProducts, useProductDetail } from './hooks/useData';
import { createProduct, uploadFile, updateShopData, updateAdData, executeDecision, reportAbnormal } from './utils/api';
import { MiniLogo } from './components/Logo';

const App = () => {
  const [currentView, setCurrentView] = useState('dashboard');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterOwner, setFilterOwner] = useState('mine');
  
  const [showNewProductModal, setShowNewProductModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showAbnormalModal, setShowAbnormalModal] = useState(false);
  
  const [newProduct, setNewProduct] = useState({
    sku: '', name: '', price: '', start_date: new Date().toISOString().split('T')[0], target_roi: '3.0'
  });
  const [abnormalReason, setAbnormalReason] = useState('');
  
  const [shopData, setShopData] = useState(null);
  const [adData, setAdData] = useState(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState('');
  
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [executionStatus, setExecutionStatus] = useState(null);

  const countdown = useCountdown();
  const { users, currentUser, setCurrentUser } = useUsers();
  const { products, loading, loadProducts } = useProducts(currentUser, filterOwner, filterStatus);
  const { selectedProduct, setSelectedProduct, selectedDayNumber, setSelectedDayNumber, loadProductDetail } = useProductDetail();

  const handleCreateProduct = async () => {
    if (!newProduct.sku || !newProduct.name) {
      alert('请填写产品ID和名称');
      return;
    }
    const result = await createProduct({ ...newProduct, owner_id: currentUser.id });
    if (result.id) {
      setShowNewProductModal(false);
      setNewProduct({ sku: '', name: '', price: '', start_date: new Date().toISOString().split('T')[0], target_roi: '3.0' });
      loadProducts();
    } else {
      alert(result.error || '创建失败');
    }
  };

  const handleFileUpload = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadLoading(true);
    
    const result = await uploadFile(file);
    if (result.success) {
      if (type === 'shop') {
        setShopData(result.products);
        setUploadMessage(`店铺数据: ${result.products.length} 个产品`);
      } else {
        setAdData(result.products);
        setUploadMessage(prev => (prev ? prev + ' | ' : '') + `广告数据: ${result.products.length} 个产品`);
      }
    } else {
      setUploadMessage(prev => (prev ? prev + ' | ' : '') + `解析失败: ${result.error}`);
    }
    setUploadLoading(false);
    e.target.value = '';
  };

  // 导入数据 - 26列完整版
  const handleImportData = async () => {
    const sku = selectedProduct.sku;
    const shopProduct = shopData?.find(p => p.product_id === sku);
    const adProduct = adData?.find(p => p.product_id === sku);
    if (!shopProduct && !adProduct) {
      setUploadMessage(`未找到 SKU: ${sku} 的数据`);
      return;
    }

    setUploadLoading(true);
    let messages = [];

    if (shopProduct) {
      const result = await updateShopData(selectedProduct.id, selectedDayNumber, {
        visitors: shopProduct.visitors || 0,
        page_views: shopProduct.page_views || 0,
        visitors_no_buy: shopProduct.visitors_no_buy || 0,
        visitors_no_buy_rate: shopProduct.visitors_no_buy_rate || 0,
        clicks: shopProduct.clicks || 0,
        likes: shopProduct.likes || 0,
        cart_visitors: shopProduct.cart_visitors || 0,
        add_to_cart: shopProduct.add_to_cart || 0,
        cart_rate: shopProduct.cart_rate || 0,
        orders_created: shopProduct.orders_created || 0,
        items_created: shopProduct.items_created || 0,
        revenue_created: shopProduct.revenue_created || 0,
        conversion_rate: shopProduct.conversion_rate || 0,
        orders_ready: shopProduct.orders_ready || 0,
        items_ready: shopProduct.items_ready || 0,
        revenue_ready: shopProduct.revenue_ready || 0,
        ready_rate: shopProduct.ready_rate || 0,
        ready_created_rate: shopProduct.ready_created_rate || 0,
      });
      messages.push(result.success ? '店铺数据✓' : `店铺失败: ${result.error}`);
    }

    if (adProduct) {
      const result = await updateAdData(selectedProduct.id, selectedDayNumber, {
        ad_impressions: adProduct.ad_impressions || 0,
        ad_clicks: adProduct.ad_clicks || 0,
        ad_conversions: adProduct.ad_conversions || 0,
        ad_spend: adProduct.ad_spend || 0,
        ad_revenue: adProduct.ad_revenue || 0
      });
      messages.push(result.success ? `广告数据✓ ROI:${result.roi}` : `广告失败: ${result.error}`);
    }

    setUploadMessage(`Day ${selectedDayNumber}: ${messages.join(' | ')}`);
    setUploadLoading(false);

    if (messages.some(m => m.includes('✓'))) {
      setTimeout(() => {
        setShowUploadModal(false);
        setShopData(null);
        setAdData(null);
        setUploadMessage('');
        loadProductDetail(selectedProduct.id);
      }, 1500);
    }
  };

  const handleExecute = async (action, reason, confidence) => {
    await executeDecision(selectedProduct.id, selectedDayNumber, {
      ai_action: action, ai_reason: reason, ai_confidence: confidence, executor_id: currentUser.id
    });
    setExecutionStatus('executed');
    loadProductDetail(selectedProduct.id);
  };

  const handleAbnormal = async () => {
    await reportAbnormal(selectedProduct.id, selectedDayNumber, {
      abnormal_reason: abnormalReason, executor_id: currentUser.id
    });
    setShowAbnormalModal(false);
    setAbnormalReason('');
    setExecutionStatus('abnormal');
    loadProductDetail(selectedProduct.id);
  };

  const openDetail = (product) => {
    loadProductDetail(product.id);
    setCurrentView('detail');
    setIsSubmitted(false);
    setExecutionStatus(null);
  };

  const currentDayData = selectedProduct?.daily_data?.find(d => d.day_number === (selectedProduct?.current_day || 1));
  const dayStatus = getDayStatus(currentDayData);

  return (
    <div style={styles.container}>
      <Header 
        currentView={currentView} setCurrentView={setCurrentView}
        currentUser={currentUser} setCurrentUser={setCurrentUser}
        users={users} selectedProduct={selectedProduct}
        setSelectedProduct={setSelectedProduct} countdown={countdown}
        setFilterOwner={setFilterOwner}
      />
      
      <div style={styles.content}>
        {currentView === 'dashboard' ? (
          <Dashboard 
            products={products} loading={loading} currentUser={currentUser}
            filterOwner={filterOwner} setFilterOwner={setFilterOwner}
            filterStatus={filterStatus} setFilterStatus={setFilterStatus}
            onNewProduct={() => setShowNewProductModal(true)}
            onOpenDetail={openDetail}
          />
        ) : (
          <Detail 
            selectedProduct={selectedProduct} dayStatus={dayStatus}
            currentDayData={currentDayData} isSubmitted={isSubmitted}
            setIsSubmitted={setIsSubmitted} executionStatus={executionStatus}
            onUpload={() => setShowUploadModal(true)}
            onExecute={handleExecute}
            onAbnormal={() => setShowAbnormalModal(true)}
          />
        )}
      </div>

      {showNewProductModal && (
        <NewProductModal 
          newProduct={newProduct} setNewProduct={setNewProduct}
          currentUser={currentUser} onClose={() => setShowNewProductModal(false)}
          onCreate={handleCreateProduct}
        />
      )}
      
      {showUploadModal && (
        <UploadModal 
          selectedProduct={selectedProduct}
          selectedDayNumber={selectedDayNumber} setSelectedDayNumber={setSelectedDayNumber}
          shopData={shopData} setShopData={setShopData}
          adData={adData} setAdData={setAdData}
          uploadMessage={uploadMessage} setUploadMessage={setUploadMessage}
          uploadLoading={uploadLoading}
          onClose={() => { setShowUploadModal(false); setShopData(null); setAdData(null); setUploadMessage(''); }}
          onShopUpload={(e) => handleFileUpload(e, 'shop')}
          onAdUpload={(e) => handleFileUpload(e, 'ad')}
          onImport={handleImportData}
        />
      )}
      
      {showAbnormalModal && (
        <AbnormalModal 
          abnormalReason={abnormalReason} setAbnormalReason={setAbnormalReason}
          onClose={() => setShowAbnormalModal(false)} onSubmit={handleAbnormal}
        />
      )}
    </div>
  );
};

const Dashboard = ({ products, loading, currentUser, filterOwner, setFilterOwner, filterStatus, setFilterStatus, onNewProduct, onOpenDetail }) => {
  const stats = {
    total: products.length,
    pending: products.filter(p => p.status === '进行中').length,
    executed: products.filter(p => p.status === '已完成').length,
    abnormal: products.filter(p => p.status === '已暂停').length,
  };

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
        {[
          { label: '管理产品', value: stats.total, color: '#E2E8F0' },
          { label: '进行中', value: stats.pending, color: '#3B82F6' },
          { label: '已完成', value: stats.executed, color: '#10B981' },
          { label: '已暂停', value: stats.abnormal, color: '#F59E0B' },
        ].map((item, i) => (
          <div key={i} style={{ ...styles.card, padding: '20px' }}>
            <span style={{ fontSize: '12px', color: '#64748B' }}>{item.label}</span>
            <div style={{ fontSize: '28px', fontWeight: '800', color: item.color, marginTop: '8px' }}>{item.value}</div>
          </div>
        ))}
      </div>

      <div style={{ ...styles.card, padding: '14px 20px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '20px' }}>
        <div style={{ display: 'flex', gap: '10px' }}>
          {[{ value: 'mine', label: '我的产品' }, { value: 'all', label: '全部产品' }].map(opt => (
            <button key={opt.value} onClick={() => setFilterOwner(opt.value)} style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: filterOwner === opt.value ? 'linear-gradient(135deg, #FF6B35 0%, #F7931E 100%)' : 'rgba(255,255,255,0.05)', color: filterOwner === opt.value ? '#fff' : '#94A3B8', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>{opt.label}</button>
          ))}
        </div>
        <div style={{ width: '1px', height: '28px', background: 'rgba(255,255,255,0.1)' }} />
        <div style={{ display: 'flex', gap: '10px' }}>
          {['all', '进行中', '已完成', '已暂停'].map(s => (
            <button key={s} onClick={() => setFilterStatus(s)} style={{ padding: '8px 16px', borderRadius: '8px', border: filterStatus === s ? '1px solid #3B82F6' : 'none', background: filterStatus === s ? 'rgba(59,130,246,0.1)' : 'transparent', color: filterStatus === s ? '#3B82F6' : '#64748B', fontSize: '12px', cursor: 'pointer' }}>{s === 'all' ? '全部' : s}</button>
          ))}
        </div>
        <div style={{ flex: 1 }} />
        <button onClick={onNewProduct} style={{ ...styles.buttonPrimary, display: 'flex', alignItems: 'center', gap: '8px' }}>+ 新建产品</button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#64748B' }}>加载中...</div>
      ) : products.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px', color: '#64748B' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📦</div>
          <p>暂无产品</p>
          <button onClick={onNewProduct} style={styles.buttonPrimary}>新建产品</button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
          {products.map(product => {
            const statusConfig = getStatusConfig(product.status);
            return (
              <div key={product.id} onClick={() => onOpenDetail(product)} style={{ ...styles.card, cursor: 'pointer', padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <div>
                    <div style={{ fontSize: '15px', fontWeight: '700', color: '#E2E8F0' }}>{product.name}</div>
                    <div style={{ fontSize: '12px', color: '#64748B' }}>SKU: {product.sku}</div>
                  </div>
                  <span style={{ padding: '6px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: '600', background: statusConfig.bg, color: statusConfig.color }}>{statusConfig.label}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '16px' }}>
                  {[1,2,3,4,5,6,7].map(d => (
                    <div key={d} style={{ width: '24px', height: '6px', borderRadius: '3px', background: d < product.current_day ? '#10B981' : d === product.current_day ? '#FF6B35' : 'rgba(255,255,255,0.1)' }} />
                  ))}
                  <span style={{ fontSize: '12px', color: '#94A3B8', marginLeft: '10px' }}>Day {product.current_day}/7</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#64748B' }}>
                  <span>{product.owner_avatar} {product.owner_name}</span>
                  <span>开始: {new Date(product.start_date).toLocaleDateString('zh-CN')}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const Detail = ({ selectedProduct, dayStatus, currentDayData, isSubmitted, setIsSubmitted, executionStatus, onUpload, onExecute, onAbnormal }) => {
  if (!selectedProduct) return <div style={{ textAlign: 'center', padding: '60px', color: '#64748B' }}>加载中...</div>;
  
  const currentDay = selectedProduct.current_day || 1;
  
  return (
    <div>
      {dayStatus.label === '未提交' && (
        <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '14px', padding: '16px 20px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: '40px', height: '40px', background: 'rgba(239,68,68,0.15)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#EF4444' }}>⚠</div>
            <div>
              <div style={{ fontSize: '14px', fontWeight: '700', color: '#EF4444' }}>Day {currentDay} 数据未提交</div>
              <div style={{ fontSize: '12px', color: '#F87171' }}>无数据 = 无判断 = 自动停投保护</div>
            </div>
          </div>
          <button onClick={onUpload} style={styles.buttonPrimary}>立即上传数据</button>
        </div>
      )}
      
      <div style={{ ...styles.card, padding: '14px 20px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button onClick={onUpload} style={{ ...styles.buttonPrimary, background: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)' }}>📊 上传数据</button>
        <button style={styles.buttonSecondary}>结果回写</button>
        <div style={{ flex: 1, padding: '10px 16px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', fontSize: '13px', color: '#E2E8F0' }}>
          <span style={{ color: '#64748B' }}>SKU:</span> {selectedProduct.sku} · {selectedProduct.name}
        </div>
      </div>

      <div style={{ marginBottom: '16px' }}>
        <DayTable selectedProduct={selectedProduct} />
      </div>

      <div style={styles.card}>
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
            <div style={{ textAlign: 'center', padding: '40px', color: '#64748B' }}>请先上传数据</div>
          ) : dayStatus.label === '已执行' || executionStatus === 'executed' ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <div style={{ fontSize: '48px', marginBottom: '12px' }}>✅</div>
              <div style={{ fontSize: '16px', fontWeight: '700', color: '#10B981' }}>已执行: {currentDayData?.ai_action || '维持观察'}</div>
            </div>
          ) : isSubmitted ? (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <div style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: '12px', padding: '16px' }}>
                  <div style={{ fontSize: '10px', color: '#64748B', marginBottom: '8px' }}>当前阶段</div>
                  <span style={{ padding: '6px 14px', background: '#3B82F6', color: '#fff', borderRadius: '8px', fontSize: '13px', fontWeight: '700' }}>阶段 {currentDayData?.phase || 'A'}</span>
                </div>
                <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: '12px', padding: '16px' }}>
                  <div style={{ fontSize: '10px', color: '#64748B', marginBottom: '8px' }}>核心卡点</div>
                  <p style={{ margin: 0, fontSize: '12px', color: '#F59E0B' }}>成交信号连续性不足</p>
                </div>
                <div style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: '12px', padding: '16px' }}>
                  <div style={{ fontSize: '10px', color: '#64748B', marginBottom: '8px' }}>补单策略</div>
                  <div style={{ fontSize: '12px', fontWeight: '600', color: '#8B5CF6' }}>建议注入1-2单</div>
                </div>
              </div>
              <div style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '14px', padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '10px', color: '#64748B', marginBottom: '8px' }}>今日判断</div>
                  <div style={{ fontSize: '28px', fontWeight: '800', color: '#10B981' }}>维持观察</div>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button onClick={() => onExecute('维持观察', '数据稳定', 70)} style={{ ...styles.buttonPrimary, background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)' }}>✓ 确认执行</button>
                  <button onClick={onAbnormal} style={{ ...styles.buttonSecondary, border: '1px solid rgba(239,68,68,0.3)', color: '#EF4444' }}>上报异常</button>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px', color: '#64748B' }}>
              <MiniLogo size={40} color="#FF6B35" />
              <p style={{ marginTop: '16px' }}>点击"生成决策"</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default App;
