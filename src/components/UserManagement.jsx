import React, { useState, useEffect } from 'react';
import { styles } from '../styles/theme';

const UserManagement = ({ currentUser, onClose }) => {
  const [users, setUsers] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newUser, setNewUser] = useState({
    name: '',
    password: '123456',
    role: 'operator',
    avatar: '👨‍💼',
    color: '#3b82f6'
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const avatarOptions = ['👨‍💼', '👩‍💼', '👨‍💻', '👩‍💻', '🧑‍💼', '👑', '🎯', '🚀'];
  const colorOptions = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#6366f1', '#14b8a6'];

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const response = await fetch('/api/users');
      const data = await response.json();
      setUsers(data);
    } catch (err) {
      console.error('加载用户失败:', err);
    }
  };

  const handleAddUser = async () => {
    if (!newUser.name) {
      setMessage('请输入用户名');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(newUser)
      });

      const data = await response.json();

      if (data.success) {
        setMessage('用户添加成功！');
        setShowAddModal(false);
        setNewUser({ name: '', password: '123456', role: 'operator', avatar: '👨‍💼', color: '#3b82f6' });
        loadUsers();
      } else {
        setMessage(data.error || '添加失败');
      }
    } catch (err) {
      setMessage('网络错误');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('确定要删除该用户吗？')) return;

    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await response.json();

      if (data.success) {
        loadUsers();
      } else {
        alert(data.error || '删除失败');
      }
    } catch (err) {
      alert('网络错误');
    }
  };

  const handleResetPassword = async (userId) => {
    if (!window.confirm('确定要重置该用户密码为 123456 吗？')) return;

    try {
      const response = await fetch(`/api/users/${userId}/reset-password`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await response.json();

      if (data.success) {
        alert('密码已重置为 123456');
      } else {
        alert(data.error || '重置失败');
      }
    } catch (err) {
      alert('网络错误');
    }
  };

  // 非管理员无法访问
  if (currentUser?.role !== 'admin') {
    return (
      <div style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
      }}>
        <div style={{
          background: '#1E293B',
          borderRadius: '16px',
          padding: '40px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔒</div>
          <h3 style={{ color: '#E2E8F0', marginBottom: '12px' }}>无权限访问</h3>
          <p style={{ color: '#64748B', marginBottom: '24px' }}>只有管理员可以管理用户</p>
          <button onClick={onClose} style={styles.buttonPrimary}>返回</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        background: 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)',
        borderRadius: '20px',
        border: '1px solid rgba(255,255,255,0.1)',
        width: '90%',
        maxWidth: '800px',
        maxHeight: '80vh',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* 标题栏 */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h2 style={{ margin: 0, color: '#E2E8F0', fontSize: '18px' }}>
            👥 用户管理
          </h2>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={() => setShowAddModal(true)}
              style={styles.buttonPrimary}
            >
              + 添加用户
            </button>
            <button
              onClick={onClose}
              style={{
                padding: '8px 16px',
                background: 'transparent',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '8px',
                color: '#94A3B8',
                cursor: 'pointer'
              }}
            >
              关闭
            </button>
          </div>
        </div>

        {/* 用户列表 */}
        <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>
          {message && (
            <div style={{
              padding: '12px 16px',
              background: message.includes('成功') ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
              border: `1px solid ${message.includes('成功') ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
              borderRadius: '8px',
              marginBottom: '16px',
              color: message.includes('成功') ? '#10B981' : '#F87171',
              fontSize: '13px'
            }}>
              {message}
            </div>
          )}

          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ padding: '12px', textAlign: 'left', color: '#64748B', fontSize: '12px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>用户</th>
                <th style={{ padding: '12px', textAlign: 'center', color: '#64748B', fontSize: '12px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>角色</th>
                <th style={{ padding: '12px', textAlign: 'center', color: '#64748B', fontSize: '12px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>创建时间</th>
                <th style={{ padding: '12px', textAlign: 'right', color: '#64748B', fontSize: '12px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>操作</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id}>
                  <td style={{ padding: '16px 12px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '10px',
                        background: user.color || '#3b82f6',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '20px'
                      }}>
                        {user.avatar}
                      </span>
                      <span style={{ color: '#E2E8F0', fontWeight: '600' }}>{user.name}</span>
                    </div>
                  </td>
                  <td style={{ padding: '16px 12px', textAlign: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <span style={{
                      padding: '4px 12px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      background: user.role === 'admin' ? 'rgba(255,107,53,0.15)' : 'rgba(59,130,246,0.15)',
                      color: user.role === 'admin' ? '#FF6B35' : '#3B82F6'
                    }}>
                      {user.role === 'admin' ? '管理员' : '运营'}
                    </span>
                  </td>
                  <td style={{ padding: '16px 12px', textAlign: 'center', color: '#64748B', fontSize: '13px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    {new Date(user.created_at).toLocaleDateString('zh-CN')}
                  </td>
                  <td style={{ padding: '16px 12px', textAlign: 'right', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    {user.id !== currentUser.id && (
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <button
                          onClick={() => handleResetPassword(user.id)}
                          style={{
                            padding: '6px 12px',
                            background: 'rgba(245,158,11,0.1)',
                            border: '1px solid rgba(245,158,11,0.3)',
                            borderRadius: '6px',
                            color: '#F59E0B',
                            fontSize: '12px',
                            cursor: 'pointer'
                          }}
                        >
                          重置密码
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          style={{
                            padding: '6px 12px',
                            background: 'rgba(239,68,68,0.1)',
                            border: '1px solid rgba(239,68,68,0.3)',
                            borderRadius: '6px',
                            color: '#EF4444',
                            fontSize: '12px',
                            cursor: 'pointer'
                          }}
                        >
                          删除
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 添加用户弹窗 */}
      {showAddModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1001
        }}>
          <div style={{
            background: '#1E293B',
            borderRadius: '16px',
            padding: '24px',
            width: '400px'
          }}>
            <h3 style={{ margin: '0 0 20px 0', color: '#E2E8F0' }}>添加用户</h3>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', color: '#94A3B8', fontSize: '13px', marginBottom: '6px' }}>用户名</label>
              <input
                type="text"
                value={newUser.name}
                onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                placeholder="请输入用户名"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  color: '#E2E8F0',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', color: '#94A3B8', fontSize: '13px', marginBottom: '6px' }}>初始密码</label>
              <input
                type="text"
                value={newUser.password}
                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  color: '#E2E8F0',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', color: '#94A3B8', fontSize: '13px', marginBottom: '6px' }}>角色</label>
              <select
                value={newUser.role}
                onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  color: '#E2E8F0',
                  fontSize: '14px'
                }}
              >
                <option value="operator">运营</option>
                <option value="admin">管理员</option>
              </select>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', color: '#94A3B8', fontSize: '13px', marginBottom: '6px' }}>头像</label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {avatarOptions.map(avatar => (
                  <button
                    key={avatar}
                    onClick={() => setNewUser({ ...newUser, avatar })}
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '8px',
                      border: newUser.avatar === avatar ? '2px solid #FF6B35' : '1px solid rgba(255,255,255,0.1)',
                      background: newUser.avatar === avatar ? 'rgba(255,107,53,0.1)' : 'transparent',
                      fontSize: '20px',
                      cursor: 'pointer'
                    }}
                  >
                    {avatar}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', color: '#94A3B8', fontSize: '13px', marginBottom: '6px' }}>颜色</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                {colorOptions.map(color => (
                  <button
                    key={color}
                    onClick={() => setNewUser({ ...newUser, color })}
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      border: newUser.color === color ? '2px solid #fff' : 'none',
                      background: color,
                      cursor: 'pointer'
                    }}
                  />
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setShowAddModal(false)}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: 'transparent',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '8px',
                  color: '#94A3B8',
                  cursor: 'pointer'
                }}
              >
                取消
              </button>
              <button
                onClick={handleAddUser}
                disabled={loading}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: 'linear-gradient(135deg, #FF6B35 0%, #F7931E 100%)',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#fff',
                  fontWeight: '600',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.7 : 1
                }}
              >
                {loading ? '添加中...' : '添加'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
