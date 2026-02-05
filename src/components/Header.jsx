import React, { useState } from 'react';
import { GMVLogo } from './Logo';
import { styles } from '../styles/theme';

const Header = ({ 
  currentView, 
  setCurrentView, 
  currentUser, 
  selectedProduct,
  setSelectedProduct,
  countdown,
  onLogout,
  onUserManagement,
  onShopAuth
}) => {
  const [showUserMenu, setShowUserMenu] = useState(false);

  return (
    <>
      <div style={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <GMVLogo size={44} />
            <div>
              <h1 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#1a1a1a' }}>Shopee GMV MAX</h1>
              <p style={{ margin: 0, fontSize: '11px', color: '#999' }}>AI决策中枢 · 系统博弈专家</p>
            </div>
          </div>
          {currentView === 'detail' && (
            <button onClick={() => { setCurrentView('dashboard'); setSelectedProduct(null); }} style={styles.buttonSecondary}>
              ← 返回工作台
            </button>
          )}
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {/* 倒计时 */}
          <div style={{ background: 'rgba(255,107,53,0.08)', border: '1px solid rgba(255,107,53,0.15)', borderRadius: '12px', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FF6B35" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            <div>
              <div style={{ fontSize: '10px', color: '#999' }}>数据截止</div>
              <div style={{ fontSize: '18px', fontWeight: '800', color: '#FF6B35', fontFamily: '"SF Mono", monospace' }}>
                {String(countdown.hours).padStart(2, '0')}:{String(countdown.minutes).padStart(2, '0')}:{String(countdown.seconds).padStart(2, '0')}
              </div>
            </div>
          </div>
          
          {/* Day指示器 */}
          {selectedProduct && currentView === 'detail' && (
            <div style={{ background: '#F5F5F7', borderRadius: '12px', padding: '10px 16px', border: '1px solid #E8E8ED' }}>
              <span style={{ fontSize: '11px', color: '#999' }}>执行 </span>
              <span style={{ fontSize: '22px', fontWeight: '800', color: '#FF6B35' }}>Day {selectedProduct.current_day}</span>
              <span style={{ fontSize: '13px', color: '#999' }}>/7</span>
            </div>
          )}
          
          {/* 用户菜单 */}
          <div style={{ position: 'relative' }}>
            <button onClick={() => setShowUserMenu(!showUserMenu)} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 14px', borderRadius: '12px', border: '1px solid #E8E8ED', background: '#F5F5F7', color: '#333', cursor: 'pointer' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: `linear-gradient(135deg, ${currentUser?.color || '#3b82f6'}40, ${currentUser?.color || '#3b82f6'}15)`, border: `1px solid ${currentUser?.color || '#3b82f6'}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>{currentUser?.avatar || '👤'}</div>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: '13px', fontWeight: '600', color: '#1a1a1a' }}>{currentUser?.name || '用户'}</div>
                <div style={{ fontSize: '10px', color: '#999' }}>{currentUser?.role === 'admin' ? '管理员' : '运营'}</div>
              </div>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
            </button>
            
            {showUserMenu && (
              <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: '8px', background: '#FFFFFF', borderRadius: '14px', border: '1px solid #E8E8ED', boxShadow: '0 10px 40px rgba(0,0,0,0.12)', padding: '10px', minWidth: '200px', zIndex: 1000 }}>
                {/* 当前用户信息 */}
                <div style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1px solid #F0F0F3', marginBottom: '8px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: `linear-gradient(135deg, ${currentUser?.color || '#3b82f6'}40, ${currentUser?.color || '#3b82f6'}15)`, border: `1px solid ${currentUser?.color || '#3b82f6'}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>{currentUser?.avatar || '👤'}</div>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: '700', color: '#1a1a1a' }}>{currentUser?.name || '用户'}</div>
                    <div style={{ fontSize: '11px', color: '#999' }}>{currentUser?.role === 'admin' ? '管理员' : '运营'}</div>
                  </div>
                </div>
                
                {currentUser?.role === 'admin' && (
                  <button 
                    onClick={() => { setShowUserMenu(false); onUserManagement && onUserManagement(); }} 
                    style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%', padding: '12px 14px', borderRadius: '10px', border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left' }}
                  >
                    <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(59,130,246,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>👥</div>
                    <div style={{ fontSize: '13px', fontWeight: '600', color: '#3B82F6' }}>用户管理</div>
                  </button>
                )}

                {currentUser?.role === 'admin' && (
                  <button 
                    onClick={() => { setShowUserMenu(false); onShopAuth && onShopAuth(); }} 
                    style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%', padding: '12px 14px', borderRadius: '10px', border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left' }}
                  >
                    <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(16,185,129,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>🔐</div>
                    <div style={{ fontSize: '13px', fontWeight: '600', color: '#10B981' }}>店铺授权</div>
                  </button>
                )}
                
                <button 
                  onClick={() => { setShowUserMenu(false); onLogout && onLogout(); }} 
                  style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%', padding: '12px 14px', borderRadius: '10px', border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left' }}
                >
                  <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>🚪</div>
                  <div style={{ fontSize: '13px', fontWeight: '600', color: '#EF4444' }}>退出登录</div>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {showUserMenu && <div onClick={() => setShowUserMenu(false)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 99 }} />}
    </>
  );
};

export default Header;
