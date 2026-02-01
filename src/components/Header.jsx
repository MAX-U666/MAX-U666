import React, { useState } from 'react';
import { GMVLogo } from './Logo';
import { styles } from '../styles/theme';

const Header = ({ 
  currentView, 
  setCurrentView, 
  currentUser, 
  setCurrentUser, 
  users, 
  selectedProduct,
  setSelectedProduct,
  countdown,
  setFilterOwner,
  onLogout,
  onUserManagement
}) => {
  const [showUserMenu, setShowUserMenu] = useState(false);

  return (
    <>
      <div style={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <GMVLogo size={44} />
            <div>
              <h1 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#1D1D1F' }}>Shopee GMV MAX</h1>
              <p style={{ margin: 0, fontSize: '11px', color: '#86868B' }}>AI决策中枢 · 系统博弈专家</p>
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
          <div style={{ background: 'rgba(255,107,53,0.1)', border: '1px solid rgba(255,107,53,0.2)', borderRadius: '12px', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FF6B35" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            <div>
              <div style={{ fontSize: '10px', color: '#86868B' }}>数据截止</div>
              <div style={{ fontSize: '18px', fontWeight: '800', color: '#FF6B35', fontFamily: '"SF Mono", monospace' }}>
                {String(countdown.hours).padStart(2, '0')}:{String(countdown.minutes).padStart(2, '0')}:{String(countdown.seconds).padStart(2, '0')}
              </div>
            </div>
          </div>
          
          {/* Day指示器 */}
          {selectedProduct && currentView === 'detail' && (
            <div style={{ background: 'rgba(0,0,0,0.04)', borderRadius: '12px', padding: '10px 16px', border: '1px solid rgba(0,0,0,0.06)' }}>
              <span style={{ fontSize: '11px', color: '#86868B' }}>执行 </span>
              <span style={{ fontSize: '22px', fontWeight: '800', color: '#FF6B35' }}>Day {selectedProduct.current_day}</span>
              <span style={{ fontSize: '13px', color: '#475569' }}>/7</span>
            </div>
          )}
          
          {/* 用户菜单 */}
          <div style={{ position: 'relative' }}>
            <button onClick={() => setShowUserMenu(!showUserMenu)} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 14px', borderRadius: '12px', border: '1px solid #E5E5EA', background: 'rgba(0,0,0,0.02)', color: '#fff', cursor: 'pointer' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: `linear-gradient(135deg, ${currentUser?.color || '#3b82f6'}60, ${currentUser?.color || '#3b82f6'}30)`, border: `1px solid ${currentUser?.color || '#3b82f6'}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>{currentUser?.avatar || '👤'}</div>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: '13px', fontWeight: '600' }}>{currentUser?.name || '用户'}</div>
                <div style={{ fontSize: '10px', color: '#86868B' }}>{currentUser?.role === 'admin' ? '管理员' : '运营'}</div>
              </div>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#86868B" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
            </button>
            
            {showUserMenu && (
              <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: '8px', background: 'linear-gradient(180deg, #FFFFFF 0%, #F5F5F7 100%)', borderRadius: '14px', border: '1px solid #E5E5EA', boxShadow: '0 20px 60px rgba(0,0,0,0.5)', padding: '10px', minWidth: '220px', zIndex: 1000 }}>
                <div style={{ padding: '10px 14px', fontSize: '11px', color: '#86868B', borderBottom: '1px solid rgba(0,0,0,0.06)', marginBottom: '8px' }}>切换用户</div>
                {users.map(user => (
                  <button key={user.id} onClick={() => { setCurrentUser(user); setShowUserMenu(false); setFilterOwner('mine'); }} style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%', padding: '12px 14px', borderRadius: '10px', border: 'none', background: currentUser?.id === user.id ? 'rgba(255,107,53,0.1)' : 'transparent', cursor: 'pointer', textAlign: 'left' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: `linear-gradient(135deg, ${user.color}50, ${user.color}20)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>{user.avatar}</div>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: '600', color: '#1D1D1F' }}>{user.name}</div>
                      <div style={{ fontSize: '10px', color: '#86868B' }}>{user.role === 'admin' ? '管理员' : '运营'}</div>
                    </div>
                    {currentUser?.id === user.id && <span style={{ marginLeft: 'auto', color: '#FF6B35' }}>✓</span>}
                  </button>
                ))}
                
                {/* 分隔线 */}
                <div style={{ height: '1px', background: 'rgba(0,0,0,0.06)', margin: '8px 0' }} />
                
                {/* 用户管理（仅管理员） */}
                {currentUser?.role === 'admin' && (
                  <button 
                    onClick={() => { setShowUserMenu(false); onUserManagement && onUserManagement(); }} 
                    style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%', padding: '12px 14px', borderRadius: '10px', border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left' }}
                  >
                    <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(59,130,246,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>👥</div>
                    <div style={{ fontSize: '13px', fontWeight: '600', color: '#3B82F6' }}>用户管理</div>
                  </button>
                )}
                
                {/* 退出登录 */}
                <button 
                  onClick={() => { setShowUserMenu(false); onLogout && onLogout(); }} 
                  style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%', padding: '12px 14px', borderRadius: '10px', border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left' }}
                >
                  <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(239,68,68,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>🚪</div>
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

