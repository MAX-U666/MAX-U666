import React, { useState, useEffect, useCallback } from 'react';

const ShopAuth = () => {
  const [assignments, setAssignments] = useState([]);
  const [shops, setShops] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedShops, setSelectedShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const isAdmin = currentUser.role === 'admin';

  const getHeaders = () => {
    const h = { 'Content-Type': 'application/json' };
    const token = localStorage.getItem('token');
    if (token) h['Authorization'] = `Bearer ${token}`;
    return h;
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/user-shops', { headers: getHeaders() });
      const data = await res.json();
      if (data.success) {
        if (isAdmin) {
          setAssignments(data.assignments || []);
          setShops(data.shops || []);
          setUsers(data.users || []);
        } else {
          setShops(data.shops || []);
        }
      }
    } catch (e) { console.error(e); }
    setLoading(false);
  }, [isAdmin]);

  useEffect(() => { loadData(); }, [loadData]);

  const selectUser = (user) => {
    setSelectedUser(user);
    const userShops = assignments.filter(a => a.user_id === user.id).map(a => a.shop_id);
    setSelectedShops(userShops);
    setMsg('');
  };

  const toggleShop = (shopId) => {
    setSelectedShops(prev =>
      prev.includes(shopId) ? prev.filter(s => s !== shopId) : [...prev, shopId]
    );
  };

  const saveAssignment = async () => {
    if (!selectedUser) return;
    setSaving(true);
    try {
      const res = await fetch('/api/user-shops/assign', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ userId: selectedUser.id, shopIds: selectedShops }),
      });
      const data = await res.json();
      if (data.success) {
        setMsg(`✅ 已保存，${selectedUser.name} 拥有 ${selectedShops.length} 个店铺权限`);
        loadData();
      } else {
        setMsg(`❌ ${data.error}`);
      }
    } catch (e) { setMsg(`❌ ${e.message}`); }
    setSaving(false);
  };

  // 非管理员：只看自己的店铺
  if (!isAdmin) {
    return (
      <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#1a1a1a', margin: '0 0 20px' }}>🏪 我的店铺</h2>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>加载中...</div>
        ) : shops.length === 0 ? (
          <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #E8E8ED', padding: '40px', textAlign: 'center', color: '#999' }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>🔒</div>
            <div>暂无授权店铺，请联系管理员分配</div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
            {shops.map(s => (
              <div key={s.shop_id} style={{
                background: '#fff', borderRadius: '12px', border: '1px solid #E8E8ED', padding: '16px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              }}>
                <div style={{ fontSize: '14px', fontWeight: '600', color: '#1a1a1a' }}>{s.shop_name || s.shop_id}</div>
                <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>ID: {s.shop_id}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // 管理员：分配店铺
  const userAssignmentMap = {};
  assignments.forEach(a => {
    if (!userAssignmentMap[a.user_id]) userAssignmentMap[a.user_id] = [];
    userAssignmentMap[a.user_id].push(a);
  });

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#1a1a1a', margin: 0 }}>🏪 店铺授权管理</h2>
          <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>
            给用户分配可访问的店铺，非管理员只能看到自己授权的数据
          </div>
        </div>
        <button onClick={loadData} disabled={loading} style={{
          padding: '8px 16px', borderRadius: '8px', border: 'none',
          background: '#F5F5F7', color: '#333', fontSize: '12px', cursor: 'pointer',
        }}>🔄 刷新</button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>加载中...</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '20px' }}>
          {/* 用户列表 */}
          <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #E8E8ED', overflow: 'hidden' }}>
            <div style={{ padding: '14px 16px', borderBottom: '1px solid #E8E8ED', fontSize: '13px', fontWeight: '600', color: '#333' }}>
              👥 用户列表 ({users.length})
            </div>
            {users.map(u => {
              const shopCount = (userAssignmentMap[u.id] || []).length;
              const isSelected = selectedUser?.id === u.id;
              return (
                <div key={u.id} onClick={() => selectUser(u)} style={{
                  padding: '12px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px',
                  background: isSelected ? 'rgba(255,107,53,0.06)' : '#fff',
                  borderBottom: '1px solid #F0F0F3',
                  borderLeft: isSelected ? '3px solid #FF6B35' : '3px solid transparent',
                }}>
                  <div style={{
                    width: '36px', height: '36px', borderRadius: '10px', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', fontSize: '16px',
                    background: `linear-gradient(135deg, ${u.color || '#3b82f6'}20, ${u.color || '#3b82f6'}08)`,
                  }}>{u.avatar || '👤'}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '13px', fontWeight: '600', color: '#1a1a1a' }}>{u.name}</div>
                    <div style={{ fontSize: '11px', color: '#999' }}>
                      {u.role === 'admin' ? '管理员 · 全部店铺' : `${shopCount} 个店铺`}
                    </div>
                  </div>
                  {shopCount > 0 && u.role !== 'admin' && (
                    <div style={{
                      padding: '2px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: '600',
                      background: '#10B98120', color: '#10B981',
                    }}>{shopCount}</div>
                  )}
                </div>
              );
            })}
          </div>

          {/* 店铺分配区 */}
          <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #E8E8ED', overflow: 'hidden' }}>
            {!selectedUser ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '300px', color: '#999' }}>
                ← 选择用户后分配店铺
              </div>
            ) : selectedUser.role === 'admin' ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '300px', color: '#999' }}>
                <div style={{ fontSize: '48px', marginBottom: '12px' }}>👑</div>
                <div style={{ fontWeight: '600', color: '#1a1a1a' }}>{selectedUser.name}</div>
                <div style={{ fontSize: '13px', marginTop: '4px' }}>管理员自动拥有全部店铺权限</div>
              </div>
            ) : (
              <>
                <div style={{ padding: '14px 16px', borderBottom: '1px solid #E8E8ED', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontSize: '13px', fontWeight: '600', color: '#333' }}>
                      {selectedUser.avatar} {selectedUser.name} 的店铺权限
                    </span>
                    <span style={{ fontSize: '12px', color: '#999', marginLeft: '8px' }}>
                      已选 {selectedShops.length}/{shops.length}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => setSelectedShops(shops.map(s => s.shop_id))}
                      style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #E8E8ED', background: '#F5F5F7', color: '#333', fontSize: '11px', cursor: 'pointer' }}>
                      全选
                    </button>
                    <button onClick={() => setSelectedShops([])}
                      style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #E8E8ED', background: '#F5F5F7', color: '#333', fontSize: '11px', cursor: 'pointer' }}>
                      清空
                    </button>
                    <button onClick={saveAssignment} disabled={saving}
                      style={{
                        padding: '6px 16px', borderRadius: '6px', border: 'none', fontSize: '11px', fontWeight: '600', cursor: 'pointer',
                        background: 'linear-gradient(135deg, #FF6B35, #F7931E)', color: '#fff',
                        opacity: saving ? 0.6 : 1,
                      }}>
                      {saving ? '保存中...' : '💾 保存'}
                    </button>
                  </div>
                </div>

                {msg && (
                  <div style={{
                    padding: '10px 16px', fontSize: '12px',
                    background: msg.startsWith('✅') ? 'rgba(16,185,129,0.06)' : 'rgba(239,68,68,0.06)',
                    color: msg.startsWith('✅') ? '#10B981' : '#EF4444',
                    borderBottom: '1px solid #E8E8ED',
                  }}>{msg}</div>
                )}

                <div style={{ padding: '16px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '10px', maxHeight: '500px', overflowY: 'auto' }}>
                  {shops.map(s => {
                    const isChecked = selectedShops.includes(s.shop_id);
                    return (
                      <div key={s.shop_id} onClick={() => toggleShop(s.shop_id)} style={{
                        padding: '12px 14px', borderRadius: '10px', cursor: 'pointer',
                        border: isChecked ? '2px solid #FF6B35' : '1px solid #E8E8ED',
                        background: isChecked ? 'rgba(255,107,53,0.04)' : '#FAFBFC',
                        display: 'flex', alignItems: 'center', gap: '10px',
                        transition: 'all 0.15s',
                      }}>
                        <div style={{
                          width: '20px', height: '20px', borderRadius: '6px', flexShrink: 0,
                          background: isChecked ? 'linear-gradient(135deg, #FF6B35, #F7931E)' : '#E8E8ED',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: '#fff', fontSize: '12px', fontWeight: '700',
                        }}>{isChecked ? '✓' : ''}</div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '13px', fontWeight: '600', color: '#1a1a1a' }}>{s.shop_name || s.shop_id}</div>
                          <div style={{ fontSize: '11px', color: '#999' }}>ID: {s.shop_id}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ShopAuth;
