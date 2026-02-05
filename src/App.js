import React, { useState, useEffect } from 'react';
import { Header, DayTable, NewProductModal, UploadModal, AbnormalModal } from './components';
import AIDecisionPanel from './components/AIDecisionPanel';
import LoginPage from './components/LoginPage';
import UserManagement from './components/UserManagement';
import ExecuteCenter from './pages/ExecuteCenter';
import OrderCenter from './pages/OrderCenter';
import ProductCenter from './pages/ProductCenter';
import AdCenter from './pages/AdCenter';
import ShopAuth from './pages/ShopAuth';
import BICenter from './BI';  // 新增：BI中心
import { styles, getStatusConfig, getDayStatus } from './styles/theme';
import { useCountdown, useProducts, useProductDetail } from './hooks/useData';
import { createProduct, uploadFile, updateShopData, updateAdData, executeDecision, reportAbnormal } from './utils/api';

const App = () => {
  // 登录状态
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [checkingAuth, setCheckingAuth] = useState(true);
  
  // 用户管理弹窗
  const [showUserManagement, setShowUserManagement] = useState(false);

  // 新增：模块切换 ('decision' | 'execute' | 'bi')
  const [currentModule, setCurrentModule] = useState('decision');

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
  
  const [executionStatus, setExecutionStatus] = useState(null);
  
  // 新增：选中的 Day（用于查看历史决策）
  const [selectedDay, setSelectedDay] = useState(null);

  const countdown = useCountdown();
  const { products, loading, loadProducts } = useProducts(currentUser, filterOwner, filterStatus);
  const { selectedProduct, setSelectedProduct, selectedDayNumber, setSelectedDayNumber, loadProductDetail } = useProductDetail();

  // 当选中产品变化时，重置 selectedDay 为当前天
  useEffect(() => {
    if (selectedProduct) {
      setSelectedDay(selectedProduct.current_day || 1);
    }
  }, [selectedProduct]);

  // 检查登录状态
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      const savedUser = localStorage.getItem('user');
      
      if (token && savedUser) {
        try {
          const response = await fetch('/api/verify-token', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const data = await response.json();
          
          if (data.valid) {
            setCurrentUser(data.user);
            setIsLoggedIn(true);
          } else {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
          }
        } catch (err) {
          console.error('验证失败:', err);
        }
      }
      setCheckingAuth(false);
    };
    
    checkAuth();
  }, []);

  // 加载用户列表
  useEffect(() => {
    if (isLoggedIn) {
      fetch('/api/users')
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) setUsers(data);
        })
        .catch(console.error);
    }
  }, [isLoggedIn]);

  // 登录处理
  const handleLogin = (user) => {
    setCurrentUser(user);
    setIsLoggedIn(true);
  };

  // 退出登录
  const handleLogout = async () => {
    try {
      await fetch('/api/logout', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
    } catch (err) {
      console.error('退出失败:', err);
    }
    
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsLoggedIn(false);
    setCurrentUser(null);
    setCurrentModule('decision');
  };

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
      const result = await updateShopData(selectedProduct.id, selectedDayNumber, shopProduct);
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

  const handleExecute = async (action, reason, confidence, fullAnalysis) => {
    await executeDecision(selectedProduct.id, selectedDay, {
      ai_action: action, 
      ai_reason: reason, 
      ai_confidence: confidence,
      ai_full_analysis: fullAnalysis,
      executor_id: currentUser.id
    });
    setExecutionStatus('executed');
    loadProductDetail(selectedProduct.id);
  };

  const handleAbnormal = async () => {
    await reportAbnormal(selectedProduct.id, selectedDay, {
      abnormal_reason: abnormalReason, 
      executor_id: currentUser.id
    });
    setShowAbnormalModal(false);
    setAbnormalReason('');
    setExecutionStatus('abnormal');
    loadProductDetail(selectedProduct.id);
  };

  const openDetail = (product) => {
    loadProductDetail(product.id);
    setCurrentView('detail');
    setExecutionStatus(null);
    setSelectedDay(null);
  };

  // 删除产品
  const handleDeleteProduct = async (product) => {
    if (!window.confirm(`确定要删除产品「${product.name}」吗？\n此操作将同时删除所有相关的每日数据和 AI 分析记录，不可恢复！`)) {
      return;
    }
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/products/${product.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        alert('产品删除成功');
        loadProducts();
      } else {
        alert('删除失败: ' + (data.error || '未知错误'));
      }
    } catch (err) {
      alert('删除失败: ' + err.message);
    }
  };

  // 处理 Day 选择
  const handleDaySelect = (dayNumber) => {
    setSelectedDay(dayNumber);
  };

  // 切换模块
  const switchModule = (module) => {
    setCurrentModule(module);
    if (module === 'decision') {
      setCurrentView('dashboard');
    }
  };

  // 检查登录状态中
  if (checkingAuth) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#F5F5F7',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ textAlign: 'center', color: '#64748B' }}>
          <div style={{
            width: '48px',
            height: '48px',
            border: '3px solid rgba(255,107,53,0.2)',
            borderTopColor: '#FF6B35',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }} />
          <p>加载中...</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  // 未登录显示登录页
  if (!isLoggedIn) {
    return <LoginPage onLogin={handleLogin} />;
  }

  // 获取选中天的数据
  const currentDayNumber = selectedDay || selectedProduct?.current_day || 1;
  const currentDayData = selectedProduct?.daily_data?.find(d => d.day_number === currentDayNumber);
  const dayStatus = getDayStatus(currentDayData);

  // 模块按钮配置
  const moduleButtons = [
    { key: 'decision', label: '📊 决策工作台' },
    { key: 'execute', label: '🤖 执行中心' },
    { key: 'orders', label: '📦 订单中心' },
    { key: 'products', label: '🏪 商品中心' },
    { key: 'ads', label: '📢 广告中心' },
    { key: 'bi', label: '📈 BI 中心' },
  ];

  return (
    <div style={styles.container}>
      <Header 
        currentView={currentView} setCurrentView={setCurrentView}
        currentUser={currentUser} setCurrentUser={setCurrentUser}
        users={users} selectedProduct={selectedProduct}
        setSelectedProduct={setSelectedProduct} countdown={countdown}
        setFilterOwner={setFilterOwner}
        onLogout={handleLogout}
        onUserManagement={() => setShowUserManagement(true)}
        onShopAuth={() => setCurrentModule('shopAuth')}
      />

      {/* 模块切换栏 */}
      {isLoggedIn && (
        <div style={{ 
          display: 'flex', 
          gap: '8px', 
          padding: '12px 20px',
          background: '#FFFFFF',
          borderBottom: '1px solid #E8E8ED',
          overflowX: 'auto'
        }}>
          {moduleButtons.map(btn => (
            <button 
              key={btn.key}
              onClick={() => switchModule(btn.key)}
              style={{
                padding: '10px 20px',
                borderRadius: '8px',
                border: 'none',
                background: currentModule === btn.key 
                  ? 'linear-gradient(135deg, #FF6B35 0%, #F7931E 100%)' 
                  : '#F5F5F7',
                color: currentModule === btn.key ? '#fff' : '#333',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s',
                whiteSpace: 'nowrap'
              }}
            >
              {btn.label}
            </button>
          ))}
        </div>
      )}
      
      <div style={styles.content}>
        {/* 根据模块切换显示不同内容 */}
        {currentModule === 'bi' ? (
          <BICenter />
        ) : currentModule === 'execute' ? (
          <ExecuteCenter />
        ) : currentModule === 'orders' ? (
          <OrderCenter />
        ) : currentModule === 'products' ? (
          <ProductCenter />
        ) : currentModule === 'ads' ? (
          <AdCenter />
        ) : currentModule === 'shopAuth' ? (
          <ShopAuth />
        ) : currentView === 'dashboard' ? (
          <Dashboard 
            products={products} loading={loading} currentUser={currentUser}
            filterOwner={filterOwner} setFilterOwner={setFilterOwner}
            filterStatus={filterStatus} setFilterStatus={setFilterStatus}
            onNewProduct={() => setShowNewProductModal(true)}
            onOpenDetail={openDetail}
            onDeleteProduct={handleDeleteProduct}
          />
        ) : (
          <Detail 
            selectedProduct={selectedProduct} 
            selectedDay={currentDayNumber}
            onDaySelect={handleDaySelect}
            dayStatus={dayStatus}
            currentDayData={currentDayData} 
            currentUser={currentUser}
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

      {showUserManagement && (
        <UserManagement 
          currentUser={currentUser}
          onClose={() => setShowUserManagement(false)}
        />
      )}
    </div>
  );
};

const Dashboard = ({ products, loading, currentUser, filterOwner, setFilterOwner, filterStatus, setFilterStatus, onNewProduct, onOpenDetail, onDeleteProduct }) => {
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
          { label: '管理产品', value: stats.total, color: '#1a1a1a' },
          { label: '进行中', value: stats.pending, color: '#3B82F6' },
          { label: '已完成', value: stats.executed, color: '#10B981' },
          { label: '已暂停', value: stats.abnormal, color: '#F59E0B' },
        ].map((item, i) => (
          <div key={i} style={{ ...styles.card, padding: '20px' }}>
            <span style={{ fontSize: '13px', color: '#999' }}>{item.label}</span>
            <div style={{ fontSize: '32px', fontWeight: '700', color: item.color, marginTop: '8px' }}>{item.value}</div>
          </div>
        ))}
      </div>

      <div style={{ ...styles.card, padding: '14px 20px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '20px' }}>
        <div style={{ display: 'flex', gap: '10px' }}>
          {[{ value: 'mine', label: '我的产品' }, { value: 'all', label: '全部产品' }].map(opt => (
            <button key={opt.value} onClick={() => setFilterOwner(opt.value)} style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: filterOwner === opt.value ? 'linear-gradient(135deg, #FF6B35, #F7931E)' : '#F5F5F7', color: filterOwner === opt.value ? '#fff' : '#666', fontSize: '13px', fontWeight: '500', cursor: 'pointer' }}>{opt.label}</button>
          ))}
        </div>
        <div style={{ width: '1px', height: '28px', background: '#E8E8ED' }} />
        <div style={{ display: 'flex', gap: '10px' }}>
          {['all', '进行中', '已完成', '已暂停'].map(s => (
            <button key={s} onClick={() => setFilterStatus(s)} style={{ padding: '8px 16px', borderRadius: '8px', border: filterStatus === s ? '2px solid #FF6B35' : '1px solid #E8E8ED', background: filterStatus === s ? 'rgba(255,107,53,0.06)' : '#fff', color: filterStatus === s ? '#FF6B35' : '#333', fontSize: '13px', fontWeight: '500', cursor: 'pointer' }}>{s === 'all' ? '全部' : s}</button>
          ))}
        </div>
        <div style={{ flex: 1 }} />
        <button onClick={onNewProduct} style={{ ...styles.buttonPrimary, display: 'flex', alignItems: 'center', gap: '8px' }}>+ 新建产品</button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#999' }}>加载中...</div>
      ) : products.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px', color: '#999' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📦</div>
          <p>暂无产品</p>
          <button onClick={onNewProduct} style={styles.buttonPrimary}>新建产品</button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
          {products.map(product => {
            const statusConfig = getStatusConfig(product.status);
            return (
              <div key={product.id} style={{ ...styles.card, padding: '20px' }} onClick={() => onOpenDetail(product)}>
                <div style={{ cursor: 'pointer' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '16px', fontWeight: '600', color: '#1a1a1a', marginBottom: '4px' }}>{product.name}</div>
                      <div style={{ fontSize: '13px', color: '#999' }}>SKU: {product.sku}</div>
                    </div>
                    <span style={{ padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: '600', background: statusConfig.bg, color: statusConfig.color }}>{statusConfig.label}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '16px' }}>
                    {[1,2,3,4,5,6,7].map(d => (
                      <div key={d} style={{ width: '28px', height: '6px', borderRadius: '3px', background: d < product.current_day ? '#10B981' : d === product.current_day ? '#3B82F6' : '#E8E8ED' }} />
                    ))}
                    <span style={{ fontSize: '13px', color: '#999', marginLeft: '12px', fontWeight: '500' }}>Day {product.current_day}/7</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', color: '#999' }}>
                    <span>{product.owner_avatar} {product.owner_name}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span>开始: {new Date(product.start_date).toLocaleDateString('zh-CN')}</span>
                      <button 
                        onClick={(e) => { e.stopPropagation(); onDeleteProduct(product); }}
                        style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '6px', padding: '4px 10px', color: '#EF4444', fontSize: '12px', fontWeight: '500', cursor: 'pointer', transition: 'all 0.2s' }}
                        onMouseEnter={(e) => { e.target.style.background = '#EF4444'; e.target.style.color = '#fff'; }}
                        onMouseLeave={(e) => { e.target.style.background = 'rgba(239,68,68,0.15)'; e.target.style.color = '#EF4444'; }}
                      >
                        删除
                      </button>
                    </div>
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

const Detail = ({ selectedProduct, selectedDay, onDaySelect, dayStatus, currentDayData, currentUser, onUpload, onExecute, onAbnormal }) => {
  if (!selectedProduct) return <div style={{ textAlign: 'center', padding: '60px', color: '#64748B' }}>加载中...</div>;
  
  const isCurrentDay = selectedDay === selectedProduct.current_day;
  
  return (
    <div>
      {/* 只在当前天且未提交时显示警告 */}
      {isCurrentDay && dayStatus.label === '未提交' && (
        <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '14px', padding: '16px 20px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: '40px', height: '40px', background: 'rgba(239,68,68,0.15)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#EF4444' }}>⚠</div>
            <div>
              <div style={{ fontSize: '14px', fontWeight: '700', color: '#EF4444' }}>Day {selectedDay} 数据未提交</div>
              <div style={{ fontSize: '12px', color: '#F87171' }}>无数据 = 无判断 = 自动停投保护</div>
            </div>
          </div>
          <button onClick={onUpload} style={styles.buttonPrimary}>立即上传数据</button>
        </div>
      )}
      
      <div style={{ ...styles.card, padding: '14px 20px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button onClick={onUpload} style={{ ...styles.buttonPrimary, background: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)' }}>📊 上传数据</button>
        <button style={styles.buttonSecondary}>结果回写</button>
        <div style={{ flex: 1, padding: '10px 16px', background: '#F5F5F7', borderRadius: '10px', fontSize: '13px', color: '#333' }}>
          <span style={{ color: '#999' }}>SKU:</span> {selectedProduct.sku} · {selectedProduct.name}
        </div>
      </div>

      <div style={{ marginBottom: '16px' }}>
        <DayTable 
          selectedProduct={selectedProduct} 
          selectedDay={selectedDay}
          onDaySelect={onDaySelect}
        />
      </div>

      <AIDecisionPanel 
        selectedProduct={selectedProduct}
        currentDayData={currentDayData}
        currentDay={selectedDay}
        onExecute={onExecute}
        onAbnormal={onAbnormal}
        currentUser={currentUser}
      />
    </div>
  );
};

export default App;
